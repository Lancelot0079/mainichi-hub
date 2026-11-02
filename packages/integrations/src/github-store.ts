import { HttpError, type Fetch } from "./http";

export interface StoredFile<T> {
  value: T;
  /** Git blob SHA. Sent back on write so GitHub rejects a stale overwrite. */
  sha: string;
}

/** Port for durable JSON files, so storage can move off GitHub without touching callers. */
export interface FileStore {
  read(path: string): Promise<StoredFile<unknown> | null>;
  write(path: string, value: unknown, sha: string | null, message: string): Promise<string>;
}

export class ConflictError extends Error {
  constructor(path: string) {
    super(`${path} cambió en el repositorio`);
    this.name = "ConflictError";
  }
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(encoded: string): string {
  const binary = atob(encoded.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export interface GitHubStoreOptions {
  /** `owner/name` of the private data repository. */
  repo: string;
  token: string;
  fetch?: Fetch;
}

/** Stores JSON files in a private repository through the GitHub Contents API. */
export class GitHubFileStore implements FileStore {
  private readonly fetch: Fetch;

  constructor(private readonly options: GitHubStoreOptions) {
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  private url(path: string) {
    return `https://api.github.com/repos/${this.options.repo}/contents/${path}`;
  }

  private headers(accept = "application/vnd.github+json") {
    return {
      Accept: accept,
      Authorization: `Bearer ${this.options.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  async read(path: string): Promise<StoredFile<unknown> | null> {
    const res = await this.fetch(this.url(path), { headers: this.headers(), cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new HttpError("GitHub", res.status);
    const file = (await res.json()) as { content?: string; encoding?: string; sha: string };
    // The Contents API omits inline content for files over 1 MB.
    if (file.encoding === "base64" && file.content) {
      return { value: JSON.parse(decodeBase64(file.content)), sha: file.sha };
    }
    const raw = await this.fetch(this.url(path), {
      headers: this.headers("application/vnd.github.raw+json"),
      cache: "no-store",
    });
    if (!raw.ok) throw new HttpError("GitHub", raw.status);
    return { value: await raw.json(), sha: file.sha };
  }

  async write(path: string, value: unknown, sha: string | null, message: string): Promise<string> {
    const res = await this.fetch(this.url(path), {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: encodeBase64(JSON.stringify(value, null, 2)),
        ...(sha ? { sha } : {}),
      }),
    });
    if (res.status === 409 || res.status === 422) throw new ConflictError(path);
    if (!res.ok) throw new HttpError("GitHub", res.status);
    const body = (await res.json()) as { content: { sha: string } };
    return body.content.sha;
  }
}
