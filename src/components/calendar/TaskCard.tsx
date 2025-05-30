
import React from 'react';
import { Task } from '@/types';
import { Card } from '@/components/ui/card';
import { StretchVertical, CheckCircle, Circle, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTaskContext } from '@/context/TaskContext';

interface TaskCardProps {
  task: Task;
  duration: number;
  isEditing: boolean;
  editingTaskName: string;
  previewChange: {
    taskId: string;
    height: number;
    transform: string;
  } | null;
  draggingTask: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, edge: 'top' | 'bottom') => void;
  onRemoveTask: (e: React.MouseEvent) => void;
  onMarkComplete: (e: React.MouseEvent) => void;
  onEditTaskName: () => void;
  onTaskNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveTaskName: () => void;
  onTaskNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const CalendarTaskCard: React.FC<TaskCardProps> = ({
  task,
  duration,
  isEditing,
  editingTaskName,
  previewChange,
  draggingTask,
  onMouseDown,
  onResizeStart,
  onRemoveTask,
  onMarkComplete,
  onEditTaskName,
  onTaskNameChange,
  onSaveTaskName,
  onTaskNameKeyDown
}) => {
  // Get projects to find task's project color
  const { projects } = useTaskContext();
  
  // Find the project for this task
  const project = projects.find(p => p.id === task.projectId);
  
  // Get project color with fallback
  const projectColor = project?.color || '#796eff';
  
  // Check if a task is short (15 minutes or less)
  const isShortTask = (task: Task): boolean => {
    return task.timeEstimate !== undefined && task.timeEstimate < 20;
  };

  // Apply preview changes if this task is being resized
  const previewStyles = previewChange && previewChange.taskId === task.id
    ? {
        height: `${previewChange.height}px`,
        transform: previewChange.transform
      }
    : {};

  return (
    <Card
      id={`task-${task.id}`}
      className={`m-0.5 p-1 text-xs overflow-hidden flex flex-col relative group transition-all calendar-event ${
        task.id === draggingTask ? 'opacity-50' : ''
      } ${!task.completed ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ 
        backgroundColor: task.completed ? `${projectColor}15` : `${projectColor}25`,
        borderLeft: `3px solid ${task.completed ? '#a8a8a8' : projectColor}`,
        height: `${duration * 24}px`, // Convert slots to pixels (24px per slot)
        textDecoration: task.completed ? 'line-through' : 'none',
        opacity: task.completed ? 0.6 : 1,
        color: '#ffffff',
        ...previewStyles
      }}
      onMouseDown={!task.completed ? onMouseDown : undefined}
    >
      {/* Top resize handle */}
      {!task.completed && (
        <div 
          className="resize-handle absolute top-0 left-0 w-full h-3 cursor-ns-resize bg-transparent hover:bg-gray-600 opacity-0 group-hover:opacity-80 flex items-center justify-center"
          onMouseDown={(e) => onResizeStart(e, 'top')}
        >
          <StretchVertical className="h-2 w-3" />
        </div>
      )}
      
      <div className="font-medium truncate flex-1 flex items-center text-[10px] justify-between gap-1">
        {isEditing ? (
          <Input
            type="text"
            value={editingTaskName}
            onChange={onTaskNameChange}
            onBlur={onSaveTaskName}
            onKeyDown={onTaskNameKeyDown}
            className="h-5 text-[10px] p-0 border-none bg-gray-700 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={task.completed ? 'text-gray-400' : 'text-gray-100'}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!task.completed) {
                onEditTaskName();
              }
            }}
          >
            {task.name}
          </span>
        )}
        <div className="flex items-center gap-1">
          {/* Remove task button - Made always visible */}
          <div 
            className="task-action-button cursor-pointer hover:text-red-400 transition-opacity"
            onClick={onRemoveTask}
            title="Remove from calendar"
          >
            <Trash size={14} className="text-gray-400 hover:text-red-400" />
          </div>
          {/* Complete task button */}
          <div 
            className="task-action-button cursor-pointer"
            onClick={onMarkComplete}
            title={task.completed ? "Mark as incomplete" : "Mark as complete"}
          >
            {task.completed ? (
              <CheckCircle size={14} className="text-gray-400" />
            ) : (
              <Circle size={14} style={{ color: projectColor }} />
            )}
          </div>
        </div>
      </div>
      
      {/* Show duration for non-short tasks */}
      {!isShortTask(task) && duration > 1 && (
        <div className="text-gray-300 mt-0.5 text-[10px]">
          {Math.floor(task.timeEstimate! / 60) > 0 && `${Math.floor(task.timeEstimate! / 60)}h `}
          {task.timeEstimate! % 60 > 0 && `${task.timeEstimate! % 60}m`}
        </div>
      )}
      
      {/* Bottom resize handle */}
      {!task.completed && (
        <div 
          className="resize-handle absolute bottom-0 left-0 w-full h-3 cursor-ns-resize bg-transparent hover:bg-gray-600 opacity-0 group-hover:opacity-80 flex items-center justify-center"
          onMouseDown={(e) => onResizeStart(e, 'bottom')}
        >
          <StretchVertical className="h-2 w-3" />
        </div>
      )}
    </Card>
  );
};

export default CalendarTaskCard;
