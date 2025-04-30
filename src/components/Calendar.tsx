
import React, { useState, useRef, useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { format, addDays, isToday } from 'date-fns';
import { Task } from '@/types';
import { Card } from '@/components/ui/card';
import { StretchVertical, CheckCircle, Circle, Trash } from 'lucide-react';

const Calendar: React.FC = () => {
  const { tasks, scheduleTask, updateTaskTimeEstimate, markTaskComplete, removeTaskFromCalendar } = useTaskContext();
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
  const [dragging, setDragging] = useState<{
    taskId: string;
    startY: number;
    originalTop: number;
  } | null>(null);
  
  // Track preview changes during resize
  const [previewChange, setPreviewChange] = useState<{
    taskId: string;
    height: number;
    transform: string;
  } | null>(null);

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
  
  // Check if a task is short (15 minutes or less)
  const isShortTask = (task: Task): boolean => {
    return task.timeEstimate !== undefined && task.timeEstimate < 20;
  };

  // Handle drop of a task onto the calendar
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date, time: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      scheduleTask(taskId, day, time);
    }
  };

  // Allow dropping on calendar cells
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  // Start resizing an event
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
  
  // Handle mouse movement during resize
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
  
  // End resizing and apply changes
  const handleResizeEnd = (e: MouseEvent) => {
    if (!resizing || !previewChange) {
      setResizing(null);
      setPreviewChange(null);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
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
          let newHour = oldHour;
          let newMinute = oldMinute;
          
          // Adjust time by 15 minutes slots
          let totalMinutes = newHour * 60 + newMinute - (slotsShifted * 15);
          newHour = Math.floor(totalMinutes / 60);
          newMinute = totalMinutes % 60;
          
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
    
    // Clean up
    setResizing(null);
    setPreviewChange(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Start dragging an event (to move it)
  const handleDragStart = (
    e: React.MouseEvent,
    taskId: string,
    element: HTMLDivElement
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get task position
    const rect = element.getBoundingClientRect();
    
    setDragging({
      taskId,
      startY: e.clientY,
      originalTop: rect.top
    });
    
    // Add event listeners for mouse move and mouse up
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  // Handle mouse movement during drag
  const handleDragMove = (e: MouseEvent) => {
    if (!dragging) return;
    
    // Prevent text selection during drag
    e.preventDefault();
    
    // Calculate how many pixels moved
    const yDiff = e.clientY - dragging.startY;
    
    // Update the preview change
    setPreviewChange(prev => ({
      taskId: dragging.taskId,
      height: prev?.height || 0, // Keep existing height if available
      transform: `translateY(${yDiff}px)`
    }));
  };
  
  // End dragging and apply changes
  const handleDragEnd = (e: MouseEvent) => {
    if (!dragging || !previewChange) {
      setDragging(null);
      setPreviewChange(null);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      return;
    }
    
    // Calculate slots moved
    const slotHeight = 24; // Height of each 15-minute slot in pixels
    const transformMatch = previewChange.transform.match(/translateY\((-?\d+(\.\d+)?)px\)/);
    const offsetY = transformMatch ? parseFloat(transformMatch[1]) : 0;
    
    // Calculate how many 15-minute slots were shifted
    const slotsShifted = Math.round(offsetY / slotHeight);
    
    if (slotsShifted !== 0) {
      // Find the task and update its start time
      const task = tasks.find(t => t.id === dragging.taskId);
      if (task && task.scheduledTime) {
        const oldStartTime = task.scheduledTime.startTime;
        const [oldHour, oldMinute] = oldStartTime.split(':').map(Number);
        
        // Calculate new start time
        let totalMinutes = oldHour * 60 + oldMinute + (slotsShifted * 15);
        let newHour = Math.floor(totalMinutes / 60);
        let newMinute = totalMinutes % 60;
        
        // Bounds check (8:00 - 17:45)
        if (newHour < 8) newHour = 8;
        if (newHour > 17) newHour = 17;
        if (newHour === 17 && newMinute > 45) newMinute = 45;
        
        const newStartTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
        
        // Only reschedule if the time actually changed
        if (newStartTime !== oldStartTime) {
          scheduleTask(task.id, task.scheduledTime.day, newStartTime);
        }
      }
    }
    
    // Clean up
    setDragging(null);
    setPreviewChange(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Handle marking task as complete
  const handleMarkComplete = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    markTaskComplete(taskId);
  };

  // Remove task from calendar
  const handleRemoveTask = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeTaskFromCalendar(taskId);
  };

  return (
    <div className="h-full flex flex-col" ref={calendarRef}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Schedule</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Time column */}
          <div className="w-16 flex-shrink-0">
            <div className="h-12"></div> {/* Empty cell for header row */}
            {timeSlots.map((time, index) => {
              // Only show time label for full hours
              const showLabel = time.endsWith(':00');
              return (
                <div 
                  key={`time-${index}`} 
                  className={`h-6 border-r ${time.endsWith(':00') ? 'border-b' : 'border-b border-gray-100'} p-1 text-xs text-gray-500 flex items-center justify-end pr-2 ${
                    showLabel ? 'relative' : ''
                  }`}
                >
                  {/* Position hour label below the line instead of above */}
                  {showLabel ? (
                    <span className="absolute -bottom-6 right-2">{time}</span>
                  ) : ''}
                </div>
              );
            })}
          </div>
          
          {/* Calendar days */}
          {days.map((day, dayIndex) => (
            <div key={`day-${dayIndex}`} className="flex-1 flex flex-col min-w-[150px] relative">
              {/* Day header */}
              <div className="h-12 border-b p-2 bg-gray-50 sticky top-0">
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
              </div>
              
              {/* Current time line - only show for today's column */}
              {isToday(day) && calculateTimeLinePosition() !== null && (
                <div 
                  className="absolute left-0 right-0 border-t border-red-500 z-10 pointer-events-none"
                  style={{ 
                    top: `${calculateTimeLinePosition() + 48}px`, // 48px offset for the header height
                  }}
                >
                  <div className="absolute -left-1 -top-2 h-4 w-4 rounded-full bg-red-500" />
                </div>
              )}
              
              {/* Time slots */}
              {timeSlots.map((time, timeIndex) => {
                const task = findTaskForSlot(day, time);
                const isContinuation = isSlotContinuation(day, time, timeIndex);
                
                return (
                  <div 
                    key={`slot-${dayIndex}-${timeIndex}`} 
                    className={`h-6 border-r ${time.endsWith(':00') ? 'border-b' : 'border-b border-gray-100'} ${
                      !task && !isContinuation ? 'hover:bg-gray-50' : ''
                    }`}
                    onDragOver={!task && !isContinuation ? allowDrop : undefined}
                    onDrop={!task && !isContinuation ? (e) => handleDrop(e, day, time) : undefined}
                  >
                    {task && !isContinuation && (
                      <Card
                        className={`m-0.5 p-1 text-xs overflow-hidden flex flex-col relative group transition-all ${
                          dragging?.taskId === task.id || resizing?.taskId === task.id ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                        style={{ 
                          backgroundColor: task.completed ? 'rgba(121, 110, 255, 0.05)' : 'rgba(121, 110, 255, 0.1)',
                          borderLeft: `3px solid ${task.completed ? '#a8a8a8' : (task.timeEstimate ? '#796eff' : '#fd7e42')}`,
                          height: previewChange?.taskId === task.id 
                            ? `${previewChange.height - 4}px` // Subtract margin
                            : `calc(${getTaskDuration(task) * 24 - 4}px)`, // Convert slots to pixels (24px per slot)
                          transform: previewChange?.taskId === task.id 
                            ? previewChange.transform
                            : undefined,
                          zIndex: previewChange?.taskId === task.id ? 50 : 1,
                          transition: resizing || dragging ? 'none' : 'background-color 0.2s ease',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          opacity: task.completed ? 0.7 : 1,
                        }}
                        onMouseDown={(e) => {
                          // Middle of the card - start dragging
                          if (!task.completed) {
                            handleDragStart(e, task.id, e.currentTarget as HTMLDivElement);
                          }
                        }}
                      >
                        {/* Top resize handle */}
                        {!task.completed && (
                          <div 
                            className="absolute top-0 left-0 w-full h-2 cursor-ns-resize bg-transparent hover:bg-gray-300 opacity-0 group-hover:opacity-80 flex items-center justify-center"
                            onMouseDown={(e) => {
                              const element = e.currentTarget.parentElement as HTMLDivElement;
                              handleResizeStart(e, task.id, getTaskDuration(task), 'top', element);
                            }}
                          >
                            <StretchVertical className="h-1 w-3" />
                          </div>
                        )}
                        
                        <div className="font-medium truncate flex-1 flex items-center text-[10px] justify-between gap-1">
                          <span className={task.completed ? 'text-gray-500' : ''}>{task.name}</span>
                          <div className="flex items-center gap-1">
                            {/* Remove task button */}
                            <div 
                              className="cursor-pointer opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                              onClick={(e) => handleRemoveTask(e, task.id)}
                              title="Remove from calendar"
                            >
                              <Trash size={14} className="text-gray-400 hover:text-red-500" />
                            </div>
                            {/* Complete task button */}
                            <div 
                              className="cursor-pointer"
                              onClick={(e) => handleMarkComplete(e, task.id)}
                              title={task.completed ? "Mark as incomplete" : "Mark as complete"}
                            >
                              {task.completed ? (
                                <CheckCircle size={14} className="text-gray-400" />
                              ) : (
                                <Circle size={14} className="text-gray-400 hover:text-gray-600" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Show duration for non-short tasks */}
                        {!isShortTask(task) && getTaskDuration(task) > 1 && (
                          <div className="text-gray-500 mt-0.5 text-[10px]">
                            {Math.floor(task.timeEstimate! / 60) > 0 && `${Math.floor(task.timeEstimate! / 60)}h `}
                            {task.timeEstimate! % 60 > 0 && `${task.timeEstimate! % 60}m`}
                          </div>
                        )}
                        
                        {/* Bottom resize handle */}
                        {!task.completed && (
                          <div 
                            className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize bg-transparent hover:bg-gray-300 opacity-0 group-hover:opacity-80 flex items-center justify-center"
                            onMouseDown={(e) => {
                              const element = e.currentTarget.parentElement as HTMLDivElement;
                              handleResizeStart(e, task.id, getTaskDuration(task), 'bottom', element);
                            }}
                          >
                            <StretchVertical className="h-1 w-3" />
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
