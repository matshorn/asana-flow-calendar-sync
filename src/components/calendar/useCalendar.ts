import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import { format, addDays, isToday } from 'date-fns';
import { useTaskContext } from '@/context/TaskContext';

export const useCalendar = () => {
  const { tasks: allTasks, scheduleTask, updateTaskTimeEstimate, markTaskComplete, removeTaskFromCalendar, updateTaskName } = useTaskContext();
  
  // Filter out completed tasks
  const tasks = allTasks.filter(task => !task.completed);
  
  const today = new Date();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [resizing, setResizing] = useState<{
    taskId: string;
    startY: number;
    startDuration: number;
    edge: 'top' | 'bottom';
    originalHeight: number;
  } | null>(null);
  
  // For drag and drop functionality
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ left: number, top: number } | null>(null);
  const [originalTaskData, setOriginalTaskData] = useState<{
    day: Date,
    startTime: string,
    rect: DOMRect
  } | null>(null);
  
  // Add preview change state for resizing
  const [previewChange, setPreviewChange] = useState<{
    taskId: string,
    height: number,
    transform: string
  } | null>(null);
  
  // Add state for editing task name in calendar
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<string>('');
  
  const calendarRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    // Initial set
    setCurrentTime(new Date());
    
    return () => clearInterval(timer);
  }, []);
  
  // Generate 3 days (today + next 2 days)
  const days = [
    today,
    addDays(today, 1),
    addDays(today, 2),
  ];
  
  // Generate time slots from 8:00 to 18:00 with 15 minute intervals
  const timeSlots = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  
  // Calculate the position of the current time line
  const calculateTimeLinePosition = () => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // If current time is outside working hours (8:00-18:00), don't show the line
    if (currentHour < 8 || currentHour >= 18) {
      return null;
    }
    
    // Calculate position as percentage from the top of the calendar
    const startHour = 8; // Calendar starts at 8:00
    const totalMinutesInDay = (18 - 8) * 60; // Total minutes in the calendar day (8:00-18:00)
    const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;
    
    // Height of each 15-min slot in px
    const slotHeight = 24; // Each 15-min slot is 24px tall
    const slotsPerHour = 4; // 4 slots per hour (15 min each)
    
    // Calculate exact position in pixels
    const position = (minutesSinceStart / 60) * slotHeight * slotsPerHour;
    
    return position;
  };

  // Find tasks scheduled for each slot
  const findTaskForSlot = (day: Date, time: string) => {
    return tasks.find(task => {
      if (!task.scheduledTime) return false;
      
      const taskDate = task.scheduledTime.day;
      const taskDay = new Date(taskDate);
      
      // Compare dates (ignore time)
      const sameDay = 
        taskDay.getDate() === day.getDate() &&
        taskDay.getMonth() === day.getMonth() &&
        taskDay.getFullYear() === day.getFullYear();
        
      // Check if the task starts at this time slot
      const sameTime = task.scheduledTime.startTime === time;
      
      return sameDay && sameTime;
    });
  };
  
  // Calculate the duration in 15-minute slots based on time estimate
  const getTaskDuration = (task: Task) => {
    if (!task.timeEstimate) return 2; // Default 30 minutes (2 slots of 15 min)
    
    // Size rules based on time estimate
    return Math.ceil(task.timeEstimate / 15);
  };
  
  // Check if a slot is occupied by an already rendered task
  const isSlotContinuation = (day: Date, time: string, index: number) => {
    // Look at previous slots to see if there's a task that spans over this slot
    for (let i = 1; i <= 8; i++) { // Look back up to 2 hours (8 slots of 15 min each)
      if (index - i < 0) break;
      
      const previousTime = timeSlots[index - i];
      const previousTask = findTaskForSlot(day, previousTime);
      
      if (previousTask) {
        const duration = getTaskDuration(previousTask);
        if (i < duration) {
          return true;
        }
      }
    }
    return false;
  };

  // Handle drop of a task onto the calendar
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date, time: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    console.log('Dropped task ID:', taskId);
    console.log('Drop target day:', format(day, 'yyyy-MM-dd'));
    console.log('Drop target time:', time);
    
    if (taskId) {
      scheduleTask(taskId, day, time);
    }
  };

  // Allow dropping on calendar cells
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  // Handle resizing functions
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
    
    setResizing({
      taskId,
      startY: e.clientY,
      startDuration: currentDuration,
      edge,
      originalHeight
    });
    
    // Initialize preview state
    setPreviewChange({
      taskId,
      height: originalHeight,
      transform: 'translateY(0)'
    });
    
    // Add event listeners for mouse move and mouse up
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    
    // Prevent text selection during resize
    e.preventDefault();
    
    // Calculate how many pixels moved
    const yDiff = e.clientY - resizing.startY;
    
    // Update the preview state based on which edge is being dragged
    if (resizing.edge === 'bottom') {
      // When dragging bottom, adjust height directly
      const newHeight = Math.max(24, resizing.originalHeight + yDiff); // Minimum 1 slot (24px)
      
      setPreviewChange(prev => prev ? {
        ...prev,
        height: newHeight
      } : null);
    } else if (resizing.edge === 'top') {
      // When dragging top, adjust height and position (transform)
      const heightDiff = -yDiff;
      const newHeight = Math.max(24, resizing.originalHeight + heightDiff); // Minimum 1 slot
      
      setPreviewChange(prev => prev ? {
        ...prev,
        height: newHeight,
        transform: `translateY(${yDiff}px)`
      } : null);
    }
  };
  
  const handleResizeEnd = (e: MouseEvent) => {
    if (!resizing || !previewChange) {
      cleanupResizeHandlers();
      return;
    }
    
    // Calculate time estimate based on final height
    const slotHeight = 24; // Height of each 15-minute slot in pixels
    const newDurationSlots = Math.round(previewChange.height / slotHeight);
    const newTimeEstimate = newDurationSlots * 15; // Convert slots to minutes
    
    // Find the task and update its time estimate
    const task = tasks.find(t => t.id === resizing.taskId);
    if (task) {
      updateTaskTimeEstimate(task.id, newTimeEstimate);
      
      // If dragging from the top, also update the start time
      if (resizing.edge === 'top' && task.scheduledTime) {
        // Calculate how many slots moved up/down
        const slotsShifted = Math.round(parseFloat(previewChange.transform.match(/translateY\((-?\d+(\.\d+)?)px\)/)?.[1] || '0') / slotHeight);
        
        if (slotsShifted !== 0) {
          const oldStartTime = task.scheduledTime.startTime;
          const [oldHour, oldMinute] = oldStartTime.split(':').map(Number);
          
          // Calculate new start time
          let totalMinutes = oldHour * 60 + oldMinute - (slotsShifted * 15);
          let newHour = Math.floor(totalMinutes / 60);
          let newMinute = totalMinutes % 60;
          
          // Bounds check (8:00 - 17:45)
          if (newHour < 8) newHour = 8;
          if (newHour > 17) newHour = 17;
          if (newHour === 17 && newMinute > 45) newMinute = 45;
          
          const newStartTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
          
          // Reschedule with the new start time
          scheduleTask(task.id, task.scheduledTime.day, newStartTime);
        }
      }
    }
    
    cleanupResizeHandlers();
  };
  
  const cleanupResizeHandlers = () => {
    // Clean up
    setResizing(null);
    setPreviewChange(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Handle mouse down on task to start dragging
  const handleMouseDown = (e: React.MouseEvent, taskId: string, day: Date, startTime: string) => {
    if (e.button !== 0) return; // Only handle left clicks
    
    // If clicking on a button or resize handle or input, don't initiate drag
    const target = e.target as HTMLElement;
    if (
      target.closest('.task-action-button') || 
      target.closest('.resize-handle') ||
      target.closest('input')
    ) {
      return;
    }
    
    // Stop event propagation to prevent text selection
    e.stopPropagation();
    e.preventDefault();
    
    const taskElement = e.currentTarget as HTMLElement;
    const rect = taskElement.getBoundingClientRect();
    
    // Calculate click offset within the task element
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggingTask(taskId);
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ left: rect.left, top: rect.top });
    setOriginalTaskData({
      day,
      startTime,
      rect
    });
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add a class to the body to disable text selection during drag
    document.body.classList.add('calendar-dragging');
  };
  
  // Handle mouse move during drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingTask) return;
    
    // Prevent default to avoid text selection and other unwanted behaviors
    e.preventDefault();
    e.stopPropagation();
    
    // Update the position based on mouse position and original offset
    setDragPosition({
      left: e.clientX - dragOffset.x,
      top: e.clientY - dragOffset.y
    });
  };
  
  // Handle mouse up to end dragging
  const handleMouseUp = (e: MouseEvent) => {
    if (!draggingTask || !dragPosition || !originalTaskData || !calendarRef.current) return;
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.classList.remove('calendar-dragging');
    
    // Get the calendar container rect
    const calendarRect = calendarRef.current.getBoundingClientRect();
    
    // Calculate the time slot height and day column width
    const slotHeight = 24; // 15-min slot height in pixels
    const dayHeaderHeight = 48; // Height of the day header
    const timeColumnWidth = 60; // Width of the time column on the left
    const availableWidth = calendarRect.width - timeColumnWidth;
    const columnWidth = availableWidth / days.length;
    
    // Important: Use the position of the drag preview, not the mouse position
    // Calculate where the top-left corner of the task preview is relative to calendar
    const previewLeft = dragPosition.left;
    const previewTop = dragPosition.top;
    
    // Determine which day column the drop occurred in
    const dayIndex = Math.min(
      days.length - 1,
      Math.max(0, Math.floor((previewLeft + (dragOffset.x / 2) - calendarRect.left - timeColumnWidth) / columnWidth))
    );
    const targetDay = days[dayIndex];
    
    // Calculate time slot based on the preview's top position
    const relativeY = previewTop - calendarRect.top - dayHeaderHeight;
    
    // Find which time slot this corresponds to
    const slotIndex = Math.min(
      timeSlots.length - 1,
      Math.max(0, Math.floor(relativeY / slotHeight))
    );
    const targetTime = timeSlots[slotIndex];
    
    console.log('Drop position calculation:', {
      dragPosition,
      calendarRect: {
        top: calendarRect.top,
        left: calendarRect.left,
        width: calendarRect.width
      },
      dayHeaderHeight,
      timeColumnWidth,
      columnWidth,
      mousePosition: { x: e.clientX, y: e.clientY },
      dayIndex,
      relativeY,
      slotIndex,
      targetTime,
      dragOffset
    });
    
    // Update the task's schedule
    scheduleTask(draggingTask, targetDay, targetTime);
    
    // Reset dragging state
    setDraggingTask(null);
    setDragPosition(null);
    setOriginalTaskData(null);
  };

  // Task action handlers
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
  
  // Task name editing functions
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
    if (e.key === 'Enter') {
      handleSaveTaskName();
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
      setEditingTaskName('');
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
    resizing,
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
    handleDrop,
    allowDrop,
    handleResizeStart,
    handleMouseDown,
    handleMarkComplete,
    handleRemoveTask,
    handleEditTaskName,
    handleSaveTaskName,
    handleTaskNameKeyDown,
    handleTaskNameChange
  };
};
