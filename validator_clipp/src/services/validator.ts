import { ValidationResponse } from "@/types/validation";

let wasmModulePromise: Promise<any> | null = null;

async function getWasmModule() {
  if (!wasmModulePromise) {
    const moduleUrl = `${window.location.origin}/wasm/validator.js`;

    wasmModulePromise = import(/* @vite-ignore */ moduleUrl).then(async (mod) => {
      const factory = mod.default;
      return await factory({
        locateFile: (path: string) => `/wasm/${path}`,
      });
    }).catch((error) => {
      wasmModulePromise = null;
      throw error;
    });
  }

  return wasmModulePromise;
}

export async function runValidator(
  instanceText: string,
  submissionText: string
): Promise<ValidationResponse> {
  let wasm: any;
  let instancePointer = 0;
  let submissionPointer = 0;
  try {
    wasm = await getWasmModule();
    const instanceSize = wasm.lengthBytesUTF8(instanceText) + 1;
    const submissionSize = wasm.lengthBytesUTF8(submissionText) + 1;
    instancePointer = wasm._malloc(instanceSize);
    if (!instancePointer) {
      throw new Error(`Unable to allocate ${instanceSize} bytes for the instance.`);
    }
    submissionPointer = wasm._malloc(submissionSize);
    if (!submissionPointer) {
      throw new Error(`Unable to allocate ${submissionSize} bytes for the submission.`);
    }

    wasm.stringToUTF8(instanceText, instancePointer, instanceSize);
    wasm.stringToUTF8(submissionText, submissionPointer, submissionSize);
    const resultJson = wasm.ccall(
      "validate",
      "string",
      ["number", "number"],
      [instancePointer, submissionPointer]
    );
    if (!resultJson) throw new Error("The validator returned an empty result.");
    return JSON.parse(resultJson) as ValidationResponse;
  } catch (error) {

    wasmModulePromise = null;
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`WASM runtime/allocation failure: ${detail}`);
  } finally {
    if (submissionPointer) wasm._free(submissionPointer);
    if (instancePointer) wasm._free(instancePointer);
  }
}
