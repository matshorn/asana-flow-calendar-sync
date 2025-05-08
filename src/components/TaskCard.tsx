
import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { useTaskContext } from '@/context/TaskContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, Circle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  project: Project | undefined;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, project }) => {
  const { updateTaskTimeEstimate, markTaskComplete, updateTaskName } = useTaskContext();
  const [timeEstimate, setTimeEstimate] = useState<string>(
    task.timeEstimate ? `${task.timeEstimate}` : ''
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState(task.name);

  const handleTimeEstimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeEstimate(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateTaskTimeEstimate(task.id, numValue);
    }
  };

  const handleTaskNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
  };

  const handleTaskNameBlur = () => {
    setIsEditing(false);
    // Only update if name has changed
    if (taskName.trim() !== task.name) {
      updateTaskName(task.id, taskName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTaskNameBlur();
    } else if (e.key === 'Escape') {
      setTaskName(task.name); // Reset to original name
      setIsEditing(false);
    }
  };

  // Get project color with fallback
  const projectColor = project?.color || '#796eff';

  return (
    <Card 
      className={`mb-2 p-3 border-l-4 cursor-move group hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ 
        borderLeftColor: projectColor,
        backgroundColor: `${projectColor}10` // Very light tint of the project color
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        setIsDragging(true);
        
        // Create a ghost image that matches the card appearance
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.opacity = '0.5';
        document.body.appendChild(dragImage);
        
        e.dataTransfer.setDragImage(
          dragImage,
          e.clientX - e.currentTarget.getBoundingClientRect().left,
          e.clientY - e.currentTarget.getBoundingClientRect().top
        );
        
        // Clean up the ghost image after a delay
        setTimeout(() => {
          document.body.removeChild(dragImage);
        }, 100);
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
    >
      <div className="flex items-center gap-2">
        <div 
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
          onClick={() => markTaskComplete(task.id)}
          style={{ color: projectColor }}
        >
          <Circle size={18} />
        </div>
        <div className="flex-1" onDoubleClick={() => setIsEditing(true)}>
          {isEditing ? (
            <Input
              type="text"
              value={taskName}
              onChange={handleTaskNameChange}
              onBlur={handleTaskNameBlur}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          ) : (
            <div className="font-medium">
              {task.name}
            </div>
          )}
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
