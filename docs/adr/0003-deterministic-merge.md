# 3. Deterministic merge instead of last write wins

**Status:** Accepted

## Context

Two devices can edit offline. With last-write-wins on the whole file, reviewing cards on the phone
would silently erase what was logged on the PC.

## Decision

Each field has an explicit, order-independent merge rule, implemented as a pure function. Deletions
are tombstones. GitHub's blob SHA detects concurrent writes, and a rejected write merges and retries.

## Consequences

- Devices converge regardless of the order of writes, and the property is covered by tests.
- Tombstones stay in the file. Purging old ones can come later if size becomes a problem.
- Timestamps come from device clocks, so a badly wrong clock can win a tie on a single item. The
  impact is limited to that item.

## Alternatives

- **A CRDT library:** stronger guarantees than this data needs, at the cost of a dependency and an
  opaque file format.
