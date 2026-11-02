/** Injected instead of the global so every client can be tested without a network. */
export type Fetch = typeof globalThis.fetch;

export class HttpError extends Error {
  constructor(
    readonly service: string,
    readonly status: number,
  ) {
    super(`${service} respondió ${status}`);
    this.name = "HttpError";
  }
}
