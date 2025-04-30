
import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { useTaskContext } from '@/context/TaskContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Grip } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  project: Project | undefined;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, project }) => {
  const { updateTaskTimeEstimate } = useTaskContext();
  const [timeEstimate, setTimeEstimate] = useState<string>(
    task.timeEstimate ? `${task.timeEstimate}` : ''
  );

  const handleTimeEstimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeEstimate(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateTaskTimeEstimate(task.id, numValue);
    }
  };

  // Styling based on the project
  const borderColor = project?.color || '#796eff';

  return (
    <Card 
      className="mb-2 p-3 border-l-4 cursor-move group hover:shadow-md transition-shadow"
      style={{ borderLeftColor: borderColor }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        const dragElement = e.currentTarget;
        dragElement.classList.add('animate-task-drag');
        
        // Add a small delay before setting a drag image to allow the animation to start
        setTimeout(() => {
          const rect = dragElement.getBoundingClientRect();
          e.dataTransfer.setDragImage(
            dragElement, 
            e.clientX - rect.left, 
            e.clientY - rect.top
          );
        }, 10);
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('animate-task-drag');
      }}
    >
      <div className="flex items-center gap-2">
        <div className="drag-handle text-gray-400 hover:text-gray-600">
          <Grip size={16} />
        </div>
        <div className="flex-1">
          <div className="font-medium">{task.name}</div>
          <div className="text-xs text-gray-500">
            {project?.name || 'No project'}
          </div>
        </div>
        <div className="w-20 flex items-center gap-1">
          <Input
            type="text"
            value={timeEstimate}
            onChange={handleTimeEstimateChange}
            placeholder="mins"
            className="h-7 w-full text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
