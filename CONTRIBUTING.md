# Contributing

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run check
```

If you changed the UI, also run:

```bash
npx playwright install chromium
npm run test:e2e
```

## Conventions

- Business rules go in `packages/core` as pure functions, with the date passed in.
- External systems go in `packages/integrations`, taking `fetch` as an option.
- Data crossing a boundary goes through a Zod schema.
- Code and docs are in English. The interface is in Spanish.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org).
- Never commit tokens or real study data. Use `.env`, which is ignored by Git.
