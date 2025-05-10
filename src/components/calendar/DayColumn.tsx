import React from 'react';
import { format } from 'date-fns';
import { Task } from '@/types';
import CalendarTaskCard from './TaskCard';
import CurrentTimeLine from './CurrentTimeLine';

interface DayColumnProps {
  day: Date;
  timeSlots: string[];
  currentTimePosition: number | null;
  tasks: Task[];
  draggingTask: string | null;
  previewChange: { taskId: string; height: number; transform: string } | null;
  editingTaskId: string | null;
  editingTaskName: string;
  findTaskForSlot: (day: Date, time: string) => Task | undefined;
  isSlotContinuation: (day: Date, time: string, index: number) => boolean;
  getTaskDuration: (task: Task) => number;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, day: Date, time: string) => void;
  allowDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleResizeStart: (
    e: React.MouseEvent,
    taskId: string,
    currentDuration: number,
    edge: 'top' | 'bottom',
    element: HTMLDivElement
  ) => void;
  handleRemoveTask: (e: React.MouseEvent, taskId: string) => void;
  handleMarkComplete: (e: React.MouseEvent, taskId: string) => void;
  handleEditTaskName: (taskId: string, currentName: string) => void;
  handleTaskNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveTaskName: () => void;
  handleTaskNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  day,
  timeSlots,
  currentTimePosition,
  tasks,
  draggingTask,
  previewChange,
  editingTaskId,
  editingTaskName,
  findTaskForSlot,
  isSlotContinuation,
  getTaskDuration,
  handleDrop,
  allowDrop,
  handleResizeStart,
  handleRemoveTask,
  handleMarkComplete,
  handleEditTaskName,
  handleTaskNameChange,
  handleSaveTaskName,
  handleTaskNameKeyDown,
}) => {
  return (
    <div className="flex-1 flex flex-col min-w-[150px] relative border-r border-gray-700">
      {/* Day header */}
      <div className="h-12 border-b border-gray-700 p-2 bg-gray-800 sticky top-0">
        <div className="font-medium text-gray-200">{format(day, 'EEE')}</div>
        <div className="text-xs text-gray-400">{format(day, 'MMM d')}</div>
      </div>

      {/* Current time line */}
      <CurrentTimeLine day={day} position={currentTimePosition} />

      {/* Time slots */}
      {timeSlots.map((time, timeIndex) => {
        const task = findTaskForSlot(day, time);
        const isContinuation = isSlotContinuation(day, time, timeIndex);

        return (
          <div
            key={`slot-${timeIndex}`}
            className={`h-6 border-r border-gray-700 ${
              time.endsWith(':00') ? 'border-b border-gray-700' : 'border-b border-gray-800'
            } ${!task && !isContinuation ? 'hover:bg-gray-800' : ''}`}
            onDragOver={allowDrop}
            onDrop={(e) => {
              if (!task && !isContinuation) {
                handleDrop(e, day, time);
              }
            }}
          >
            {task && !isContinuation && (
              <CalendarTaskCard
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('taskId', task.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                duration={getTaskDuration(task)}
                isEditing={editingTaskId === task.id}
                editingTaskName={editingTaskName}
                previewChange={previewChange}
                draggingTask={draggingTask}
                onResizeStart={(e, edge) => {
                  const element = e.currentTarget.parentElement as HTMLDivElement;
                  handleResizeStart(e, task.id, getTaskDuration(task), edge, element);
                }}
                onRemoveTask={(e) => handleRemoveTask(e, task.id)}
                onMarkComplete={(e) => handleMarkComplete(e, task.id)}
                onEditTaskName={() => handleTaskNameEdit(task.id, task.name)}
                onTaskNameChange={handleTaskNameChange}
                onSaveTaskName={handleSaveTaskName}
                onTaskNameKeyDown={handleTaskNameKeyDown}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DayColumn;
