import { useMemo } from "react";
import { parseAndValidate } from "../services/parser";

export function useParser(code) {
  return useMemo(() => parseAndValidate(code), [code]);
}
