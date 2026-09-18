export type HealthResponse = { status: "ok" };

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiError };
