import { AnimatePresence } from 'motion/react';
import { ControlButtons } from './ControlButtons';
import { SelectedMemberDisplay } from './SelectedMemberDisplay';
import { type Person, type Sprint, type Issue, type AppAction } from '@/contexts/AppContext';

interface StartSUTabProps {
  selectedTeamMember: Person | null;
  selectedMemberHistory: Person[];
  availableMembers: Person[];
  currentHistoryIndex: number;
  currentSprint: Sprint | null;
  sortedMemberTickets: Issue[];
  isAnimating: boolean;
  state: {
    email: string;
    apiToken: string;
    domain: string;
  };
  dispatch: (action: AppAction) => void;
  onPrevious: () => void;
  onStart: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function StartSUTab({
  selectedTeamMember,
  selectedMemberHistory,
  availableMembers,
  currentHistoryIndex,
  currentSprint,
  sortedMemberTickets,
  isAnimating,
  state,
  dispatch,
  onPrevious,
  onStart,
  onNext,
  onReset,
}: StartSUTabProps) {
  return (
    <div className="space-y-6">
      {/* Control Buttons */}
      <ControlButtons
        selectedMemberHistoryLength={selectedMemberHistory.length}
        availableMembersLength={availableMembers.length}
        currentHistoryIndex={currentHistoryIndex}
        isAnimating={isAnimating}
        onPrevious={onPrevious}
        onStart={onStart}
        onNext={onNext}
        onReset={onReset}
      />

      {/* Selected Team Member Display */}
      <AnimatePresence mode="wait">
        {selectedTeamMember && (
          <SelectedMemberDisplay
            selectedTeamMember={selectedTeamMember}
            currentSprint={currentSprint}
            sortedMemberTickets={sortedMemberTickets}
            state={state}
            dispatch={dispatch}
          />
        )}
      </AnimatePresence>

      {/* No team member selected state */}
      {!selectedTeamMember && (
        <div className="text-center text-muted-foreground space-y-2">
          <p>Loading team members...</p>
          {availableMembers.length === 0 && selectedMemberHistory.length > 0 && (
            <p className="text-sm">All team members have been selected</p>
          )}
        </div>
      )}
    </div>
  );
}
