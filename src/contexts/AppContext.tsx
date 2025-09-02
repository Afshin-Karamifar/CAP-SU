import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { secureStorage } from '../lib/secureStorage';
import { buildApiUrl } from '../lib/apiUtils';

// Types
export interface Project {
  id: string;
  key: string;
  name: string;
}

export interface Sprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
}

export interface Person {
  accountId: string;
  emailAddress: string;
  displayName: string;
  avatarUrls: {
    '48x48': string;
  };
}

export interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        colorName: string;
      };
    };
    assignee: Person | null;
    reporter: Person | null;
    priority: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    epic?: {
      name: string;
      key: string;
    } | null;
    parent?: {
      fields: {
        summary: string;
      };
    } | null;
  };
}

interface AppState {
  projectName: string;
  apiToken: string;
  email: string;
  projects: Project[];
  selectedProject: Project | null;
  sprints: Sprint[];
  selectedSprint: Sprint | null;
  issues: Issue[];
  people: Person[];
  loading: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'SET_API_TOKEN'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_SELECTED_PROJECT'; payload: Project | null }
  | { type: 'SET_SPRINTS'; payload: Sprint[] }
  | { type: 'SET_SELECTED_SPRINT'; payload: Sprint | null }
  | { type: 'SET_ISSUES'; payload: Issue[] }
  | { type: 'UPDATE_ISSUE'; payload: Issue }
  | { type: 'SET_PEOPLE'; payload: Person[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  projectName: '',
  apiToken: '',
  email: '',
  projects: [],
  selectedProject: null,
  sprints: [],
  selectedSprint: null,
  issues: [],
  people: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECT_NAME':
      // Store in sessionStorage asynchronously
      secureStorage.setItem('jira-project-name', action.payload).catch(console.error);
      return { ...state, projectName: action.payload };
    case 'SET_API_TOKEN':
      // Store API token with encryption
      secureStorage.setItem('jira-api-token', action.payload, { encrypt: true }).catch(console.error);
      return { ...state, apiToken: action.payload };
    case 'SET_EMAIL':
      // Store email with encryption
      secureStorage.setItem('jira-email', action.payload, { encrypt: true }).catch(console.error);
      return { ...state, email: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_SELECTED_PROJECT':
      // Store selected project asynchronously
      secureStorage.setSelectedProject(action.payload).catch(console.error);
      return { ...state, selectedProject: action.payload, sprints: [], selectedSprint: null };
    case 'SET_SPRINTS':
      return { ...state, sprints: action.payload };
    case 'SET_SELECTED_SPRINT':
      return { ...state, selectedSprint: action.payload };
    case 'SET_ISSUES':
      return { ...state, issues: action.payload };
    case 'UPDATE_ISSUE':
      return {
        ...state,
        issues: state.issues.map(issue =>
          issue.id === action.payload.id ? action.payload : issue
        )
      };
    case 'SET_PEOPLE':
      return { ...state, people: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveCredentials: (projectName: string, email: string, token: string) => void;
  fetchProjects: () => Promise<void>;
  fetchSprints: (projectId: string) => Promise<void>;
  fetchProjectMembers: (projectKey: string) => Promise<void>;
  fetchIssuesAndPeople: (sprintId: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load stored data on initialization
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const credentials = await secureStorage.getCredentials();
        const selectedProject = await secureStorage.getSelectedProject();

        // Update state with stored data
        if (credentials.projectName) {
          dispatch({ type: 'SET_PROJECT_NAME', payload: credentials.projectName });
        }
        if (credentials.email) {
          dispatch({ type: 'SET_EMAIL', payload: credentials.email });
        }
        if (credentials.apiToken) {
          dispatch({ type: 'SET_API_TOKEN', payload: credentials.apiToken });
        }
        if (selectedProject) {
          dispatch({ type: 'SET_SELECTED_PROJECT', payload: selectedProject });
        }
      } catch (error) {
        console.error('❌ Failed to load stored data:', error);
        // Clear potentially corrupted data
        secureStorage.clear();
      }
    };

    loadStoredData();
  }, []);

  const saveCredentials = async (projectName: string, email: string, token: string) => {
    try {
      // Use the secure storage method for credentials
      await secureStorage.setCredentials({
        projectName,
        email,
        apiToken: token
      });

      // Update state
      dispatch({ type: 'SET_PROJECT_NAME', payload: projectName });
      dispatch({ type: 'SET_EMAIL', payload: email });
      dispatch({ type: 'SET_API_TOKEN', payload: token });
    } catch (error) {
      console.error('❌ Failed to save credentials:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save credentials securely' });
    }
  };

