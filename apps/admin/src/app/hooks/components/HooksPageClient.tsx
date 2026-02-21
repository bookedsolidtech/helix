'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, GitBranch, Server } from 'lucide-react';
import { hooks, mcpServers } from '@/lib/hooks-data';
import type { Priority, Phase as PhaseType } from '@/lib/hooks-data';
import { cn } from '@/lib/utils';
import { HooksFilter } from './HooksFilter';

export function HooksPageClient(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedPhase, setSelectedPhase] = useState<PhaseType | 'all'>('all');
  const [selectedOwner, setSelectedOwner] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'hooks' | 'servers'>('hooks');

  // Get unique owners
  const allOwners = useMemo(() => {
    const owners = new Set<string>();
    hooks.forEach((h) => owners.add(h.owner));
    mcpServers.forEach((s) => owners.add(s.owner));
    return Array.from(owners).sort();
  }, []);

  // Filter hooks
  const filteredHooks = useMemo(() => {
    return hooks.filter((hook) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !hook.name.toLowerCase().includes(query) &&
          !hook.purpose.toLowerCase().includes(query) &&
          !hook.id.toLowerCase().includes(query) &&
          !hook.owner.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Priority filter
      if (selectedPriority !== 'all' && hook.priority !== selectedPriority) {
        return false;
      }

      // Phase filter
      if (selectedPhase !== 'all' && hook.phase !== selectedPhase) {
        return false;
      }

      // Owner filter
      if (selectedOwner !== 'all' && hook.owner !== selectedOwner) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedPriority, selectedPhase, selectedOwner]);

  // Filter servers
  const filteredServers = useMemo(() => {
    return mcpServers.filter((server) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !server.name.toLowerCase().includes(query) &&
          !server.function.toLowerCase().includes(query) &&
          !server.id.toLowerCase().includes(query) &&
          !server.owner.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Phase filter
      if (selectedPhase !== 'all' && server.phase !== selectedPhase) {
        return false;
      }

      // Owner filter
      if (selectedOwner !== 'all' && server.owner !== selectedOwner) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedPhase, selectedOwner]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search hooks and servers by name, purpose, ID, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-white/[0.02] border border-white/[0.04] pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Filters */}
        <HooksFilter
          selectedPriority={selectedPriority}
          selectedPhase={selectedPhase}
          selectedOwner={selectedOwner}
          onPriorityChange={setSelectedPriority}
          onPhaseChange={setSelectedPhase}
          onOwnerChange={setSelectedOwner}
          owners={allOwners}
        />
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('hooks')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'hooks'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
            )}
          >
            <GitBranch className="w-4 h-4" />
            Hooks ({filteredHooks.length})
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'servers'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
            )}
          >
            <Server className="w-4 h-4" />
            MCP Servers ({filteredServers.length})
          </button>
        </div>

        {(searchQuery ||
          selectedPriority !== 'all' ||
          selectedPhase !== 'all' ||
          selectedOwner !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPriority('all');
              setSelectedPhase('all');
              setSelectedOwner('all');
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'hooks' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filteredHooks.length === hooks.length
                ? 'All Hooks'
                : `Filtered Hooks (${filteredHooks.length} of ${hooks.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitBranch className="w-12 h-12 text-muted-foreground mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">No hooks match your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPriority('all');
                    setSelectedPhase('all');
                    setSelectedOwner('all');
                  }}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-40">Name</TableHead>
                    <TableHead className="w-32">Owner</TableHead>
                    <TableHead className="w-20">Priority</TableHead>
                    <TableHead className="w-20">Phase</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="w-24">Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHooks.map((hook) => (
                    <TableRow key={hook.id} className="group hover:bg-white/[0.02]">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-mono text-[10px]',
                            hook.priority === 'P0' && 'border-red-500/30 text-red-400',
                            hook.priority === 'P1' && 'border-amber-500/30 text-amber-400',
                            hook.priority === 'P2' && 'border-blue-500/30 text-blue-400',
                          )}
                        >
                          {hook.id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] capitalize',
                            hook.status === 'implemented' &&
                              'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                            hook.status === 'planned' &&
                              'border-blue-500/30 text-blue-400 bg-blue-500/5',
                            hook.status === 'deferred' &&
                              'border-gray-500/30 text-gray-400 bg-gray-500/5',
                          )}
                        >
                          {hook.status === 'implemented' && '✅ Implemented'}
                          {hook.status === 'planned' && '⏳ Planned'}
                          {hook.status === 'deferred' && '⏸️ Deferred'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {hook.implementedName || hook.name}
                        {hook.deferredReason && (
                          <div className="text-[10px] text-gray-500 mt-0.5 max-w-xs">
                            {hook.deferredReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{hook.owner}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            hook.priority === 'P0' && 'border-red-500/30 text-red-400',
                            hook.priority === 'P1' && 'border-amber-500/30 text-amber-400',
                            hook.priority === 'P2' && 'border-blue-500/30 text-blue-400',
                          )}
                        >
                          {hook.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          Phase {hook.phase}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {hook.purpose}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-amber-400 font-medium tabular-nums">
                          {hook.executionBudget}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filteredServers.length === mcpServers.length
                ? 'All MCP Servers'
                : `Filtered Servers (${filteredServers.length} of ${mcpServers.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredServers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Server className="w-12 h-12 text-muted-foreground mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">No servers match your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPhase('all');
                    setSelectedOwner('all');
                  }}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="w-48">Name</TableHead>
                    <TableHead className="w-32">Owner</TableHead>
                    <TableHead className="w-20">Phase</TableHead>
                    <TableHead>Function</TableHead>
                    <TableHead className="w-32">Dependencies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServers.map((server) => (
                    <TableRow key={server.id} className="group hover:bg-white/[0.02]">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-purple-500/30 text-purple-400"
                        >
                          {server.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{server.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {server.owner}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          Phase {server.phase}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {server.function}
                      </TableCell>
                      <TableCell>
                        {server.dependencies && server.dependencies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {server.dependencies.map((dep) => (
                              <Badge
                                key={dep}
                                variant="outline"
                                className="text-[10px] border-white/[0.06]"
                              >
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">\u2014</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
