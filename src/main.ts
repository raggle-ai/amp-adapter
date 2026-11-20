#!/usr/bin/env node
// CLI entry: dry run by default, `--apply` executes `amp projects create` per repository.
import { applyAmpProjects, planFromRaggleCatalog } from "./index";

const apply = process.argv.includes("--apply");
const asJson = process.argv.includes("--json");

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });

async function main() {
  // Catalog warnings print to stdout during load; silence them so --json stays pure.
  const log = console.log;
  if (asJson) console.log = () => {};
  const { plan } = await planFromRaggleCatalog();
  console.log = log;

  if (asJson) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  console.log(`Raggle → Amp project plan (${apply ? "APPLY" : "dry run"})\n`);
  for (const item of plan.items) {
    const shared = item.raggleProjectCount > 1 ? ` (${item.raggleProjectCount} worktrees)` : "";
    console.log(`  [${item.status.padEnd(15)}] ${item.projectName}${shared} → ${item.command}`);
  }
  console.log(
    `\nSummary: ${plan.summary.create} to create, ${plan.summary["already-in-amp"]} already mapped, ${plan.summary["no-remote"]} without remote`,
  );

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to create the Amp projects.");
    return;
  }
  const { created, skipped } = await applyAmpProjects(plan);
  console.log(`\nApplied: created ${created.length} Amp projects: ${created.join(", ")}`);
  console.log(`Skipped: ${skipped.length} (already mapped, inside another repo, or no remote)`);
}
