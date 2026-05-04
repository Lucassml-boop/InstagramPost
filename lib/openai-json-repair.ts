export function fixMalformedJSON(jsonString: string): string {
  let fixed = jsonString;

  fixed = fixed
    .replace(/\/\/.*?$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  fixed = fixed.replace(/"([^"]*(?:\\.[^"]*)*)":/g, (match, content) => {
    const escaped = content
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `"${escaped}":`;
  });

  fixed = fixed.replace(/:\s*"([^"]*(?:\\.[^"]*)*)"/g, (match, content) => {
    const escaped = content
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `: "${escaped}"`;
  });

  return fixed
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*]\s*/g, "]");
}

export function parseGeneratedPostJson(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch (initialError) {
    const fixedJson = fixMalformedJSON(jsonString);

    try {
      return JSON.parse(fixedJson);
    } catch (repairedError) {
      const initialMessage =
        initialError instanceof Error ? initialError.message : String(initialError);
      const repairedMessage =
        repairedError instanceof Error ? repairedError.message : String(repairedError);

      throw new Error(
        `Generated JSON could not be parsed. Initial parse: ${initialMessage}. Repaired parse: ${repairedMessage}.`
      );
    }
  }
}

export function extractJsonPayload(content: string) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, "");
  return withoutOpeningFence.replace(/\s*```$/, "").trim();
}
