import { type Issue } from '@/contexts/AppContext';

export const getStatusColor = (statusName: string) => {
  const status = statusName.toLowerCase();
  switch (status) {
    case 'to do':
    case 'todo':
    case 'backlog':
    case 'open':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    case 'in progress':
    case 'in-progress':
    case 'in development':
    case 'development':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'in review':
    case 'review':
    case 'code review':
    case 'peer review':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'testing':
    case 'qa':
    case 'quality assurance':
    case 'test':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'done':
    case 'completed':
    case 'resolved':
    case 'closed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'blocked':
    case 'on hold':
    case 'waiting':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export const getStatusPriority = (statusName: string) => {
  const status = statusName.toLowerCase();
  switch (status) {
    case 'in progress':
    case 'in-progress':
    case 'in development':
    case 'development':
      return 1; // Highest priority
    case 'in review':
    case 'review':
    case 'code review':
    case 'peer review':
      return 2;
    case 'done':
    case 'completed':
    case 'resolved':
    case 'closed':
      return 3;
    case 'blocked':
    case 'on hold':
    case 'waiting':
      return 4;
    case 'to do':
    case 'todo':
    case 'backlog':
    case 'open':
      return 5; // Lowest priority
    default:
      return 6; // Unknown statuses go last
  }
};

export const getEpicName = (ticket: Issue) => {
  // Try to get epic name from different possible fields
  if (ticket.fields.epic?.name) {
    return ticket.fields.epic.name;
  }
  if (ticket.fields.parent?.fields?.summary) {
    return ticket.fields.parent.fields.summary;
  }
  return null;
};

export const sortTicketsByStatus = (tickets: Issue[]) => {
  return [...tickets].sort((a, b) => {
    return getStatusPriority(a.fields.status.name) - getStatusPriority(b.fields.status.name);
  });
};
