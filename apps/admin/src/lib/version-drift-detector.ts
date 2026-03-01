/**
 * Version drift detector for Panopticon v2.
 * Compares consumer project versions against the latest library version.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAllProjects, type ConsumerProject } from './projects-data';

export interface VersionDriftResult {
  project: string;
  projectId: string;
  currentVersion: string;
  latestVersion: string;
  driftLevel: 'current' | 'minor' | 'major' | 'critical';
  driftVersions: number; // how many versions behind
}

interface PackageJson {
  version: string;
}

/**
 * Read the current library version from packages/hx-library/package.json.
 */
export function getLatestLibraryVersion(): string {
  const pkgPath = resolve(process.cwd(), '../../packages/hx-library/package.json');

  if (!existsSync(pkgPath)) {
    return '0.0.1';
  }

  try {
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as PackageJson;
    return pkg.version;
  } catch {
    return '0.0.1';
  }
}

/**
 * Parse a semver string into numeric parts.
 */
function parseSemver(version: string): [number, number, number] {
  const cleaned = version.replace(/^[^0-9]*/, '');
  const parts = cleaned.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Calculate how many patch/minor/major versions behind a project is.
 * Returns the drift count as total semver distance (simplified).
 */
function calculateDriftVersions(current: string, latest: string): number {
  const [curMaj, curMin, curPat] = parseSemver(current);
  const [latMaj, latMin, latPat] = parseSemver(latest);

  if (latMaj !== curMaj) return (latMaj - curMaj) * 100 + (latMin - curMin) * 10 + (latPat - curPat);
  if (latMin !== curMin) return (latMin - curMin) * 10 + (latPat - curPat);
  return latPat - curPat;
}

/**
 * Determine drift severity based on version difference.
 */
function getDriftLevel(
  current: string,
  latest: string,
): VersionDriftResult['driftLevel'] {
  const [curMaj, curMin] = parseSemver(current);
  const [latMaj, latMin] = parseSemver(latest);

  if (curMaj === latMaj && curMin === latMin) {
    const [, , curPat] = parseSemver(current);
    const [, , latPat] = parseSemver(latest);
    if (curPat === latPat) return 'current';
    return 'minor';
  }

  if (curMaj !== latMaj) return 'critical';
  if (latMin - curMin >= 2) return 'major';
  return 'minor';
}

/**
 * Compute version drift for all consumer projects.
 */
export function detectVersionDrift(): VersionDriftResult[] {
  const latestVersion = getLatestLibraryVersion();
  const projects = getAllProjects();

  return projects.map((project: ConsumerProject) => ({
    project: project.name,
    projectId: project.id,
    currentVersion: project.version,
    latestVersion,
    driftLevel: getDriftLevel(project.version, latestVersion),
    driftVersions: calculateDriftVersions(project.version, latestVersion),
  }));
}

/**
 * Get projects with non-current versions.
 */
export function getDriftingProjects(): VersionDriftResult[] {
  return detectVersionDrift().filter((r) => r.driftLevel !== 'current');
}
