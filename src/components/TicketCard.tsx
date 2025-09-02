import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TicketPopover } from './TicketPopover';
import { type Issue } from '@/contexts/AppContext';
import { getStatusColor, getEpicName } from './utils/ticketUtils';
import { useTicketStatus, type StatusTransition } from './hooks/useTicketStatus';
import { Loader2, Bug, CheckSquare, FileText, Zap, AlertTriangle, Settings, ArrowUp, ArrowDown, Minus, Circle, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

interface TicketCardProps {
  ticket: Issue;
  state: {
    email: string;
    apiToken: string;
    domain: string;
  };
  dispatch: (action: any) => void;
}

export function TicketCard({ ticket, state, dispatch }: TicketCardProps) {
  const [transitions, setTransitions] = useState<StatusTransition[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const {
    fetchAvailableTransitions,
    updateTicketStatus,
    loadingTransitions,
    updatingStatus
  } = useTicketStatus({ state, dispatch });

  const getTicketTypeIcon = (issueType: string) => {
    const type = issueType.toLowerCase();
    if (type.includes('bug')) {
      return <Bug className="h-3 w-3 text-red-500" />;
    } else if (type.includes('story') || type.includes('user story')) {
      return <FileText className="h-3 w-3 text-blue-500" />;
    } else if (type.includes('task')) {
      return <CheckSquare className="h-3 w-3 text-green-500" />;
    } else if (type.includes('epic')) {
      return <Zap className="h-3 w-3 text-purple-500" />;
    } else if (type.includes('improvement') || type.includes('enhancement')) {
      return <Settings className="h-3 w-3 text-orange-500" />;
    } else if (type.includes('sub-task') || type.includes('subtask')) {
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    } else {
      return <FileText className="h-3 w-3 text-gray-500" />;
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

  const getPriorityIcon = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('very high') || priorityLower.includes('critical')) {
      return <ChevronUp className="h-3 w-3 text-red-600" />;
    } else if (priorityLower.includes('high') || priorityLower.includes('must')) {
      return <ArrowUp className="h-3 w-3 text-red-500" />;
    } else if (priorityLower.includes('medium') || priorityLower.includes('should')) {
      return <Minus className="h-3 w-3 text-orange-500" />;
    } else if (priorityLower.includes('low') || priorityLower.includes('could')) {
      return <ArrowDown className="h-3 w-3 text-blue-500" />;
    } else if (priorityLower.includes('lowest') || priorityLower.includes('would')) {
      return <ChevronDown className="h-3 w-3 text-gray-500" />;
    } else {
      return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('very high') || priorityLower.includes('critical')) {
      return 'text-red-600';
    } else if (priorityLower.includes('high') || priorityLower.includes('must')) {
      return 'text-red-500';
    } else if (priorityLower.includes('medium') || priorityLower.includes('should')) {
      return 'text-orange-500';
    } else if (priorityLower.includes('low') || priorityLower.includes('could')) {
      return 'text-blue-500';
    } else if (priorityLower.includes('lowest') || priorityLower.includes('would')) {
      return 'text-gray-500';
    } else {
      return 'text-gray-400';
    }
  };

  const openTicketInJira = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const ticketUrl = `${state.domain}/browse/${ticket.key}`;
    window.open(ticketUrl, '_blank');
  };

  const handleDropdownOpenChange = async (open: boolean) => {
    console.log("🚀 ~ Dropdown open changed:", open, "for ticket:", ticket.key);
    if (open && transitions.length === 0) {
      console.log("🚀 ~ Fetching transitions for ticket:", ticket.key);
      const availableTransitions = await fetchAvailableTransitions(ticket.key);
      console.log("🚀 ~ handleDropdownOpenChange ~ availableTransitions:", availableTransitions);
      setTransitions(availableTransitions);
    }
  };

  const handleStatusChange = async (transitionId: string) => {
    const success = await updateTicketStatus(ticket.key, transitionId, (updatedIssue) => {
      dispatch({ type: 'UPDATE_ISSUE', payload: updatedIssue });
    });

    if (success) {
      // Optionally refresh transitions
      const newTransitions = await fetchAvailableTransitions(ticket.key);
      setTransitions(newTransitions);
    }
  };

  const isLoading = loadingTransitions[ticket.key] || updatingStatus[ticket.key];

  return (
    <TicketPopover
      ticket={ticket}
      state={state}
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <Card key={ticket.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-sm">{ticket.key}</span>
                <button
                  onClick={openTicketInJira}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  title="Open in Jira"
                >
                  <ExternalLink className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              {getEpicName(ticket) && (
                <span className="text-xs text-muted-foreground italic">
                  • {getEpicName(ticket)}
                </span>
              )}
            </div>

            <DropdownMenu onOpenChange={handleDropdownOpenChange}>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isLoading}
                  className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(ticket.fields.status.name)} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{ticket.fields.status.name}</span>
                    </div>
                  ) : (
                    ticket.fields.status.name
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {transitions.map((transition) => (
                  <DropdownMenuItem
                    key={transition.id}
                    onClick={() => {
                      console.log('🚀 ~ Clicking transition:', transition);
                      handleStatusChange(transition.id);
                    }}
                    className="cursor-pointer"
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(transition.to.name)}`} />
                    {transition.to.name}
                  </DropdownMenuItem>
                ))}
                {transitions.length === 0 && !isLoading && (
                  <DropdownMenuItem disabled>
                    No transitions available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm">{ticket.fields.summary}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {getTicketTypeIcon(ticket.fields.issuetype.name)}
                <span className={`${getTicketTypeColor(ticket.fields.issuetype.name)} font-medium`}>
                  {ticket.fields.issuetype.name}
                </span>
              </div>
              {ticket.fields.reporter && (
                <span className="text-muted-foreground">
                  • {ticket.fields.reporter.displayName}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {getPriorityIcon(ticket.fields.priority.name)}
              <span className={`${getPriorityColor(ticket.fields.priority.name)} font-medium`}>
                {ticket.fields.priority.name}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </TicketPopover>
  );
}
