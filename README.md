# @raggle-ai/amp-adapter

Initialize Raggle projects inside [Amp](https://ampcode.com) from the Raggle project catalog.

```sh
npx amp-project-init           # dry run — prints the plan
npx amp-project-init --apply   # create the Amp projects
```

## How it connects to Raggle Scout (best practices)

Every Raggle adapter should follow the same pattern:

1. **Reuse the catalog — never re-scan.** Load the user's projects from Scout via `@raggle-ai/local` (`loadUserProjects`), don't reimplement discovery.
2. **Normalize remotes through local.** Use `remoteToHttpsClone` to turn `git@…:`/`ssh://` remotes into cloneable HTTPS URLs instead of writing your own converter.
3. **Plan/apply split.** A read-only `plan*()` returns the diff (create / already-mapped / no-remote) and an `apply*()` mutates. Never mutate from a dry run.
4. **Idempotent.** Running apply twice must produce no changes — always check the target's existing state first and skip what's already mapped.
5. **Dry run first, `--apply` to act.** The CLI defaults to printing; acting requires an explicit flag.
6. **Depend on `@raggle-ai/local` from npm**, not a workspace path, so the package works standalone.

## Raggle adapters so far

| Repo | What it does |
|------|--------------|
| [amp-adapter](https://github.com/raggle-ai/amp-adapter) | Create Raggle projects inside Amp |
| [pi-adapter](https://github.com/raggle-ai/pi-adapter) | Pi extension that loads `rgl llm` context into every session |
| [opencode-adapter](https://github.com/raggle-ai/opencode-adapter) | OpenCode plugin injecting `rgl llm` context into every chat request |
| [t3-code-adapter](https://github.com/raggle-ai/t3-code-adapter) | Find every project, open the right one (T3 Code) |
| [herdr-adapter](https://github.com/raggle-ai/herdr-adapter) | Open discovered Raggle projects in Herdr |
| [cmux-adapter](https://github.com/raggle-ai/cmux-adapter) | Import Raggle folders into CMUX command palette |
| [vscode-adapter](https://github.com/raggle-ai/vscode-adapter) | Search Scout projects in VS Code Quick Pick |
| [raycast-adapter](https://github.com/raggle-ai/raycast-adapter) | Raycast integration |
| [omarchy-adapter](https://github.com/raggle-ai/omarchy-adapter) | Omarchy integration |

## Development

```sh
npm install
npm test        # build + node:test
npm run dry-run # print the plan locally
```

## License

MIT
