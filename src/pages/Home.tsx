import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ApiTokenRequired } from '@/components/ApiTokenRequired';
import { ProjectSelectionRequired } from '@/components/ProjectSelectionRequired';
import { HomeContent } from '@/components/HomeContent';
import { useStartSU } from '@/components/hooks/useStartSU';

export function Home() {
  const {
    state,
    fetchProjects,
    fetchProjectMembers,
    fetchSprints,
    dispatch
  } = useApp();

  const {
    selectedTeamMember,
    selectedMemberHistory,
    availableMembers,
    currentHistoryIndex,
    currentSprint,
    sortedMemberTickets,
    isAnimating,
    handleStartButton,
    handlePrevButton,
    handleNextButton,
    handleResetButton,
  } = useStartSU({
    people: state.people,
    sprints: state.sprints,
    issues: state.issues,
    state: { email: state.email, apiToken: state.apiToken },
    dispatch,
  });

  useEffect(() => {
    if (state.apiToken && state.projects.length === 0) {
      fetchProjects();
    }
  }, [state.apiToken]);

  useEffect(() => {
    // Load sprints when project is selected
    if (state.selectedProject) {
      fetchSprints(state.selectedProject.key);
    }
  }, [state.selectedProject]);

  useEffect(() => {
    // Load project members when project is selected
    if (state.selectedProject) {
      fetchProjectMembers(state.selectedProject.key);
    }
  }, [state.selectedProject]);

  if (!state.apiToken) {
    return <ApiTokenRequired />;
  }

  if (!state.selectedProject) {
    return <ProjectSelectionRequired />;
  }

  return (
    <HomeContent
      people={state.people}
      selectedProject={state.selectedProject}
      error={state.error}
      selectedTeamMember={selectedTeamMember}
      selectedMemberHistory={selectedMemberHistory}
      availableMembers={availableMembers}
      currentHistoryIndex={currentHistoryIndex}
      currentSprint={currentSprint}
      sortedMemberTickets={sortedMemberTickets}
      allIssues={state.issues}
      isAnimating={isAnimating}
      state={{ email: state.email, apiToken: state.apiToken }}
      dispatch={dispatch}
      onPrevious={handlePrevButton}
      onStart={handleStartButton}
      onNext={handleNextButton}
      onReset={handleResetButton}
    />
  );
}
