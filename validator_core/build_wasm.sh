em++ -std=c++17 \
  -Iinclude \
  -Ithird_party \
  src/engine/validator_engine.cc \
  src/parsers/instance_parser.cc \
  src/parsers/submission_parser.cc \
  src/validation/instance_validator.cc \
  src/validation/submission_format_validator.cc \
  src/validation/submission_semantic_validator.cc \
  src/scoring/score_calculator.cc \
  src/serialization/json_serialization.cc \
  src/wasm/wasm_api.cc \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s STACK_SIZE=16777216 \
  -s INITIAL_MEMORY=268435456 \
  -s MAXIMUM_MEMORY=1073741824 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_validate","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","lengthBytesUTF8","stringToUTF8"]' \
  -O2 \
  -o ../validator_clipp/public/wasm/validator.js
