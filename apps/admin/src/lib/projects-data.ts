/**
 * Multi-project registry for Panopticon v2.
 * Provides static consumer project data for the observability hub.
 */

export interface ConsumerProject {
  id: string;
  name: string;
  type: 'drupal' | 'react' | 'angular' | 'vue';
  version: string; // version of @wc-2026/library they use
  components: string[]; // which hx-* components they use
  lastUpdated: string;
  environment: 'production' | 'staging' | 'development';
}

/**
 * Static registry of consumer projects using @wc-2026/library.
 * In production this would be sourced from a registry API or config file.
 */
export const CONSUMER_PROJECTS: ConsumerProject[] = [
  {
    id: 'patient-portal',
    name: 'Patient Portal',
    type: 'drupal',
    version: '0.0.1',
    components: ['hx-button', 'hx-card', 'hx-text-input'],
    lastUpdated: '2026-02-28',
    environment: 'production',
  },
  {
    id: 'clinical-dashboard',
    name: 'Clinical Dashboard',
    type: 'react',
    version: '0.0.1',
    components: ['hx-button', 'hx-card'],
    lastUpdated: '2026-02-20',
    environment: 'production',
  },
  {
    id: 'pharmacy-mgmt',
    name: 'Pharmacy Management',
    type: 'drupal',
    version: '0.0.0',
    components: ['hx-button', 'hx-text-input'],
    lastUpdated: '2026-01-15',
    environment: 'staging',
  },
  {
    id: 'staff-scheduling',
    name: 'Staff Scheduling App',
    type: 'angular',
    version: '0.0.0',
    components: ['hx-button'],
    lastUpdated: '2025-12-10',
    environment: 'production',
  },
  {
    id: 'analytics-hub',
    name: 'Analytics Hub',
    type: 'vue',
    version: '0.0.1',
    components: ['hx-card', 'hx-text-input'],
    lastUpdated: '2026-02-25',
    environment: 'development',
  },
];

/**
 * Get all consumer projects.
 */
export function getAllProjects(): ConsumerProject[] {
  return CONSUMER_PROJECTS;
}

/**
 * Get a single project by ID.
 */
export function getProjectById(id: string): ConsumerProject | undefined {
  return CONSUMER_PROJECTS.find((p) => p.id === id);
}
