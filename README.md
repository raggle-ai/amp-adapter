# @raggle-ai/adapters-amp

Maps the Raggle project catalog to Amp projects (`amp projects create`) so every Raggle project opens as an Amp project at ampcode.com.

- `npm run dry-run` — plan only: lists each repository, its status (`create` / `already-in-amp` / `no-remote`), the exact command Amp would run, and the total count.
- `node dist/main.js --apply` — executes `amp projects create <https-url>` for every new repository.
- `--json` — machine-readable plan.

Requires the Amp CLI installed and signed in (`amp login`). Repositories without a git remote are reported for the manual `amp projects create --push` path; the adapter never mutates local git state.
