import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { type Issue } from '@/contexts/AppContext';
import { getStatusColor, getEpicName } from './utils/ticketUtils';
import { Loader2, Bug, CheckSquare, FileText, Zap, AlertTriangle, Settings, ArrowUp, ArrowDown, Minus, Circle, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

interface TicketPopoverProps {
  ticket: Issue;
  children: React.ReactNode;
  state: {
    email: string;
    apiToken: string;
    domain: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TicketPopover({ ticket, children, state, open, onOpenChange }: TicketPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const popoverOpen = open !== undefined ? open : isPopoverOpen;
  const setPopoverOpen = onOpenChange || setIsPopoverOpen;

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

  const fetchComments = async (issueKey: string) => {
    setLoadingComments(true);
    try {
      const authHeader = `Basic ${btoa(`${state.email}:${state.apiToken}`)}`;
      const response = await fetch(`${state.domain}/rest/api/3/issue/${issueKey}/comment`, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const renderCommentBody = (body: any) => {
    // Handle different comment body formats
    if (typeof body === 'string') {
      // Simple HTML string
      return <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: body }} />;
    } else if (body && body.content) {
      // Atlassian Document Format (ADF)
      const extractText = (content: any[]): string => {
        return content.map((item: any) => {
          if (item.type === 'text') {
            return item.text || '';
          } else if (item.type === 'paragraph' && item.content) {
            return extractText(item.content);
          } else if (item.content) {
            return extractText(item.content);
          }
          return '';
        }).join('');
      };

      const textContent = extractText(body.content);
      return <div className="text-sm">{textContent}</div>;
    } else {
      // Fallback for unknown format
      return <div className="text-sm text-muted-foreground">Unable to display comment</div>;
    }
  };

  const openTicketInJira = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent popover from opening
    const ticketUrl = `${state.domain}/browse/${ticket.key}`;
    window.open(ticketUrl, '_blank');
  };

  const handleOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open && comments.length === 0) {
      fetchComments(ticket.key);
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>

      <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto" side="bottom" align="center">
        <div className="space-y-4">
          {/* Header */}
          <div className="border-b pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-lg">{ticket.key}</span>
                <button
                  onClick={openTicketInJira}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Open in Jira"
                >
                  <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.fields.status.name)}`}>
                {ticket.fields.status.name}
              </div>
            </div>
            <h3 className="font-semibold text-base mb-2">{ticket.fields.summary}</h3>

            {/* Ticket details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Type:</span>
                {getTicketTypeIcon(ticket.fields.issuetype.name)}
                <span className={`${getTicketTypeColor(ticket.fields.issuetype.name)} font-medium`}>
                  {ticket.fields.issuetype.name}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Priority:</span>
                {getPriorityIcon(ticket.fields.priority.name)}
                <span className={`${getPriorityColor(ticket.fields.priority.name)} font-medium`}>
                  {ticket.fields.priority.name}
                </span>
              </div>

              {ticket.fields.reporter && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Reporter:</span>
                  <span className="ml-1">{ticket.fields.reporter.displayName}</span>
                </div>
              )}

              {ticket.fields.assignee && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Assignee:</span>
                  <span className="ml-1">{ticket.fields.assignee.displayName}</span>
                </div>
              )}

              {getEpicName(ticket) && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Epic:</span>
                  <span className="ml-1">{getEpicName(ticket)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div>
            <h4 className="font-semibold text-base mb-3">Comments</h4>
            {loadingComments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading comments...</span>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm">{comment.author.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created).toLocaleDateString()}
                      </span>
                    </div>
                    {renderCommentBody(comment.body)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No comments available</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
