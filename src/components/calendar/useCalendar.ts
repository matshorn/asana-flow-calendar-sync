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
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.task-action-button') || target.closest('.resize-handle') || target.closest('input')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDraggingTask(taskId);
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ left: rect.left, top: rect.top });
    setOriginalTaskData({ day, startTime, rect });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('calendar-dragging');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingTask) return;
    e.preventDefault();
    e.stopPropagation();
    setDragPosition({ left: e.clientX - dragOffset.x, top: e.clientY - dragOffset.y });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!draggingTask || !dragPosition || !originalTaskData || !calendarRef.current) return;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.classList.remove('calendar-dragging');

    const calendarRect = calendarRef.current.getBoundingClientRect();
    const slotHeight = 24;
    const dayHeaderHeight = 48;
    const timeColumnWidth = 60;
    const availableWidth = calendarRect.width - timeColumnWidth;
    const columnWidth = availableWidth / days.length;

    const previewLeft = dragPosition.left;
    const previewTop = dragPosition.top;

    const dayIndex = Math.min(
      days.length - 1,
      Math.max(0, Math.floor((previewLeft - calendarRect.left - timeColumnWidth + dragOffset.x / 2) / columnWidth))
    );
    const targetDay = days[dayIndex];

    const relativeY = previewTop - calendarRect.top - dayHeaderHeight;
    const slotIndex = Math.min(
      timeSlots.length - 1,
      Math.max(0, Math.floor(relativeY / slotHeight))
    );
    const targetTime = timeSlots[slotIndex];

    scheduleTask(draggingTask, targetDay, targetTime);
    setDraggingTask(null);
    setDragPosition(null);
    setOriginalTaskData(null);
  };

  // Resize and other handlers unchanged
  const handleResizeStart = (e, taskId, currentDuration, edge, element) => {/* ... */};
  const handleMarkComplete = (e, taskId) => {/* ... */};
  const handleRemoveTask = (e, taskId) => {/* ... */};
  const handleEditTaskName = (taskId, currentName) => {/* ... */};
  const handleSaveTaskName = () => {/* ... */};
  const handleTaskNameKeyDown = (e) => {/* ... */};
  const handleTaskNameChange = (e) => {/* ... */};

  return {
    days,
    timeSlots,
    currentTime,
    calculateTimeLinePosition,
    tasks,
    draggingTask,
    dragPosition,
    originalTaskData,
    previewChange,
    editingTaskId,
    editingTaskName,
    calendarRef,
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
