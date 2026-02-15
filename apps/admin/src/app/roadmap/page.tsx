import { Suspense } from "react";
import { RoadmapClient } from "./RoadmapClient";
import { StatsHero } from "./StatsHero";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { getBreadcrumbItems } from "@/lib/breadcrumb-utils";
import { readFileSync } from "fs";
import { join } from "path";

export interface Issue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  reporter: string;
  description: string;
  impact?: string;
  recommendation?: string;
  effort?: string;
  owner?: string;
  status: "not-started" | "in-progress" | "blocked" | "complete";
  tags: string[];
  category?: "accessibility" | "performance" | "dx" | "infrastructure" | "testing" | "design-system" | "drupal" | "build-system" | "ci-cd" | "version-management" | "documentation";
}

export interface PlatformReview {
  reviewDate: string;
  status: string;
  agents: Record<string, {
    status: string;
    scope: string;
    findings: {
      critical: Array<Omit<Issue, "severity" | "reporter" | "status" | "tags" | "category">>;
      high: Array<Omit<Issue, "severity" | "reporter" | "status" | "tags" | "category">>;
      medium: Array<Omit<Issue, "severity" | "reporter" | "status" | "tags" | "category">>;
      low: Array<Omit<Issue, "severity" | "reporter" | "status" | "tags" | "category">>;
    };
  }>;
  summary: {
    totalIssues: number;
    byPriority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    actionItems: Array<{
      id: string;
      priority: string;
      category: string;
      title: string;
      description: string;
      requirements: string[];
      owner: string;
      timeline: string;
      effort: string;
      blocking: string[];
      status: string;
    }>;
  };
  productionReadiness: {
    verdict: string;
    estimatedEffortToProduction: string;
    recommendedPhasing?: Array<{
      phase: string;
      focus: string;
      items: string[];
      totalEffort: string;
      outcome: string;
    }>;
  };
}

function loadPlatformReview(): PlatformReview {
  const reviewPath = join(process.cwd(), "../../.claude/platform-review-2026-02-15.json");
  const content = readFileSync(reviewPath, "utf-8");
  return JSON.parse(content) as PlatformReview;
}

function transformToIssues(review: PlatformReview): Issue[] {
  const issues: Issue[] = [];

  // Helper to infer category from agent and issue content
  const inferCategory = (agentName: string, title: string): Issue["category"] => {
    if (agentName.includes("accessibility")) return "accessibility";
    if (agentName.includes("performance")) return "performance";
    if (agentName.includes("design-system")) return "design-system";
    if (agentName.includes("drupal")) return "drupal";
    if (agentName.includes("devops")) return "ci-cd";
    if (agentName.includes("test-architect") || agentName.includes("qa-engineer")) return "testing";
    if (agentName.includes("typescript") || agentName.includes("staff-software")) return "build-system";
    if (title.toLowerCase().includes("changesets") || title.toLowerCase().includes("version")) return "version-management";
    if (title.toLowerCase().includes("documentation") || title.toLowerCase().includes("onboarding")) return "documentation";
    return "dx";
  };

  // Helper to extract tags from issue
  const extractTags = (issue: Omit<Issue, "severity" | "reporter" | "status" | "tags" | "category">, severity: string, agentName: string): string[] => {
    const tags: string[] = [severity];

    if (issue.impact?.toLowerCase().includes("wcag")) tags.push("wcag");
    if (issue.impact?.toLowerCase().includes("healthcare")) tags.push("healthcare-blocker");
    if (issue.impact?.toLowerCase().includes("v1.0") || issue.impact?.toLowerCase().includes("production")) tags.push("v1.0-blocker");
    if (issue.impact?.toLowerCase().includes("enterprise")) tags.push("enterprise");
    if (issue.title?.toLowerCase().includes("dark mode") || issue.title?.toLowerCase().includes("light/dark")) tags.push("theming");
    if (agentName) tags.push(agentName);

    return tags;
  };

  Object.entries(review.agents).forEach(([agentName, agent]) => {
    const severities: Array<keyof typeof agent.findings> = ["critical", "high", "medium", "low"];

    severities.forEach((severity) => {
      agent.findings[severity].forEach((finding) => {
        const category = inferCategory(agentName, finding.title);
        const tags = extractTags(finding, severity, agentName);

        issues.push({
          id: finding.id,
          severity,
          title: finding.title,
          reporter: agentName,
          description: finding.description,
          impact: finding.impact,
          effort: finding.effort,
          status: "not-started",
          tags,
          category,
        });
      });
    });
  });

  return issues;
}

export default function RoadmapPage() {
  const review = loadPlatformReview();
  const issues = transformToIssues(review);

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getBreadcrumbItems("/roadmap")} />
        <h1 className="text-2xl font-bold tracking-tight">Platform Health & Roadmap</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive review findings from 13 engineering agents
        </p>
      </div>

      <StatsHero review={review} />

      <Suspense fallback={<div>Loading roadmap...</div>}>
        <RoadmapClient issues={issues} review={review} />
      </Suspense>
    </div>
  );
}
