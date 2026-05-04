export async function runAutomationAction(input: {
  endpoint: string;
  method: "GET" | "POST";
  body?: string;
}) {
  const response = await fetch(input.endpoint, {
    method: input.method,
    headers: input.body ? { "Content-Type": "application/json" } : undefined,
    body: input.body
  });

  const text = await response.text();
  const parsed = (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  })();

  return {
    response,
    text,
    parsed,
    formatted: parsed ? JSON.stringify(parsed, null, 2) : text
  };
}
