import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { useTaskContext } from '@/context/TaskContext';
import { Card } from '@/components/ui/card';
import { Circle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  project: Project | undefined;
}

// Fixed duration options in minutes
const DURATION_OPTIONS: { label: string; value: number }[] = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1 h 15 min', value: 75 },
  { label: '1 h 30 min', value: 90 },
  { label: '1 h 45 min', value: 105 },
  { label: '2 hours', value: 120 },
  { label: '2 h 30 min', value: 150 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
];

const TaskCard: React.FC<TaskCardProps> = ({ task, project }) => {
  const { updateTaskTimeEstimate, markTaskComplete, updateTaskName } = useTaskContext();
  const [timeEstimate, setTimeEstimate] = useState<number | ''>(
    task.timeEstimate ?? ''
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState(task.name);

  const handleTimeEstimateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setTimeEstimate(value);
    if (value > 0) {
      updateTaskTimeEstimate(task.id, value);
    }
  };

  const handleTaskNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
  };

  const handleTaskNameBlur = () => {
    setIsEditing(false);
    if (taskName.trim() !== task.name) {
      updateTaskName(task.id, taskName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTaskNameBlur();
    } else if (e.key === 'Escape') {
      setTaskName(task.name);
      setIsEditing(false);
    }
  };

  const projectColor = project?.color || '#796eff';

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
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
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 100);
  };

  return (
    <Card
      className={`mb-2 p-3 border-l-4 cursor-move group hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } bg-gray-700 text-gray-200 border-gray-600`}
      style={{
        borderLeftColor: projectColor,
        backgroundColor: `${projectColor}10`,
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
    >
      <div className="flex items-center gap-2">
        <div
          className="text-gray-400 hover:text-gray-300 cursor-pointer"
          onClick={() => markTaskComplete(task.id)}
          style={{ color: projectColor }}
        >
          <Circle size={18} />
        </div>
        <div className="flex-1 overflow-hidden" onDoubleClick={() => setIsEditing(true)}>
          {isEditing ? (
            <input
              type="text"
              value={taskName}
              onChange={handleTaskNameChange}
              onBlur={handleTaskNameBlur}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-600 text-gray-200"
              autoFocus
            />
          ) : (
            <div className="font-medium truncate">{task.name}</div>
          )}
          <div className="text-xs text-gray-400 truncate">
            {project?.name || 'No project'}
          </div>
        </div>
        <div className="w-28">
          <select
            value={timeEstimate}
            onChange={handleTimeEstimateChange}
            className="w-full rounded-md border border-border bg-input px-2 py-1 text-sm bg-gray-600 text-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <option disabled value="">
              Select duration…
            </option>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
