import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ControlButtonsProps {
  selectedMemberHistoryLength: number;
  availableMembersLength: number; // Changed back to availableMembersLength
  currentHistoryIndex: number;
  isAnimating: boolean;
  onPrevious: () => void;
  onStart: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function ControlButtons({
  selectedMemberHistoryLength,
  availableMembersLength, // Changed back to availableMembersLength
  currentHistoryIndex,
  isAnimating,
  onPrevious,
  onStart,
  onNext,
  onReset,
}: ControlButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      <div className="flex justify-start items-center space-x-4 w-full">
      </div>
      <div className="flex justify-center items-center space-x-4 w-full">
        {/* Badges */}
        <div className="flex justify-center items-center w-full">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-5 py-1 text-sm rounded-l-md rounded-r-none"
          >
            {selectedMemberHistoryLength}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-5 py-1 text-sm rounded-r-md rounded-l-none"
          >
            {availableMembersLength}
          </Badge>
        </div>
      </div>
      <div className="flex justify-end items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          disabled={currentHistoryIndex <= 0 || isAnimating}
          className="rounded-l-md rounded-r-none w-12 h-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          onClick={onStart}
          disabled={availableMembersLength === 0 || isAnimating}
          className="rounded-none w-12 h-8"
          size="icon"
        >
          <RefreshCw className={`h-4 w-4 ${isAnimating ? 'animate-spin' : ''}`} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={currentHistoryIndex >= selectedMemberHistoryLength - 1 || isAnimating}
          className="rounded-r-md rounded-l-none w-12 h-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          disabled={selectedMemberHistoryLength === 0 || isAnimating}
          className="ml-2 w-12 h-8"
          title="Reset - Clear all selections"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
