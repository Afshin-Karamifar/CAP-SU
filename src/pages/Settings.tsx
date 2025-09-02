import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp, type Project } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Eye, EyeOff, Loader2 } from 'lucide-react';

export function Settings() {
  const { state, saveCredentials, fetchProjects, fetchProjectMembers, dispatch } = useApp();
  const [projectName, setProjectName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.projectName) {
      setProjectName(state.projectName);
    }
    if (state.email) {
      setEmail(state.email);
    }
    if (state.apiToken) {
      setToken(state.apiToken);
    }
  }, [state.projectName, state.email, state.apiToken]);

  useEffect(() => {
    // Fetch projects when credentials are available
    if (state.apiToken && state.email && state.projects.length === 0) {
      fetchProjects();
    }
  }, [state.apiToken, state.email]);

  useEffect(() => {
    // Fetch project members when a project is selected
    if (state.selectedProject) {
      fetchProjectMembers(state.selectedProject.key);
    }
  }, [state.selectedProject]);

  const handleSave = async () => {
    try {
      await saveCredentials(projectName, email, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save credentials:', error);
      // Handle error - could show a toast or error message
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = state.projects.find((p: Project) => p.id === projectId);
    if (project) {
      dispatch({ type: 'SET_SELECTED_PROJECT', payload: project });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Atlassian API Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your Atlassian credentials to access Jira data. The domain is automatically configured for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter your project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Atlassian email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token</Label>
            <div className="relative">
              <Input
                id="apiToken"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Atlassian API token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">How to get your API token:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Go to <strong>https://id.atlassian.com/manage-profile/security/api-tokens</strong></li>
              <li>2. Click "Create API token"</li>
              <li>3. Give it a label and copy the generated token</li>
              <li>4. Paste both your email and token here</li>
              <li>5. Click Save to store your credentials</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> These credentials are stored locally in your browser and are used for Basic Authentication with the Jira API.
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleSave}
              disabled={!projectName.trim() || !email.trim() || !token.trim()}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {saved ? 'Saved!' : 'Save Project'}
            </Button>
          </motion.div>

          {state.projectName && state.email && state.apiToken && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Project saved successfully! You can now use the application to fetch Jira data.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Project Selection Card */}
      <AnimatePresence>
        {state.projectName && state.email && state.apiToken && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Project Selection</CardTitle>
                <CardDescription>
                  Choose a project to work with. This selection will be saved for future sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Select
                      onValueChange={handleProjectChange}
                      value={state.selectedProject?.id || ''}
                      disabled={state.loading || state.projects.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.projects.map((project: Project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} ({project.key})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {state.loading && (
                      <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading projects...</span>
                      </div>
                    )}
                  </div>

                  {state.selectedProject && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        ✅ Selected project: <strong>{state.selectedProject.name}</strong> ({state.selectedProject.key})
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        This project selection has been saved and will be remembered for future sessions.
                      </p>
                    </motion.div>
                  )}

                  {state.error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {state.error}
                      </p>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
