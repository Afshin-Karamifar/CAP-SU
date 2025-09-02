import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown, Filter, Search, Bug, CheckSquare, FileText, Zap, AlertTriangle, Settings, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TicketPopover } from './TicketPopover';
import { getStatusColor, getEpicName } from './utils/ticketUtils';
import { type Sprint, type Issue, type AppAction } from '@/contexts/AppContext';

type SortField = 'key' | 'summary' | 'status' | 'priority' | 'assignee' | 'type' | 'epic';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

interface BacklogTabProps {
  currentSprint: Sprint | null;
  allTickets: Issue[]; // These are current sprint tickets
  selectedProject: any; // Add selectedProject to get project key
  state: {
    email: string;
    apiToken: string;
    domain: string;
  };
  dispatch: (action: AppAction) => void;
}

export function BacklogTab({
  currentSprint,
  allTickets, // This contains current sprint tickets
  selectedProject,
  state,
  dispatch,
}: BacklogTabProps) {
  const [backlogTickets, setBacklogTickets] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [sprintSortConfig, setSprintSortConfig] = useState<SortConfig>({ field: null, direction: null });
  const [backlogSortConfig, setBacklogSortConfig] = useState<SortConfig>({ field: null, direction: null });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [epicFilter, setEpicFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Reset all filters function
  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setEpicFilter('all');
    setAssigneeFilter('all');
    setSearchFilter('');
  };

  // Fetch all project tickets (backlog)
  const fetchProjectTickets = useCallback(async () => {
    if (!state.email || !state.apiToken || !state.domain || !selectedProject?.key) return;

    setLoading(true);
    const authHeader = `Basic ${btoa(`${state.email}:${state.apiToken}`)}`;

    try {
      const projectKey = selectedProject.key;

      const response = await fetch(`${state.domain}/rest/api/3/search?jql=project=${projectKey}&fields=summary,status,assignee,priority,issuetype,epic,parent,sprint&maxResults=1000`, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch project tickets: ${response.statusText}`);
      }

      const data = await response.json();

      // Filter out tickets that are in the current sprint
      const currentSprintTicketIds = new Set(allTickets.map(ticket => ticket.id));
      const filteredBacklogTickets = data.issues.filter((ticket: Issue) =>
        !currentSprintTicketIds.has(ticket.id)
      );

      setBacklogTickets(filteredBacklogTickets);
    } catch (error) {
      console.error('Error fetching project tickets:', error);
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [state.email, state.apiToken, state.domain, selectedProject?.key, allTickets, dispatch]);

  useEffect(() => {
    fetchProjectTickets();
  }, [fetchProjectTickets]);

  const sortTickets = (tickets: Issue[], sortConfig: SortConfig): Issue[] => {
    if (!sortConfig.field || !sortConfig.direction) {
      return tickets;
    }

    return [...tickets].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.field) {
        case 'key':
          aValue = a.key;
          bValue = b.key;
          break;
        case 'summary':
          aValue = a.fields.summary;
          bValue = b.fields.summary;
          break;
        case 'status':
          aValue = a.fields.status.name;
          bValue = b.fields.status.name;
          break;
        case 'priority':
          // Sort by priority order (Highest, High, Medium, Low, Lowest)
          const priorityOrder = { 'Highest': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Lowest': 4 };
          aValue = priorityOrder[a.fields.priority.name as keyof typeof priorityOrder] ?? 5;
          bValue = priorityOrder[b.fields.priority.name as keyof typeof priorityOrder] ?? 5;
          break;
        case 'assignee':
          aValue = a.fields.assignee?.displayName || 'Unassigned';
          bValue = b.fields.assignee?.displayName || 'Unassigned';
          break;
        case 'type':
          aValue = a.fields.issuetype.name;
          bValue = b.fields.issuetype.name;
          break;
        case 'epic':
          aValue = getEpicName(a) || 'No Epic';
          bValue = getEpicName(b) || 'No Epic';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  };

  // Filter function to apply filters to tickets
  const filterTickets = (tickets: Issue[]): Issue[] => {
    return tickets.filter((ticket) => {
      // Status filter
      if (statusFilter !== 'all' && ticket.fields.status.name !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && ticket.fields.priority.name !== priorityFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && ticket.fields.issuetype.name !== typeFilter) {
        return false;
      }

      // Epic filter
      const epicName = getEpicName(ticket) || 'No Epic';
      if (epicFilter !== 'all' && epicName !== epicFilter) {
        return false;
      }

      // Assignee filter
      const assigneeName = ticket.fields.assignee?.displayName || 'Unassigned';
      if (assigneeFilter !== 'all' && assigneeName !== assigneeFilter) {
        return false;
      }

      // Search filter (searches across key, summary, status, priority, assignee, type, epic)
      if (searchFilter.trim() !== '') {
        const searchTerm = searchFilter.toLowerCase().trim();
        const searchableText = [
          ticket.key,
          ticket.fields.summary,
          ticket.fields.status.name,
          ticket.fields.priority.name,
          assigneeName,
          ticket.fields.issuetype.name,
          epicName
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  };

  // Get unique values for filter dropdowns with counts
  const getUniqueStatusesWithCounts = (tickets: Issue[]): Array<{ value: string, count: number }> => {
    const statusCounts = tickets.reduce((acc, ticket) => {
      const status = ticket.fields.status.name;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCount = tickets.length;
    return [
      { value: 'all', count: totalCount },
      ...Object.entries(statusCounts).map(([status, count]) => ({ value: status, count }))
    ];
  };

  const getUniquePrioritiesWithCounts = (tickets: Issue[]): Array<{ value: string, count: number }> => {
    const priorityCounts = tickets.reduce((acc, ticket) => {
      const priority = ticket.fields.priority.name;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCount = tickets.length;
    return [
      { value: 'all', count: totalCount },
      ...Object.entries(priorityCounts).map(([priority, count]) => ({ value: priority, count }))
    ];
  };

  const getUniqueTypesWithCounts = (tickets: Issue[]): Array<{ value: string, count: number }> => {
    const typeCounts = tickets.reduce((acc, ticket) => {
      const type = ticket.fields.issuetype.name;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCount = tickets.length;
    return [
      { value: 'all', count: totalCount },
      ...Object.entries(typeCounts).map(([type, count]) => ({ value: type, count }))
    ];
  };

  const getUniqueEpicsWithCounts = (tickets: Issue[]): Array<{ value: string, count: number }> => {
    const epicCounts = tickets.reduce((acc, ticket) => {
      const epic = getEpicName(ticket) || 'No Epic';
      acc[epic] = (acc[epic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCount = tickets.length;
    return [
      { value: 'all', count: totalCount },
      ...Object.entries(epicCounts).map(([epic, count]) => ({ value: epic, count }))
    ];
  };

  const getUniqueAssigneesWithCounts = (tickets: Issue[]): Array<{ value: string, count: number }> => {
    const assigneeCounts = tickets.reduce((acc, ticket) => {
      const assignee = ticket.fields.assignee?.displayName || 'Unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCount = tickets.length;
    return [
      { value: 'all', count: totalCount },
      ...Object.entries(assigneeCounts).map(([assignee, count]) => ({ value: assignee, count }))
    ];
  };

  const handleSort = (field: SortField, isSprintTable: boolean) => {
    const currentConfig = isSprintTable ? sprintSortConfig : backlogSortConfig;
    const setConfig = isSprintTable ? setSprintSortConfig : setBacklogSortConfig;

    let newDirection: SortDirection;
    if (currentConfig.field === field) {
      // Cycle through: asc -> desc -> null
      newDirection = currentConfig.direction === 'asc' ? 'desc' :
        currentConfig.direction === 'desc' ? null : 'asc';
    } else {
      newDirection = 'asc';
    }

    setConfig({
      field: newDirection ? field : null,
      direction: newDirection
    });
  };

  const getSortIcon = (field: SortField, sortConfig: SortConfig) => {
    if (sortConfig.field !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="h-4 w-4" />;
    } else if (sortConfig.direction === 'desc') {
      return <ChevronDown className="h-4 w-4" />;
    }

    return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  // Sort and filter the tickets based on current configuration
  const filteredSprintTickets = filterTickets(allTickets);
  const filteredBacklogTickets = filterTickets(backlogTickets);
  const sortedSprintTickets = sortTickets(filteredSprintTickets, sprintSortConfig);
  const sortedBacklogTickets = sortTickets(filteredBacklogTickets, backlogSortConfig);

  const SortableHeader = ({ field, children, sortConfig, onSort }: {
    field: SortField;
    children: React.ReactNode;
    sortConfig: SortConfig;
    onSort: (field: SortField) => void;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {getSortIcon(field, sortConfig)}
      </div>
    </TableHead>
  );

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('highest') || priorityLower.includes('critical')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (priorityLower.includes('high') || priorityLower.includes('major')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    } else if (priorityLower.includes('medium') || priorityLower.includes('normal')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else if (priorityLower.includes('low') || priorityLower.includes('minor')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTicketTypeIcon = (issueType: string) => {
    const type = issueType.toLowerCase();
    if (type.includes('bug')) {
      return <Bug className="h-4 w-4 text-red-500" />;
    } else if (type.includes('story') || type.includes('user story')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (type.includes('task')) {
      return <CheckSquare className="h-4 w-4 text-green-500" />;
    } else if (type.includes('epic')) {
      return <Zap className="h-4 w-4 text-purple-500" />;
    } else if (type.includes('improvement') || type.includes('enhancement')) {
      return <Settings className="h-4 w-4 text-orange-500" />;
    } else if (type.includes('sub-task') || type.includes('subtask')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTicketTypeColor = (issueType: string) => {
    const type = issueType.toLowerCase();
    if (type.includes('bug')) {
      return 'text-red-500';
    } else if (type.includes('story') || type.includes('user story')) {
      return 'text-blue-500';
    } else if (type.includes('task')) {
      return 'text-green-500';
    } else if (type.includes('epic')) {
      return 'text-purple-500';
    } else if (type.includes('improvement') || type.includes('enhancement')) {
      return 'text-orange-500';
    } else if (type.includes('sub-task') || type.includes('subtask')) {
      return 'text-yellow-500';
    } else {
      return 'text-gray-500';
    }
  };

  const openTicketInJira = (ticketKey: string) => {
    const url = `${state.domain}/browse/${ticketKey}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Filter Section */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <h4 className="text-sm font-medium">Filters</h4>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="h-8 px-3"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueStatusesWithCounts([...allTickets, ...backlogTickets]).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex justify-between w-full items-center">
                      <span>{item.value === 'all' ? 'All Statuses' : item.value}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                {getUniquePrioritiesWithCounts([...allTickets, ...backlogTickets]).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex justify-between w-full items-center">
                      <span>{item.value === 'all' ? 'All Priorities' : item.value}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueTypesWithCounts([...allTickets, ...backlogTickets]).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex justify-between w-full items-center">
                      <span>{item.value === 'all' ? 'All Types' : item.value}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Epic Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Epic</label>
            <Select value={epicFilter} onValueChange={setEpicFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Epics" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueEpicsWithCounts([...allTickets, ...backlogTickets]).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex justify-between w-full items-center">
                      <span>{item.value === 'all' ? 'All Epics' : item.value}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second row of filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Search All Columns</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-7 h-[50px] indent-5"
              />
            </div>
          </div>
          {/* Assignee Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Assignee</label>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueAssigneesWithCounts([...allTickets, ...backlogTickets]).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex justify-between w-full items-center">
                      <span>{item.value === 'all' ? 'All Assignees' : item.value}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Accordion for Current Sprint and Backlog */}
      <Accordion type="multiple" defaultValue={["current-sprint", "backlog"]} className="w-full">
        {/* Current Sprint Section */}
        {currentSprint && (
          <AccordionItem value="current-sprint">
            <AccordionTrigger className="text-md font-medium">
              {currentSprint.name.toUpperCase()} ({sortedSprintTickets.length})
            </AccordionTrigger>
            <AccordionContent>
              {allTickets.length > 0 ? (
                <motion.div
                  className="rounded-md border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader
                          field="key"
                          sortConfig={sprintSortConfig}
                          onSort={(field) => handleSort(field, true)}
                        >
                          Key
                        </SortableHeader>
                        <SortableHeader
                          field="summary"
                          sortConfig={sprintSortConfig}
                          onSort={(field) => handleSort(field, true)}
                        >
                          Summary
                        </SortableHeader>
                        <SortableHeader
                          field="status"
                          sortConfig={sprintSortConfig}
                          onSort={(field) => handleSort(field, true)}
                        >
                          Status
                        </SortableHeader>
                        <SortableHeader
                          field="priority"
                          sortConfig={sprintSortConfig}
                          onSort={(field) => handleSort(field, true)}
                        >
                          Priority
                        </SortableHeader>
                        <SortableHeader
                          field="assignee"
                          sortConfig={sprintSortConfig}
                          onSort={(field) => handleSort(field, true)}
                        >
                          Assignee
                        </SortableHeader>
                        <SortableHeader
                          field="type"
                          sortConfig={sprintSortConfig}
                          onSort={(field) => handleSort(field, true)}
                        >
                          Type
                        </SortableHeader>
                        <SortableHeader
                          field="epic"
                          sortConfig={sprintSortConfig}
                          onSort={(field) => handleSort(field, true)}
                        >
                          Epic
                        </SortableHeader>
                        <TableHead className="w-[50px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSprintTickets.map((ticket) => (
                        <TicketPopover
                          key={ticket.id}
                          ticket={ticket}
                          state={state}
                        >
                          <TableRow className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">{ticket.key}</TableCell>
                            <TableCell className="max-w-xs truncate">{ticket.fields.summary}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(ticket.fields.status.name)}>
                                {ticket.fields.status.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(ticket.fields.priority.name)}>
                                {ticket.fields.priority.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ticket.fields.assignee ? ticket.fields.assignee.displayName : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getTicketTypeIcon(ticket.fields.issuetype.name)}
                                <span className={`${getTicketTypeColor(ticket.fields.issuetype.name)} font-medium`}>
                                  {ticket.fields.issuetype.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {getEpicName(ticket) || 'No Epic'}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTicketInJira(ticket.key);
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                title="Open in Jira"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        </TicketPopover>
                      ))}
                    </TableBody>
                  </Table>
                </motion.div>
              ) : (
                <motion.div
                  className="text-center text-muted-foreground py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <p>No tickets in current sprint</p>
                </motion.div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Backlog Section */}
        <AccordionItem value="backlog">
          <AccordionTrigger className="text-md font-medium">
            BACKLOG ({sortedBacklogTickets.length})
          </AccordionTrigger>
          <AccordionContent>
            {loading ? (
              <motion.div
                className="text-center text-muted-foreground py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <p>Loading backlog tickets...</p>
              </motion.div>
            ) : backlogTickets.length > 0 ? (
              <motion.div
                className="rounded-md border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader
                        field="key"
                        sortConfig={backlogSortConfig}
                        onSort={(field) => handleSort(field, false)}
                      >
                        Key
                      </SortableHeader>
                      <SortableHeader
                        field="summary"
                        sortConfig={backlogSortConfig}
                        onSort={(field) => handleSort(field, false)}
                      >
                        Summary
                      </SortableHeader>
                      <SortableHeader
                        field="status"
                        sortConfig={backlogSortConfig}
                        onSort={(field) => handleSort(field, false)}
                      >
                        Status
                      </SortableHeader>
                      <SortableHeader
                        field="priority"
                        sortConfig={backlogSortConfig}
                        onSort={(field) => handleSort(field, false)}
                      >
                        Priority
                      </SortableHeader>
                      <SortableHeader
                        field="assignee"
                        sortConfig={backlogSortConfig}
                        onSort={(field) => handleSort(field, false)}
                      >
                        Assignee
                      </SortableHeader>
                      <SortableHeader
                        field="type"
                        sortConfig={backlogSortConfig}
                        onSort={(field) => handleSort(field, false)}
                      >
                        Type
                      </SortableHeader>
                      <SortableHeader
                        field="epic"
                        sortConfig={backlogSortConfig}
                        onSort={(field) => handleSort(field, false)}
                      >
                        Epic
                      </SortableHeader>
                      <TableHead className="w-[50px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBacklogTickets.map((ticket) => (
                      <TicketPopover
                        key={ticket.id}
                        ticket={ticket}
                        state={state}
                      >
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{ticket.key}</TableCell>
                          <TableCell className="max-w-xs truncate">{ticket.fields.summary}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(ticket.fields.status.name)}>
                              {ticket.fields.status.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(ticket.fields.priority.name)}>
                              {ticket.fields.priority.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ticket.fields.assignee ? ticket.fields.assignee.displayName : 'Unassigned'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTicketTypeIcon(ticket.fields.issuetype.name)}
                              <span className={`${getTicketTypeColor(ticket.fields.issuetype.name)} font-medium`}>
                                {ticket.fields.issuetype.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {getEpicName(ticket) || 'No Epic'}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openTicketInJira(ticket.key);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                              title="Open in Jira"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      </TicketPopover>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            ) : (
              <motion.div
                className="text-center text-muted-foreground py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <p>No tickets in backlog</p>
              </motion.div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
}
