import { motion } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { TicketCard } from './TicketCard';
import { type Person, type Sprint, type Issue, type AppAction } from '@/contexts/AppContext';

interface SelectedMemberDisplayProps {
  selectedTeamMember: Person;
  currentSprint: Sprint | null;
  sortedMemberTickets: Issue[];
  state: {
    email: string;
    apiToken: string;
  };
  dispatch: (action: AppAction) => void;
}

export function SelectedMemberDisplay({
  selectedTeamMember,
  currentSprint,
  sortedMemberTickets,
  state,
  dispatch,
}: SelectedMemberDisplayProps) {
  return (
    <motion.div
      key={selectedTeamMember.accountId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
      className="space-y-4"
    >
      {/* Team Member Info */}
      <div className="flex justify-center">
        <div className="text-center space-y-2 relative">
          <img
            src={selectedTeamMember.avatarUrls['48x48']}
            alt={selectedTeamMember.displayName}
            className="w-16 h-16 rounded-full mx-auto"
          />
          <h3 className="font-semibold text-lg">
            {selectedTeamMember.displayName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedTeamMember.emailAddress}
          </p>
        </div>
      </div>

      {/* Current Sprint */}
      {currentSprint && (
        <div className="text-start space-y-2">
          <h4 className="font-medium text-base uppercase">
            {currentSprint.name}
          </h4>
          <Separator />
        </div>
      )}

      {/* Tickets */}
      <div className="space-y-4">
        {sortedMemberTickets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {sortedMemberTickets.map((ticket: Issue) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                state={state}
                dispatch={dispatch}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>No tickets assigned to this team member</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
