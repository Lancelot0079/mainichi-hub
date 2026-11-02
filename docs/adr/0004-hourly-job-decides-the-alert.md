# 4. An hourly job decides which alert is due

**Status:** Accepted

## Context

GitHub documents that scheduled workflows can be delayed under load and that queued jobs may be
dropped. One cron line per alert would silently lose that day's alert when a run is dropped.

## Decision

The workflow runs every hour. Each run works out from the local time and `alertsSent` whether an
alert is due. The morning alert stays valid for five hours, and the evening alert until midnight.

## Consequences

- A dropped run postpones an alert by an hour instead of losing it.
- Reruns are safe, because each alert is recorded once sent.
- WaniKani data stays fresh as a side effect.
- Hourly runs add commits to the private data repository, which is an acceptable cost.
- Scheduled workflows stop after 60 days without repository activity, so the dashboard warns when
  the snapshot is more than a day old.
