'use client';

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  BarChart3,
  Calendar,
  Users,
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Pause,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Issue, PlatformReview } from "./page";

interface RoadmapClientProps {
  issues: Issue[];
  review: PlatformReview;
}

export function RoadmapClient({ issues, review }: RoadmapClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("all");

  // Extract unique agents and statuses
  const uniqueAgents = useMemo(() => {
    const agents = new Set(issues.map(issue => issue.reporter));
    return Array.from(agents).sort();
  }, [issues]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(issues.map(issue => issue.status));
    return Array.from(statuses);
  }, [issues]);

  // Filter issues based on search, agent, status, and tab
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Tab filter
      if (selectedTab !== "all" && issue.severity !== selectedTab) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          issue.reporter.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Agent filter
      if (selectedAgent !== "all" && issue.reporter !== selectedAgent) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && issue.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [issues, searchQuery, selectedAgent, selectedStatus, selectedTab]);

  // Calculate stats
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const highCount = issues.filter(i => i.severity === "high").length;
  const mediumCount = issues.filter(i => i.severity === "medium").length;
  const lowCount = issues.filter(i => i.severity === "low").length;

  // Prepare chart data
  const agentData = useMemo(() => {
    const agentMap = new Map<string, number>();
    issues.forEach(issue => {
      agentMap.set(issue.reporter, (agentMap.get(issue.reporter) || 0) + 1);
    });
    return Array.from(agentMap.entries())
      .map(([agent, count]) => ({
        agent: agent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [issues]);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    issues.forEach(issue => {
      if (issue.category) {
        categoryMap.set(issue.category, (categoryMap.get(issue.category) || 0) + 1);
      }
    });
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      name: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count
    }));
  }, [issues]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="space-y-8">
      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Agent Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                <option value="all">All Agents</option>
                {uniqueAgents.map(agent => (
                  <option key={agent} value={agent}>
                    {agent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {filteredIssues.length} of {issues.length} issues</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Issues by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="agent"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fafafa'
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issues by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Issues by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fafafa'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap Timeline */}
      {review.productionReadiness.recommendedPhasing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Roadmap Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {review.productionReadiness.recommendedPhasing.map((phase, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/30 text-sm font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm mb-1">{phase.phase}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{phase.focus}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Clock className="w-3 h-3" />
                          {phase.totalEffort}
                        </div>
                        <p className="text-xs font-medium text-foreground">{phase.outcome}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Issue Lists */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="all"
            onClick={() => setSelectedTab("all")}
            className="gap-2"
          >
            All
            <Badge variant="secondary" className="ml-1">{issues.length}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="critical"
            onClick={() => setSelectedTab("critical")}
            className="gap-2"
          >
            Critical
            <Badge variant="destructive" className="ml-1">{criticalCount}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="high"
            onClick={() => setSelectedTab("high")}
            className="gap-2"
          >
            High
            <Badge className="ml-1 bg-orange-500/15 text-orange-400">{highCount}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="medium"
            onClick={() => setSelectedTab("medium")}
            className="gap-2"
          >
            Medium
            <Badge className="ml-1 bg-amber-500/15 text-amber-400">{mediumCount}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="low"
            onClick={() => setSelectedTab("low")}
            className="gap-2"
          >
            Low
            <Badge className="ml-1 bg-blue-500/15 text-blue-400">{lowCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredIssues.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-muted-foreground">No issues found matching your filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredIssues.map(issue => (
                <IssueCard key={issue.id} issue={issue} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "border-red-500/30 bg-red-500/5";
      case "high": return "border-orange-500/30 bg-orange-500/5";
      case "medium": return "border-amber-500/30 bg-amber-500/5";
      case "low": return "border-blue-500/30 bg-blue-500/5";
      default: return "";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/15 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "medium": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "low": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "in-progress": return <Clock className="w-4 h-4 text-blue-400" />;
      case "blocked": return <Pause className="w-4 h-4 text-red-400" />;
      case "not-started": return <Circle className="w-4 h-4 text-muted-foreground" />;
      default: return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("transition-colors hover:border-primary/30", getSeverityColor(issue.severity))}>
      <CardContent className="pt-5 pb-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={cn("border", getSeverityBadgeColor(issue.severity))}>
                  {issue.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {issue.id}
                </Badge>
                {issue.category && (
                  <Badge variant="secondary" className="text-xs">
                    {issue.category.replace(/-/g, ' ')}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-lg mb-2">{issue.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {issue.reporter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                {issue.effort && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{issue.effort}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {getStatusIcon(issue.status)}
                  <span className="text-muted-foreground">
                    {issue.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="pt-4 border-t border-border space-y-4">
              {issue.impact && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Impact
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">{issue.impact}</p>
                </div>
              )}
              {issue.recommendation && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    Recommendation
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">{issue.recommendation}</p>
                </div>
              )}
              {issue.owner && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Owner
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">{issue.owner}</p>
                </div>
              )}
              {issue.tags && issue.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Tags</h4>
                  <div className="flex items-center gap-2 flex-wrap pl-6">
                    {issue.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
