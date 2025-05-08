
import React from 'react';
import { Card } from '@/components/ui/card';
import { Task } from '@/types';

interface DragPreviewProps {
  draggingTask: string | null;
  dragPosition: { left: number, top: number } | null;
  originalTaskData: { day: Date, startTime: string, rect: DOMRect } | null;
  tasks: Task[];
  getTaskDuration: (task: Task) => number;
}

const DragPreview: React.FC<DragPreviewProps> = ({
  draggingTask,
  dragPosition,
  originalTaskData,
  tasks,
  getTaskDuration
}) => {
  if (!draggingTask || !dragPosition) {
    return null;
  }

  const task = tasks.find(t => t.id === draggingTask);
  if (!task) return null;
  
  // Find the project's color for this task
  const projectId = task.projectId;
  const projectColor = projectId ? '#796eff' : '#796eff'; // Default fallback color

  return (
    <Card
      className="task-card-dragging pointer-events-none"
      style={{
        position: 'fixed',
        left: `${dragPosition.left}px`,
        top: `${dragPosition.top}px`,
        backgroundColor: 'rgba(121, 110, 255, 0.3)',
        borderLeft: '3px solid',
        borderLeftColor: projectColor,
        height: originalTaskData ? 
          `${getTaskDuration(task) * 24}px` : 'auto',
        zIndex: 50,
        opacity: 0.85,
        width: '200px', // Fixed width
        maxWidth: '200px',
        overflow: 'hidden', // Prevent text overflow
        color: '#ffffff'
      }}
    >
      <div className="p-1 text-sm truncate">
        {task.name}
      </div>
    </Card>
  );
};

export default DragPreview;
