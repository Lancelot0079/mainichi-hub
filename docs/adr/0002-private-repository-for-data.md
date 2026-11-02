# 2. A private repository for personal data

**Status:** Accepted

## Context

The code is public, but progress data and diary entries are personal. The browser needs a place to
read and write them with a credential of limited reach.

## Decision

Data lives in a separate private repository, accessed with a fine-grained token restricted to that
repository and to the Contents permission.

## Consequences

- If the token leaks, only study data is exposed, and it can be revoked without affecting anything
  else.
- The token sits in the browser's local storage, so a strict Content Security Policy and the absence
  of third-party scripts matter.
- Every sync is a commit, so history grows. That is acceptable for small JSON files.

## Alternatives

- **Secret gists:** rejected. GitHub states they are not private, and anyone with the URL can read
  them, which is the wrong guarantee for a diary.
- **A branch in the public repository:** rejected, because it publishes the data.
