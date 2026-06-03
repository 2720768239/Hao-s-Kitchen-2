export function jsonError(status: number, message: string, details?: unknown) {
  return Response.json({ error: message, details }, { status });
}
