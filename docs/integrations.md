# Integrations

Each platform connects as far as it officially allows. The hub does not scrape sites or reuse
session cookies, because that breaks often and can violate terms of service.

| Platform | Mode      | Data in the hub                                          |
| -------- | --------- | -------------------------------------------------------- |
| WaniKani | Automatic | Level, reviews, lessons, SRS stages, activity today      |
| Anki     | Local     | Due and total cards, reviews per day; can receive cards  |
| Bunpro   | Manual    | Direct link and logged time                              |
| Udemy    | Manual    | Direct link to your course, lessons done and logged time |
| Busuu    | Manual    | Direct link, lessons done and logged time                |
| Genki    | Manual    | Lessons done and logged time                             |

## Why some are manual

- **Udemy:** no public API for a learner's own progress was found. The APIs that exist serve
  instructors and Udemy Business customers.
- **Busuu:** no public developer documentation for learner data was found.
- **Bunpro:** there is no official public API. Community tools use the site's internal frontend
  token, which expires within days or weeks and can change without notice.

Manual does not mean disconnected. These resources have deep links, count toward the daily routine
and show up in the reports. If a platform publishes an API, it becomes a new connector.

## Adding a connector

1. Add a client in `packages/integrations`, taking `fetch` as an option so tests need no network.
2. Validate its responses with a Zod schema.
3. Add its data to `snapshotSchema` in `packages/core`.
4. Call it from `runSync` in `apps/sync`, so a failure degrades the alert rather than cancelling it.
5. Change its `mode` in `packages/core/src/resources.ts`.

## Adding an alert channel

Implement the `Notifier` interface from `packages/integrations/src/notifier.ts`, then select it in
`apps/sync/src/main.ts`.

## Verification status

The WaniKani, AnkiConnect and ntfy clients are tested against fakes built from their documentation.
Confirm each one against the real service during setup.
