import { Link, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Settings, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '@/contexts/AppContext';

export function Layout() {
  const location = useLocation();
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <motion.h1
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {state.projectName || 'Project Name'}
            </motion.h1>
            <div className="flex items-center space-x-2">
              <Button
                variant={location.pathname === '/' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <Link to="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
              <Button
                variant={location.pathname === '/settings' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <Link to="/settings" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </Button>
              <ModeToggle />
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
