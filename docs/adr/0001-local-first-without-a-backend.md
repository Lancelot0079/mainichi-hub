# 1. Local-first, without a backend

**Status:** Accepted

## Context

The hub is used by one person on a PC and a phone. It needs persistence, sync and scheduled work,
and it should cost nothing to keep running for years.

## Decision

The app is a static PWA that keeps its state on the device. GitHub Pages hosts it, a private
repository stores data, and GitHub Actions runs scheduled work.

## Consequences

- There is no server to patch, pay for or keep alive, and the app works offline.
- Data is plain JSON with full Git history, which doubles as a backup.
- Scheduled work inherits GitHub's limits: runs can be delayed, and data is at best about an hour
  old.
- Supporting many users would need a real backend. `FileStore` keeps that change contained.

## Alternatives

- **Cloudflare Workers with D1:** more punctual schedules, but another account and more code.
- **Browser storage only:** simplest, but no sync, and alerts could not know whether you studied.
