import React, { useCallback, useState } from "react";
import { Download, FileUp, FlaskConical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploadCard from "@/components/FileUploadCard";
import ValidationResultDetails from "@/components/ValidationResultDetails";
import { mockResponses } from "@/data/mockResponses";
import { runValidator } from "@/services/validator";
import { ValidationResponse } from "@/types/validation";

type MockKey = "VALID" | "INVALID" | "ERROR_INSTANCE";

const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });

const SingleValidationView: React.FC = () => {
  const [instanceFile, setInstanceFile] = useState<File | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [instanceText, setInstanceText] = useState<string>("");
  const [submissionText, setSubmissionText] = useState<string>("");
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const handleInstanceSelect = useCallback(async (file: File) => {
    setInstanceFile(file);
    setInstanceText(await readFile(file));
  }, []);

  const handleSubmissionSelect = useCallback(async (file: File) => {
    setSubmissionFile(file);
    setSubmissionText(await readFile(file));
  }, []);

  const handleValidate = async () => {
    if (!instanceText || !submissionText) return;
    setLoading(true);
    setRuntimeError(null);
    setResult(null);
    try {
      const res = await runValidator(instanceText, submissionText);
      setResult(res);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "Unexpected validator runtime failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleMock = (key: MockKey) => {
    setRuntimeError(null);
    setResult(mockResponses[key]);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "validation-report.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {runtimeError && (
        <div role="alert" className="rounded-lg border border-destructive p-4 text-destructive">
          {runtimeError}
        </div>
      )}
      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileUploadCard
            label="Input Instance"
            description="Upload the problem instance file (.txt)"
            file={instanceFile}
            onFileSelect={handleInstanceSelect}
            onFileRemove={() => {
              setInstanceFile(null);
              setInstanceText("");
            }}
          />
          <FileUploadCard
            label="Submission"
            description="Upload the submission file (.txt)"
            file={submissionFile}
            onFileSelect={handleSubmissionSelect}
            onFileRemove={() => {
              setSubmissionFile(null);
              setSubmissionText("");
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={handleValidate}
            disabled={!instanceText || !submissionText || loading}
            size="lg"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {loading ? "Validating..." : "Validate"}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mock:</span>
            {(["VALID", "INVALID", "ERROR_INSTANCE"] as MockKey[]).map((key) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handleMock(key)}
                className="gap-1.5 text-xs"
              >
                <FlaskConical className="h-3 w-3" />
                {key.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {!result && (
        <section className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card px-6 py-16 text-center">
          <FileUp className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">No validation yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Upload an input instance and submission file, then press <strong>Validate</strong> to
            review the report. Or try the <strong>Mock</strong> buttons to preview the interface.
          </p>
        </section>
      )}

      {result && (
        <>
          <ValidationResultDetails result={result} />

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SingleValidationView;
