/**
 * Usage analytics for Panopticon v2.
 * Computes component usage stats across all consumer projects.
 */
import { getAllProjects } from './projects-data';

export interface ComponentUsageStats {
  component: string;
  usageCount: number; // how many projects use it
  projects: string[];
  trend: 'rising' | 'stable' | 'declining';
}

export interface UsageAnalytics {
  popularComponents: ComponentUsageStats[];
  unusedComponents: string[]; // hx-* components not used by any project
  totalComponents: number;
  adoptionRate: number; // % of known components in active use
}

/**
 * All known hx-* components in the library.
 * In production this would be read from the CEM.
 */
const KNOWN_COMPONENTS = ['hx-button', 'hx-card', 'hx-text-input'];

/**
 * Determine usage trend for a component.
 * In a real system this would compare to historical data.
 * For now, we assign trends based on usage count heuristics.
 */
function determineTrend(usageCount: number, totalProjects: number): ComponentUsageStats['trend'] {
  const adoptionRatio = usageCount / totalProjects;
  if (adoptionRatio >= 0.6) return 'rising';
  if (adoptionRatio >= 0.3) return 'stable';
  return 'declining';
}

/**
 * Compute usage analytics across all consumer projects.
 */
export function computeUsageAnalytics(): UsageAnalytics {
  const projects = getAllProjects();
  const totalProjects = projects.length;

  const usageMap = new Map<string, string[]>();

  // Initialize all known components
  for (const component of KNOWN_COMPONENTS) {
    usageMap.set(component, []);
  }

  // Aggregate usage across projects
  for (const project of projects) {
    for (const component of project.components) {
      const existing = usageMap.get(component) ?? [];
      existing.push(project.name);
      usageMap.set(component, existing);
    }
  }

  const allStats: ComponentUsageStats[] = [];
  const unusedComponents: string[] = [];

  for (const [component, projectNames] of usageMap.entries()) {
    if (projectNames.length === 0) {
      unusedComponents.push(component);
    } else {
      allStats.push({
        component,
        usageCount: projectNames.length,
        projects: projectNames,
        trend: determineTrend(projectNames.length, totalProjects),
      });
    }
  }

  // Sort by usage count descending
  allStats.sort((a, b) => b.usageCount - a.usageCount);

  const activeComponents = KNOWN_COMPONENTS.length - unusedComponents.length;
  const adoptionRate =
    KNOWN_COMPONENTS.length > 0
      ? Math.round((activeComponents / KNOWN_COMPONENTS.length) * 100)
      : 0;

  return {
    popularComponents: allStats,
    unusedComponents,
    totalComponents: KNOWN_COMPONENTS.length,
    adoptionRate,
  };
}
