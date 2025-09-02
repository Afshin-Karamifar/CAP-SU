import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

export function ProjectSelectionRequired() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <span>Project Selection Required</span>
          </CardTitle>
          <CardDescription>
            You need to select a project first to view team members and start stand-ups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to="/settings">
              Go to Settings to Select Project
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
