
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

  return (
    <Card
      className="task-card-dragging"
      style={{
        left: `${dragPosition.left}px`,
        top: `${dragPosition.top}px`,
        backgroundColor: 'rgba(121, 110, 255, 0.2)',
        borderLeft: '3px solid #796eff',
        height: originalTaskData ? 
          `${getTaskDuration(task) * 24}px` : 'auto'
      }}
    >
      <div className="p-1">
        {task.name}
      </div>
    </Card>
  );
};

export default DragPreview;
