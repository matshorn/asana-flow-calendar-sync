
import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import { format, addDays } from 'date-fns';
import { useTaskContext } from '@/context/TaskContext';

export const useCalendar = () => {
  const {
    tasks: allTasks,
    scheduleTask,
    updateTaskTimeEstimate,
    markTaskComplete,
    removeTaskFromCalendar,
    updateTaskName
  } = useTaskContext();

  // Only active tasks
  const tasks = allTasks.filter(task => !task.completed);
  const today = new Date();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Manual drag state for in-calendar dragging
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ left: number; top: number } | null>(null);
  const [originalTaskData, setOriginalTaskData] = useState<{
    day: Date;
    startTime: string;
    rect: DOMRect;
  } | null>(null);

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
      timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  // Helpers
  const findTaskForSlot = (day: Date, time: string) => tasks.find(task =>
    task.scheduledTime?.day &&
    new Date(task.scheduledTime.day).toDateString() === day.toDateString() &&
    task.scheduledTime.startTime === time
  );

  const getTaskDuration = (task: Task) => task.timeEstimate ? Math.ceil(task.timeEstimate / 15) : 2;

  const isSlotContinuation = (day: Date, time: string, index: number) => {
    for (let i = 1; i <= 8; i++) {
      if (index - i < 0) break;
      const prevTime = timeSlots[index - i];
      const prevTask = findTaskForSlot(day, prevTime);
      if (prevTask && i < getTaskDuration(prevTask)) return true;
    }
    return false;
  };

  // Calculate current time line position
  const calculateTimeLinePosition = (): number | null => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    if (currentHour < 8 || currentHour >= 18) return null;
    const startHour = 8;
    const totalMinutes = (currentHour - startHour) * 60 + currentMinute;
    const slotHeight = 24; // px per 15-min slot
    const slotsPerHour = 4;
    return (totalMinutes / 60) * slotHeight * slotsPerHour;
  };

  // Unified HTML5 drop for list-to-calendar
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date, time: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    scheduleTask(taskId, day, time);
  };

  // Manual in-calendar drag handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    taskId: string,
    day: Date,
    startTime: string
  ) => {
    if (e.button !== 0) return; // Only handle left-click
    const target = e.target as HTMLElement;
    
    // Don't start drag if clicking on action buttons or resize handles
    if (target.closest('.task-action-button') || target.closest('.resize-handle') || target.closest('input')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    // Calculate offset within the element where the mouse was clicked
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // Set drag state
    setDraggingTask(taskId);
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ left: e.clientX, top: e.clientY });
    setOriginalTaskData({ day, startTime, rect });
    
    // Add global event listeners for move and up
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('calendar-dragging');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingTask) return;
    e.preventDefault();
    setDragPosition({ left: e.clientX, top: e.clientY });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!draggingTask || !dragPosition || !originalTaskData || !calendarRef.current) return;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.classList.remove('calendar-dragging');

    const calendarRect = calendarRef.current.getBoundingClientRect();
    const slotHeight = 24;
    const dayHeaderHeight = 48;
    const timeColumnWidth = 60;
    const availableWidth = calendarRect.width - timeColumnWidth;
    const columnWidth = availableWidth / days.length;

    // Calculate the day column where the task was dropped
    const previewLeft = e.clientX;
    const previewTop = e.clientY;

    // Calculate which day column the task was dropped in
    const dayIndex = Math.min(
      days.length - 1,
      Math.max(0, Math.floor((previewLeft - calendarRect.left - timeColumnWidth) / columnWidth))
    );
    const targetDay = days[dayIndex];

    // Calculate which time slot the task was dropped in
    const relativeY = previewTop - calendarRect.top - dayHeaderHeight;
    const slotIndex = Math.min(
      timeSlots.length - 1,
      Math.max(0, Math.floor(relativeY / slotHeight))
    );
    const targetTime = timeSlots[slotIndex];

    // Schedule the task to the new day and time
    scheduleTask(draggingTask, targetDay, targetTime);
    
    // Reset drag state
    setDraggingTask(null);
    setDragPosition(null);
    setOriginalTaskData(null);
  };

  // Resize and other handlers
  const handleResizeStart = (
    e: React.MouseEvent,
    taskId: string,
    currentDuration: number,
    edge: 'top' | 'bottom',
    element: HTMLDivElement
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    const rect = element.getBoundingClientRect();
    setResizing({
      taskId,
      startY: e.clientY,
      startDuration: currentDuration,
      edge,
      originalHeight: rect.height
    });
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'ns-resize';
  };
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    
    const { taskId, startY, startDuration, edge, originalHeight } = resizing;
    const deltaY = e.clientY - startY;
    const slotHeight = 24;
    
    // Calculate how many slots to add/remove
    const deltaSlots = Math.round(deltaY / slotHeight);
    let newDuration = startDuration;
    
    if (edge === 'bottom') {
      newDuration = Math.max(1, startDuration + deltaSlots);
    } else {
      // For top edge, we need to adjust both the height and the transform
      newDuration = Math.max(1, startDuration - deltaSlots);
      
      // Preview the transformation
      setPreviewChange({
        taskId,
        height: newDuration * slotHeight,
        transform: `translateY(${deltaSlots * slotHeight}px)`
      });
    }
    
    if (edge === 'bottom') {
      setPreviewChange({
        taskId,
        height: newDuration * slotHeight,
        transform: 'translateY(0)'
      });
    }
  };
  
  const handleResizeEnd = (e: MouseEvent) => {
    if (!resizing || !previewChange) return;
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    
    const { taskId } = resizing;
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      // Calculate new time estimate based on the number of slots
      const newTimeEstimate = previewChange.height / 24 * 15;
      updateTaskTimeEstimate(taskId, newTimeEstimate);
    }
    
    setResizing(null);
    setPreviewChange(null);
  };

  const handleMarkComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    markTaskComplete(taskId);
  };

  const handleRemoveTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    removeTaskFromCalendar(taskId);
  };

  const handleEditTaskName = (taskId: string, currentName: string) => {
    setEditingTaskId(taskId);
    setEditingTaskName(currentName);
  };

  const handleSaveTaskName = () => {
    if (editingTaskId && editingTaskName.trim()) {
      updateTaskName(editingTaskId, editingTaskName.trim());
    }
    setEditingTaskId(null);
  };

  const handleTaskNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTaskName();
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
    }
  };

  const handleTaskNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTaskName(e.target.value);
  };

  return {
    days,
    timeSlots,
    currentTime,
    tasks,
    draggingTask,
    dragOffset,
    dragPosition,
    originalTaskData,
    previewChange,
    editingTaskId,
    editingTaskName,
    calendarRef,
    calculateTimeLinePosition,
    findTaskForSlot,
    getTaskDuration,
    isSlotContinuation,
    allowDrop,
    handleDrop,
    handleMouseDown,
    handleResizeStart,
    handleMarkComplete,
    handleRemoveTask,
    handleEditTaskName,
    handleTaskNameChange,
    handleSaveTaskName,
    handleTaskNameKeyDown
  };
};
