import { useState, useCallback } from 'react';
import { type Issue, type AppAction } from '@/contexts/AppContext';

interface UseTicketStatusProps {
  state: {
    email: string;
    apiToken: string;
    domain: string;
  };
  dispatch: (action: AppAction) => void;
}

export interface StatusTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
}

export function useTicketStatus({ state, dispatch }: UseTicketStatusProps) {
  const [loadingTransitions, setLoadingTransitions] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  const fetchAvailableTransitions = useCallback(
    async (issueKey: string): Promise<StatusTransition[]> => {
      console.log('🚀 ~ fetchAvailableTransitions called for:', issueKey);
      const authHeader = `Basic ${btoa(`${state.email}:${state.apiToken}`)}`;
      if (!state.email || !state.apiToken) {
        console.log('❌ ~ No credentials available');
        return [];
      }

      console.log('🚀 ~ Setting loading state for:', issueKey);
      setLoadingTransitions((prev) => ({ ...prev, [issueKey]: true }));

      try {
        const domain = state.domain;
        console.log('🚀 ~ Making API call to:', `${domain}/rest/api/3/issue/${issueKey}/transitions`);
        console.log('🚀 ~ Auth header (length):', authHeader.length);
        const response = await fetch(`${domain}/rest/api/3/issue/${issueKey}/transitions`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        });

        console.log('🚀 ~ Response status:', response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text();
          console.log('🚀 ~ Response error body:', errorText);
          throw new Error(`Failed to fetch transitions: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('🚀 ~ API response data:', data);
        const transitions = data.transitions || [];
        console.log('🚀 ~ Extracted transitions:', transitions);
        return transitions;
      } catch (error) {
        console.error('❌ ~ Error fetching transitions:', error);
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        return [];
      } finally {
        console.log('🚀 ~ Clearing loading state for:', issueKey);
        setLoadingTransitions((prev) => ({ ...prev, [issueKey]: false }));
      }
    },
    [state.email, state.apiToken, state.domain, dispatch]
  );

  const updateTicketStatus = useCallback(
    async (issueKey: string, transitionId: string, onSuccess?: (updatedIssue: Issue) => void): Promise<boolean> => {
      const authHeader = `Basic ${btoa(`${state.email}:${state.apiToken}`)}`;
      if (!state.email || !state.apiToken) return false;

      setUpdatingStatus((prev) => ({ ...prev, [issueKey]: true }));

      try {
        console.log('🚀 ~ updateTicketStatus called for:', issueKey, 'with transition:', transitionId);
        // First, perform the transition
        const transitionBody = {
          transition: {
            id: transitionId,
          },
        };
        console.log('🚀 ~ Transition request body:', JSON.stringify(transitionBody));

        const transitionResponse = await fetch(`${state.domain}/rest/api/3/issue/${issueKey}/transitions`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transitionBody),
        });

        console.log('🚀 ~ Transition response status:', transitionResponse.status, transitionResponse.statusText);
        if (!transitionResponse.ok) {
          const errorText = await transitionResponse.text();
          console.log('🚀 ~ Transition error body:', errorText);
          throw new Error(`Failed to update status: ${transitionResponse.status} ${transitionResponse.statusText} - ${errorText}`);
        }

        // Then fetch the updated issue to get the latest status
        const issueResponse = await fetch(`${state.domain}/rest/api/3/issue/${issueKey}?fields=summary,status,assignee,priority,issuetype,epic,parent`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        });

        if (!issueResponse.ok) {
          throw new Error(`Failed to fetch updated issue: ${issueResponse.statusText}`);
        }

        const updatedIssue = await issueResponse.json();

        if (onSuccess) {
          onSuccess(updatedIssue);
        }

        return true;
      } catch (error) {
        console.error('Error updating status:', error);
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        return false;
      } finally {
        setUpdatingStatus((prev) => ({ ...prev, [issueKey]: false }));
      }
    },
    [state.email, state.apiToken, state.domain, dispatch]
  );

  return {
    fetchAvailableTransitions,
    updateTicketStatus,
    loadingTransitions,
    updatingStatus,
  };
}
