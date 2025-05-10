import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import { addDays } from 'date-fns';
import { useTaskContext } from '@/context/TaskContext';

export const useCalendar = () => {
  const {
    tasks: allTasks,
    scheduleTask,
    updateTaskTimeEstimate,
    markTaskComplete,
    removeTaskFromCalendar,
    updateTaskName,
  } = useTaskContext();

  // Only active tasks
  const tasks = allTasks.filter((task) => !task.completed);
  const today = new Date();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Resizing state
  const [resizing, setResizing] = useState<{
    taskId: string;
    startY: number;
    startDuration: number;
    edge: 'top' | 'bottom';
    originalHeight: number;
  } | null>(null);

  // Preview for resizing
  const [previewChange, setPreviewChange] = useState<{
    taskId: string;
    height: number;
    transform: string;
  } | null>(null);

  // Editing name
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<string>('');

  const calendarRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Prepare days (today + next 2 days)
  const days = [today, addDays(today, 1), addDays(today, 2)];

  // Time slots 08:00-18:00 at 15min intervals
  const timeSlots: string[] = [];
  for (let h = 8; h < 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeSlots.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      );
    }
  }

  // Helpers
  const findTaskForSlot = (day: Date, time: string) => {
    return tasks.find(
      (task) =>
        task.scheduledTime?.day &&
        new Date(task.scheduledTime.day).toDateString() === day.toDateString() &&
        task.scheduledTime.startTime === time
    );
  };

  const getTaskDuration = (task: Task) => {
    return task.timeEstimate ? Math.ceil(task.timeEstimate / 15) : 2;
  };

  const isSlotContinuation = (day: Date, time: string, index: number) => {
    for (let i = 1; i <= 8; i++) {
      if (index - i < 0) break;
      const prevTime = timeSlots[index - i];
      const prevTask = findTaskForSlot(day, prevTime);
      if (prevTask && i < getTaskDuration(prevTask)) return true;
    }
    return false;
  };

  // Calculate the vertical position (in px) of the current time line
  const calculateTimeLinePosition = (): number | null => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    // Show only within 08:00-18:00
    if (currentHour < 8 || currentHour >= 18) {
      return null;
    }
    const startHour = 8;
    const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;
    const slotHeight = 24; // px per 15-min slot
    const slotsPerHour = 4;
    // Compute position in pixels from top of slots
    return (minutesSinceStart / 60) * slotHeight * slotsPerHour;
  };

  // Unified HTML5 drag-and-drop handlers
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    day: Date,
    time: string
  ) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    scheduleTask(taskId, day, time);
  };

  // Resize handlers (unchanged)
  const handleResizeStart = (
    e: React.MouseEvent,
    taskId: string,
    currentDuration: number,
    edge: 'top' | 'bottom',
    element: HTMLDivElement
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const originalHeight = element.clientHeight;
    setResizing({ taskId, startY: e.clientY, startDuration: currentDuration, edge, originalHeight });
    setPreviewChange({ taskId, height: originalHeight, transform: 'translateY(0)' });
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    e.preventDefault();
    const yDiff = e.clientY - resizing.startY;
    if (resizing.edge === 'bottom') {
      const newHeight = Math.max(24, resizing.originalHeight + yDiff);
      setPreviewChange((prev) => prev && { ...prev, height: newHeight });
    } else {
      const newHeight = Math.max(24, resizing.originalHeight - yDiff);
      setPreviewChange((prev) =>
        prev && ({
          ...prev,
          height: newHeight,
          transform: `translateY(${yDiff}px)`
        })
      );
    }
  };

  const handleResizeEnd = () => {
    if (!resizing || !previewChange) {
      cleanupResize();
      return;
    }
    const slotHeight = 24;
    const slots = Math.round(previewChange.height / slotHeight);
    const newMinutes = slots * 15;
    updateTaskTimeEstimate(resizing.taskId, newMinutes);
    cleanupResize();
  };

  const cleanupResize = () => {
    setResizing(null);
    setPreviewChange(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Task actions
  const handleMarkComplete = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    markTaskComplete(taskId);
  };

  const handleRemoveTask = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeTaskFromCalendar(taskId);
  };

  // Name editing
  const handleEditTaskName = (taskId: string, currentName: string) => {
    setEditingTaskId(taskId);
    setEditingTaskName(currentName);
  };

  const handleSaveTaskName = () => {
    if (editingTaskId && editingTaskName.trim()) {
      updateTaskName(editingTaskId, editingTaskName.trim());
      setEditingTaskId(null);
      setEditingTaskName('');
    }
  };

  const handleTaskNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTaskName();
    if (e.key === 'Escape') setEditingTaskId(null);
  };

  const handleTaskNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTaskName(e.target.value);
  };

  return {
    days,
    timeSlots,
    currentTime,
    calculateTimeLinePosition,
    tasks,
    resizing,
    previewChange,
    editingTaskId,
    editingTaskName,
    calendarRef,
    findTaskForSlot,
    getTaskDuration,
    isSlotContinuation,
    allowDrop,
    handleDrop,
    handleResizeStart,
    handleMarkComplete,
    handleRemoveTask,
    handleEditTaskName,
    handleSaveTaskName,
    handleTaskNameKeyDown,
    handleTaskNameChange
  };
};
