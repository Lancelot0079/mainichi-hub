# Architecture

## Goals

1. Usable offline, on any device, from day one.
2. No server to run or pay for.
3. Code that is public without exposing any personal data.
4. A new platform or alert channel should touch as little code as possible.

## Layers

Dependencies point inward. `core` knows nothing about browsers, HTTP or GitHub.

```mermaid
flowchart TD
  web["apps/web"] --> integrations["packages/integrations"]
  sync["apps/sync"] --> integrations
  web --> core["packages/core"]
  sync --> core
  integrations --> core
```

- **`packages/core`** holds the rules: scheduling, streaks, merging, schemas, the daily plan and the
  alert text. All functions are pure and receive the date as an argument, so they are simple to
  test and behave the same in the browser and in the scheduled job.
- **`packages/integrations`** adapts external systems. Each client takes `fetch` as an option, and
  `FileStore` and `Notifier` are the ports that other implementations can fill.
- **`apps/web`** is organized by feature. `state/store.ts` is the only writer of app state, and
  `state/actions.ts` holds every user mutation.
- **`apps/sync`** is the scheduled composition root. `run.ts` holds the logic with injected
  dependencies, and `main.ts` wires up real clients.

## Data

The private repository has two files, each with a single writer, so the browser and the job can
never conflict with each other.

| File            | Writer        | Content                                         |
| --------------- | ------------- | ----------------------------------------------- |
| `state.json`    | Browsers      | Progress, cards, diary, settings, Anki stats    |
| `snapshot.json` | Scheduled job | WaniKani data, active days, errors, alerts sent |

## Sync between devices

```mermaid
sequenceDiagram
  participant Device
  participant GitHub as Data repository
  Device->>GitHub: Read state.json and its SHA
  Device->>Device: Merge local and remote
  Device->>GitHub: Write merged state with that SHA
  alt Another device wrote first
    GitHub-->>Device: 409 Conflict
    Device->>GitHub: Read again, merge again, retry
  else SHA still current
    GitHub-->>Device: 200 OK
  end
```

Merge rules:

| Data            | Rule                                                    |
| --------------- | ------------------------------------------------------- |
| Routine blocks  | Newest edit per block                                   |
| Logged sessions | Union by id; deletion wins                              |
| Kana records    | The record with more attempts, since attempts only grow |
| Unlocked rows   | Maximum                                                 |
| Cards, diary    | Newest edit by id; deletion wins ties                   |
| Settings        | Latest state                                            |

Deletions are stored as tombstones (`deletedAt`) because a missing item looks the same as one the
other device just created.

## Daily job

```mermaid
flowchart TD
  A["Hourly run"] --> B["Read state and last snapshot"]
  B --> C{"WaniKani refresh works?"}
  C -->|Yes| D["Use fresh data"]
  C -->|No| E["Keep previous data, record error"]
  D --> F{"Alert due and not sent today?"}
  E --> F
  F -->|Yes| G["Compose and send"]
  F -->|No| H["Save snapshot"]
  G --> H
```

Failure behavior:

- A failing connector keeps the old value and adds a warning to the alert, because a slightly stale
  reminder is better than none.
- If the notifier fails, the job fails without recording the alert, so the next run tries again.
- Evening alerts are skipped when the user already studied.
- Job logs are public, so they contain only outcomes and never study data.

## Trade-offs

- **Hourly data, not live.** WaniKani counts can be up to an hour old between runs.
- **Scheduling is best effort.** GitHub Actions can delay runs, so alert times are approximate.
- **Anki needs the PC.** AnkiConnect is local, so Anki data refreshes only with Anki open.
- **Single user.** The design assumes one person per deployment. Multiple users would need real
  authentication and a database, and `FileStore` is the seam for that move.
