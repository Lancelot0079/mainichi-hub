import { emptySnapshot, hubStateSchema, mergeStates, snapshotSchema } from "@mainichi/core";
import type { HubState, Snapshot } from "@mainichi/core";
import { ConflictError, type FileStore } from "./github-store";

export const STATE_FILE = "state.json";
export const SNAPSHOT_FILE = "snapshot.json";

const MAX_ATTEMPTS = 4;

export async function readRemoteState(store: FileStore) {
  const file = await store.read(STATE_FILE);
  return file ? { state: hubStateSchema.parse(file.value), sha: file.sha } : null;
}

export async function readRemoteSnapshot(store: FileStore): Promise<Snapshot> {
  const file = await store.read(SNAPSHOT_FILE);
  return file ? snapshotSchema.parse(file.value) : emptySnapshot();
}

/**
 * Merges `local` with what is stored and writes the result. Another device may write in between,
 * in which case GitHub rejects the SHA and the merge repeats on top of that newer version.
 */
export async function pushState(store: FileStore, local: HubState, at: string): Promise<HubState> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remote = await readRemoteState(store);
    const merged = remote ? mergeStates(local, remote.state) : local;
    if (remote && JSON.stringify(merged) === JSON.stringify(remote.state)) return merged;
    try {
      await store.write(STATE_FILE, merged, remote?.sha ?? null, `sync: ${at}`);
      return merged;
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
