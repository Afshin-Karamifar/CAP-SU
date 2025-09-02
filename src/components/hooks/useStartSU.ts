import { useState, useEffect, useCallback } from 'react';
import { type Person, type Sprint, type Issue, type AppAction } from '@/contexts/AppContext';
import { sortTicketsByStatus } from '../utils/ticketUtils';

interface UseStartSUProps {
  people: Person[];
  sprints: Sprint[];
  issues: Issue[];
  state: {
    email: string;
    apiToken: string;
  };
  dispatch: (action: AppAction) => void;
}

export function useStartSU({ people, sprints, issues, state, dispatch }: UseStartSUProps) {
  const [selectedTeamMember, setSelectedTeamMember] = useState<Person | null>(null);
  const [selectedMemberHistory, setSelectedMemberHistory] = useState<Person[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Person[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [memberTickets, setMemberTickets] = useState<Issue[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset available members when people change and auto-select first member
  useEffect(() => {
    // Auto-select the first random member when people are loaded for the first time
    if (people.length > 0 && selectedMemberHistory.length === 0 && !selectedTeamMember) {
      const randomIndex = Math.floor(Math.random() * people.length);
      const firstMember = people[randomIndex];

      setSelectedTeamMember(firstMember);
      setSelectedMemberHistory([firstMember]);
      setCurrentHistoryIndex(0);

      // Remove the selected member from available list
      setAvailableMembers(people.filter((member) => member.accountId !== firstMember.accountId));
    } else if (people.length > 0 && selectedMemberHistory.length === 0) {
      // Initialize available members to all people when first loading
      setAvailableMembers(people);
    }
  }, [people, selectedMemberHistory.length, selectedTeamMember]);

  const fetchSprintIssues = useCallback(
    async (sprintId: number) => {
      const authHeader = `Basic ${btoa(`${state.email}:${state.apiToken}`)}`;
      if (!authHeader) return;

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await fetch(`/rest/agile/1.0/sprint/${sprintId}/issue?fields=summary,status,assignee,priority,issuetype,epic,parent`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch issues: ${response.statusText}`);
        }

        const issuesData = await response.json();
        dispatch({ type: 'SET_ISSUES', payload: issuesData.issues });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.email, state.apiToken, dispatch]
  );

  // Find current active sprint
  useEffect(() => {
    const activeSprint = sprints.find((sprint) => sprint.state === 'active');
    if (activeSprint) {
      setCurrentSprint(activeSprint);
      fetchSprintIssues(activeSprint.id);
    }
  }, [sprints, fetchSprintIssues]);

  // Filter tickets for selected team member
  useEffect(() => {
    if (selectedTeamMember && issues.length > 0) {
      const tickets = issues.filter((issue) => issue.fields.assignee?.accountId === selectedTeamMember.accountId);
      setMemberTickets(tickets);
    } else {
      setMemberTickets([]);
    }
  }, [selectedTeamMember, issues]);

  const selectNewMember = useCallback(() => {
    // Select from available members only (not all people)
    if (availableMembers.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableMembers.length);
    const selectedMember = availableMembers[randomIndex];

    // Add to history
    const newHistory = [...selectedMemberHistory, selectedMember];
    setSelectedMemberHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
    setSelectedTeamMember(selectedMember);

    // Remove from available members to prevent re-selection
    setAvailableMembers((prev) => prev.filter((member) => member.accountId !== selectedMember.accountId));
  }, [availableMembers, selectedMemberHistory]);

  const handleStartButton = useCallback(() => {
    if (availableMembers.length === 0 || isAnimating) return;

    if (selectedTeamMember) {
      // If there's a current member, start fade out animation
      setIsAnimating(true);
      // After fade out completes, select new member
      setTimeout(() => {
        selectNewMember();
        setIsAnimating(false);
      }, 300); // 300ms for fade out
    } else {
      // If no current member, select immediately
      selectNewMember();
    }
  }, [availableMembers.length, isAnimating, selectedTeamMember, selectNewMember]);

  const handlePrevButton = useCallback(() => {
    if (currentHistoryIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        const prevIndex = currentHistoryIndex - 1;
        setCurrentHistoryIndex(prevIndex);
        setSelectedTeamMember(selectedMemberHistory[prevIndex]);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentHistoryIndex, isAnimating, selectedMemberHistory]);

  const handleNextButton = useCallback(() => {
    if (currentHistoryIndex < selectedMemberHistory.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        const nextIndex = currentHistoryIndex + 1;
        setCurrentHistoryIndex(nextIndex);
        setSelectedTeamMember(selectedMemberHistory[nextIndex]);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentHistoryIndex, isAnimating, selectedMemberHistory]);

  const handleResetButton = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      // Reset all state to initial values
      setSelectedTeamMember(null);
      setSelectedMemberHistory([]);
      setCurrentHistoryIndex(-1);
      setAvailableMembers(people);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, people]);

  const sortedMemberTickets = sortTicketsByStatus(memberTickets);

  return {
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
  };
}
