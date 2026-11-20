import { loadUserProjects, remoteToHttpsClone, type LocalProject } from "@raggle-ai/local";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type AmpProjectPlanItem = {
  /** Normalized HTTPS clone URL passed to `amp projects create`. */
  repositoryUrl: string;
  /** Display name of the first Raggle project that maps to this repository. */
  projectName: string;
  /** How many Raggle projects (worktrees) share this repository. */
  raggleProjectCount: number;
  status: "create" | "already-in-amp" | "no-remote" | "inside-repo";
  command: string;
};

export type AmpExistingProject = {
  id: string;
  name: string;
  namespace: string;
  repositoryURL: string;
  remoteURLs: string[];
};

export type AmpProjectPlan = {
  items: AmpProjectPlanItem[];
  summary: Record<AmpProjectPlanItem["status"], number>;
};

export async function listAmpProjects(): Promise<AmpExistingProject[]> {
  const { stdout } = await execFileAsync("amp", ["projects", "list", "--json"], { maxBuffer: 1024 * 1024 * 4 });
  return JSON.parse(stdout) as AmpExistingProject[];
}

/** Representative project for a remote group: the root-most worktree path. */
function rootProject(projects: LocalProject[]) {
  return [...projects].sort((a, b) => a.worktree.length - b.worktree.length || a.worktree.localeCompare(b.worktree))[0];
}

export async function planAmpProjects(projects: LocalProject[]): Promise<AmpProjectPlan> {
  const byRemote = new Map<string, LocalProject[]>();
  for (const project of projects) {
    const remote = remoteToHttpsClone(project.remoteUrl);
    if (!remote) continue;
    const group = byRemote.get(remote) ?? [];
    group.push(project);
    byRemote.set(remote, group);
  }

  let existing: AmpExistingProject[];
  try {
    existing = await listAmpProjects();
  } catch {
    existing = [];
  }
  const existingByRemote = new Set<string>();
  for (const amp of existing) {
    for (const url of [amp.repositoryURL, ...amp.remoteURLs]) {
      const normalized = url ? remoteToHttpsClone(url) : undefined;
      if (normalized) existingByRemote.add(normalized);
    }
  }

  const entries = [...byRemote.entries()];
  const roots = entries.map(([remote, group]) => [remote, rootProject(group).worktree] as const);
  const items: AmpProjectPlanItem[] = [];
  for (const [remote, group] of entries) {
    const project = rootProject(group);
    // Skip repositories nested inside another repo-backed project (inner checkouts).
    const nestedIn = roots.find(
      ([other, otherRoot]) => other !== remote && (project.worktree + "/").startsWith(otherRoot + "/"),
    );
    if (nestedIn) {
      items.push({
        repositoryUrl: "",
        projectName: project.name ?? project.worktreeName ?? project.worktree,
        raggleProjectCount: group.length,
        status: "inside-repo",
        command: `# inside ${nestedIn[1]}, skipped`,
      });
      continue;
    }
    items.push({
      repositoryUrl: remote,
      projectName: project.name ?? project.worktreeName ?? project.worktree,
      raggleProjectCount: group.length,
      status: existingByRemote.has(remote) ? "already-in-amp" : "create",
      command: `amp projects create ${remote}`,
    });
  }

  const noRemote = projects.filter((p) => !remoteToHttpsClone(p.remoteUrl));
  for (const project of noRemote) {
    items.push({
      repositoryUrl: "",
      projectName: project.name ?? project.worktreeName ?? project.worktree,
      raggleProjectCount: 1,
      status: "no-remote",
      command: `# local-only, needs manual: cd ${project.worktree} && amp projects create --push`,
    });
  }

  const summary = { create: 0, "already-in-amp": 0, "no-remote": 0, "inside-repo": 0 };
  for (const item of items) summary[item.status] += 1;
  return { items, summary };
}

/** Run the create commands for every planned project. Returns created and skipped repositories. */
export async function applyAmpProjects(plan: AmpProjectPlan) {
  const created: string[] = [];
  const skipped = plan.items.filter((item) => item.status !== "create");
  for (const item of plan.items) {
    if (item.status !== "create") continue;
    const { stdout } = await execFileAsync("amp", ["projects", "create", item.repositoryUrl, "--json"], {
      maxBuffer: 1024 * 1024 * 4,
    });
    const result = JSON.parse(stdout) as { name?: string; id?: string };
    created.push(result.name ?? item.repositoryUrl);
  }
  return { created, skipped };
}

export async function planFromRaggleCatalog() {
  const projects = await loadUserProjects();
  return { projects, plan: await planAmpProjects(projects) };
}
