import React from 'react';
import { Card } from '@/components/ui/card';
import { Task } from '@/types';

interface DragPreviewProps {
  draggingTask: string | null;
  dragPosition: { left: number; top: number } | null;
  dragOffset: { x: number; y: number } | null;
  originalTaskData: { day: Date; startTime: string; rect: DOMRect } | null;
  tasks: Task[];
  getTaskDuration: (task: Task) => number;
}

const DragPreview: React.FC<DragPreviewProps> = ({
  draggingTask,
  dragPosition,
  dragOffset,
  originalTaskData,
  tasks,
  getTaskDuration
}) => {
  if (!draggingTask || !dragPosition || !dragOffset || !originalTaskData) {
    return null;
  }

  const task = tasks.find((t) => t.id === draggingTask);
  if (!task) return null;

  const projectColor = task.projectId ? '#796eff' : '#796eff';

  // Use original element width for preview, if available
  const width = originalTaskData.rect.width;

  return (
    <Card
      className="task-card-dragging pointer-events-none"
      style={{
        position: 'fixed',
        left: `${dragPosition.left - dragOffset.x}px`,
        top: `${dragPosition.top - dragOffset.y}px`,
        backgroundColor: 'rgba(121, 110, 255, 0.3)',
        borderLeft: '3px solid',
        borderLeftColor: projectColor,
        height: `${getTaskDuration(task) * 24}px`, // dynamic height based on slots
        width: `${width}px`,
        zIndex: 50,
        opacity: 0.85,
        overflow: 'hidden',
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
