import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectedMemberDisplay } from './SelectedMemberDisplay';
import { type Person, type Sprint, type Issue, type AppAction } from '@/contexts/AppContext';

interface TeamMembersTabProps {
  people: Person[];
  projectName?: string;
  currentSprint: Sprint | null;
  allTickets: Issue[];
  state: {
    email: string;
    apiToken: string;
  };
  dispatch: (action: AppAction) => void;
}

export function TeamMembersTab({
  people,
  projectName,
  currentSprint,
  allTickets,
  state,
  dispatch
}: TeamMembersTabProps) {
  const [selectedMember, setSelectedMember] = useState<Person | null>(null);

  // Get tickets for the selected member
  const getMemberTickets = (member: Person | null): Issue[] => {
    if (!member || !allTickets) return [];

    return allTickets.filter(ticket =>
      ticket.fields.assignee?.accountId === member.accountId
    ).sort((a, b) => {
      // Sort by priority and status
      const priorityOrder = { 'Highest': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Lowest': 4 };
      const statusOrder = { 'To Do': 0, 'In Progress': 1, 'In Review': 2, 'Done': 3 };

      const aPriority = priorityOrder[a.fields.priority?.name as keyof typeof priorityOrder] ?? 5;
      const bPriority = priorityOrder[b.fields.priority?.name as keyof typeof priorityOrder] ?? 5;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      const aStatus = statusOrder[a.fields.status?.name as keyof typeof statusOrder] ?? 5;
      const bStatus = statusOrder[b.fields.status?.name as keyof typeof statusOrder] ?? 5;

      return aStatus - bStatus;
    });
  };

  const handleMemberSelect = (accountId: string) => {
    const member = people.find(person => person.accountId === accountId);
    setSelectedMember(member || null);
  };

  const sortedMemberTickets = getMemberTickets(selectedMember);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Team Members</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a team member to view their assigned tickets in {projectName}
        </p>

        {/* User Selection Dropdown */}
        <div className="w-full max-w-md">
          <Select onValueChange={handleMemberSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a team member" />
            </SelectTrigger>
            <SelectContent>
              {people.map((person) => (
                <SelectItem key={person.accountId} value={person.accountId} className="py-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={person.avatarUrls['48x48']}
                      alt={person.displayName}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex flex-col space-y-0.5 min-w-0">
                      <span className="font-medium text-sm truncate">
                        {person.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {person.emailAddress}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Member Display */}
      <AnimatePresence mode="wait">
        {selectedMember && (
          <SelectedMemberDisplay
            selectedTeamMember={selectedMember}
            currentSprint={currentSprint}
            sortedMemberTickets={sortedMemberTickets}
            state={state}
            dispatch={dispatch}
          />
        )}
      </AnimatePresence>

      {/* No member selected state */}
      {!selectedMember && (
        <div className="text-center text-muted-foreground space-y-2">
          <p>Select a team member from the dropdown to view their assigned tickets</p>
        </div>
      )}
    </div>
  );
}