  // Helper function to create Basic Auth header
  const getAuthHeader = () => {
    if (!state.email || !state.apiToken) return null;
    const credentials = btoa(`${state.email}:${state.apiToken}`);
    return `Basic ${credentials}`;
  };

  const fetchProjects = async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      dispatch({ type: 'SET_ERROR', payload: 'Email and API token required' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(buildApiUrl('/rest/api/3/project'), {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const projects = await response.json();
      dispatch({ type: 'SET_PROJECTS', payload: projects });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchSprints = async (projectId: string) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(
        buildApiUrl(`/rest/agile/1.0/board?projectKeyOrId=${projectId}`),
        {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.statusText}`);
      }

      const boardsData = await response.json();
      const boardId = boardsData.values[0]?.id;

      if (boardId) {
        const sprintsResponse = await fetch(
          buildApiUrl(`/rest/agile/1.0/board/${boardId}/sprint?state=active,future`),
          {
            headers: {
              'Authorization': authHeader,
              'Accept': 'application/json',
            },
          }
        );

        if (!sprintsResponse.ok) {
          throw new Error(`Failed to fetch sprints: ${sprintsResponse.statusText}`);
        }

        const sprintsData = await sprintsResponse.json();
        dispatch({ type: 'SET_SPRINTS', payload: sprintsData.values });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchProjectMembers = async (projectKey: string) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Fetch project users/members
      const response = await fetch(
        buildApiUrl(`/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`),
        {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch project members: ${response.statusText}`);
      }

      const members = await response.json();
      dispatch({ type: 'SET_PEOPLE', payload: members });
      dispatch({ type: 'SET_ISSUES', payload: [] }); // Clear issues when switching to project view
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchIssuesAndPeople = async (sprintId: number) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // First get sprint issues using agile API to get the issue keys
      const sprintResponse = await fetch(
        buildApiUrl(`/rest/agile/1.0/sprint/${sprintId}/issue`),
        {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
          },
        }
      );

      if (!sprintResponse.ok) {
        throw new Error(`Failed to fetch sprint issues: ${sprintResponse.statusText}`);
      }

      const sprintData = await sprintResponse.json();
      const issueKeys = sprintData.issues.map((issue: any) => issue.key).join(',');

      if (!issueKeys) {
        dispatch({ type: 'SET_ISSUES', payload: [] });
        dispatch({ type: 'SET_PEOPLE', payload: [] });
        return;
      }

      // Now fetch detailed issue data with reporter field using search API
      const response = await fetch(
        buildApiUrl(`/rest/api/3/search?jql=key in (${issueKeys})&fields=summary,status,assignee,reporter,priority,issuetype,epic,parent`),
        {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`);
      }

      const issuesData = await response.json();
      const issues = issuesData.issues;

      // Extract unique people from issues
      const people: Person[] = [];
      const seenAccountIds = new Set<string>();

      issues.forEach((issue: Issue) => {
        if (issue.fields.assignee && !seenAccountIds.has(issue.fields.assignee.accountId)) {
          people.push(issue.fields.assignee);
          seenAccountIds.add(issue.fields.assignee.accountId);
        }
        if (issue.fields.reporter && !seenAccountIds.has(issue.fields.reporter.accountId)) {
          people.push(issue.fields.reporter);
          seenAccountIds.add(issue.fields.reporter.accountId);
        }
      });

      dispatch({ type: 'SET_ISSUES', payload: issues });
      dispatch({ type: 'SET_PEOPLE', payload: people });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        saveCredentials,
        fetchProjects,
        fetchSprints,
        fetchProjectMembers,
        fetchIssuesAndPeople,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
