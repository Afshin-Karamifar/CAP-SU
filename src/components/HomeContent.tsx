import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamMembersTab } from './TeamMembersTab';
import { StartSUTab } from './StartSUTab';
import { BacklogTab } from './BacklogTab';
import { ErrorMessage } from './ErrorMessage';
import { type Person, type Sprint, type Issue, type AppAction } from '@/contexts/AppContext';

interface HomeContentProps {
  people: Person[];
  selectedProject: any;
  error: string | null;
  selectedTeamMember: Person | null;
  selectedMemberHistory: Person[];
  availableMembers: Person[];
  currentHistoryIndex: number;
  currentSprint: Sprint | null;
  sortedMemberTickets: Issue[];
  allIssues: Issue[];
  isAnimating: boolean;
  state: {
    email: string;
    apiToken: string;
  };
  dispatch: (action: AppAction) => void;
  onPrevious: () => void;
  onStart: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function HomeContent({
  people,
  selectedProject,
  error,
  selectedTeamMember,
  selectedMemberHistory,
  availableMembers,
  currentHistoryIndex,
  currentSprint,
  sortedMemberTickets,
  allIssues,
  isAnimating,
  state,
  dispatch,
  onPrevious,
  onStart,
  onNext,
  onReset,
}: HomeContentProps) {
  return (
    <div className="space-y-6">
      {error && <ErrorMessage error={error} />}

      <AnimatePresence>
        {people.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="start-su" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="team-members">Team Members</TabsTrigger>
                    <TabsTrigger value="start-su">Start SU</TabsTrigger>
                    <TabsTrigger value="backlog">Backlog</TabsTrigger>
                  </TabsList>

                  <TabsContent value="team-members" className="mt-6">
                    <TeamMembersTab
                      people={people}
                      projectName={selectedProject?.name}
                      currentSprint={currentSprint}
                      allTickets={allIssues}
                      state={state}
                      dispatch={dispatch}
                    />
                  </TabsContent>

                  <TabsContent value="start-su" className="mt-6">
                    <StartSUTab
                      selectedTeamMember={selectedTeamMember}
                      selectedMemberHistory={selectedMemberHistory}
                      availableMembers={availableMembers}
                      currentHistoryIndex={currentHistoryIndex}
                      currentSprint={currentSprint}
                      sortedMemberTickets={sortedMemberTickets}
                      isAnimating={isAnimating}
                      state={state}
                      dispatch={dispatch}
                      onPrevious={onPrevious}
                      onStart={onStart}
                      onNext={onNext}
                      onReset={onReset}
                    />
                  </TabsContent>

                  <TabsContent value="backlog" className="mt-6">
                    <BacklogTab
                      currentSprint={currentSprint}
                      allTickets={allIssues}
                      selectedProject={selectedProject}
                      state={state}
                      dispatch={dispatch}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
