export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IssueStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
export type IssueSource = 'agent-review' | 'manual' | 'ci-failure';
export type IssueCategory =
  | 'accessibility'
  | 'performance'
  | 'dx'
  | 'infrastructure'
  | 'testing'
  | 'design-system'
  | 'drupal'
  | 'build-system'
  | 'ci-cd'
  | 'version-management'
  | 'documentation';

export interface StatusChange {
  from: IssueStatus;
  to: IssueStatus;
  date: string;
  changedBy: string;
  note?: string;
}

export interface TrackedIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: IssueCategory;
  tags: string[];
  status: IssueStatus;
  statusHistory: StatusChange[];
  source: IssueSource;
  reporter: string;
  firstSeenIn: string;
  lastSeenIn: string;
  impact?: string;
  recommendation?: string;
  effort?: string;
  owner?: string;
  blockedBy?: string[];
  blocks?: string[];
  relatedTo?: string[];
  actionItemRef?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes?: string[];
}

export interface IssuesIndex {
  version: '1.0.0';
  lastUpdated: string;
  stats: {
    total: number;
    bySeverity: Record<Severity, number>;
    byStatus: Record<IssueStatus, number>;
    byCategory: Record<string, number>;
    resolvedCount: number;
    resolutionRate: number;
  };
  issues: TrackedIssue[];
}

export interface ReviewSnapshot {
  date: string;
  model: string;
  status: string;
  totalIssues: number;
  agentCount: number;
  bySeverity: Record<Severity, number>;
  filePath: string;
}

export interface ReviewsIndex {
  reviews: ReviewSnapshot[];
}
