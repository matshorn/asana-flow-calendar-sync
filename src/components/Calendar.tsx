import React, { useState, useRef, useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { format, addDays } from 'date-fns';
import { Task } from '@/types';
import { Card } from '@/components/ui/card';
import { StretchVertical } from 'lucide-react';

const Calendar: React.FC = () => {
  const { tasks, scheduleTask, updateTaskTimeEstimate } = useTaskContext();
  const today = new Date();
  const [resizing, setResizing] = useState<{
    taskId: string;
    startY: number;
    startDuration: number;
    edge: 'top' | 'bottom';
    originalHeight: number;
  } | null>(null);
  
  // Track preview changes during resize
  const [previewChange, setPreviewChange] = useState<{
    taskId: string;
    height: number;
    transform: string;
  } | null>(null);

  const resizingRef = useRef<HTMLDivElement>(null);
  
  // Generate 3 days (today + next 2 days)
  const days = [
    today,
    addDays(today, 1),
    addDays(today, 2),
  ];
  
  // Generate time slots from 8:00 to 18:00 with 30 minute intervals
  const timeSlots = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  
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
  
  // Calculate the duration in 30-minute slots
  const getTaskDuration = (task: Task) => {
    if (!task.timeEstimate) return 1; // Default 30 minutes
    
    // Convert minutes to number of 30-minute slots
    return Math.ceil(task.timeEstimate / 30);
  };
  
  // Check if a slot is occupied by an already rendered task
  const isSlotContinuation = (day: Date, time: string, index: number) => {
    // Look at previous slots to see if there's a task that spans over this slot
    for (let i = 1; i <= 4; i++) { // Look back up to 2 hours (4 slots)
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
  
  // Check if a task is short (30 minutes or less)
  const isShortTask = (task: Task): boolean => {
    return task.timeEstimate !== undefined && task.timeEstimate <= 30;
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
      const newHeight = Math.max(48, resizing.originalHeight + yDiff); // Minimum 1 slot (48px)
      
      setPreviewChange(prev => prev ? {
        ...prev,
        height: newHeight
      } : null);
    } else if (resizing.edge === 'top') {
      // When dragging top, adjust height and position (transform)
      const heightDiff = -yDiff;
      const newHeight = Math.max(48, resizing.originalHeight + heightDiff); // Minimum 1 slot
      
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
    const slotHeight = 48; // Height of each 30-minute slot in pixels
    const newDurationSlots = Math.round(previewChange.height / slotHeight);
    const newTimeEstimate = newDurationSlots * 30; // Convert slots to minutes
    
    // Find the task and update its time estimate
    const task = tasks.find(t => t.id === resizing.taskId);
    if (task) {
      updateTaskTimeEstimate(task.id, newTimeEstimate);
      
      // If dragging from the top, also update the start time
      if (resizing.edge === 'top' && task.scheduledTime) {
        // Calculate how many slots moved up/down
        const slotsShifted = Math.round(-previewChange.transform.match(/-?\d+/)?.[0] / slotHeight) || 0;
        
        if (slotsShifted !== 0) {
          const oldStartTime = task.scheduledTime.startTime;
          const [oldHour, oldMinute] = oldStartTime.split(':').map(Number);
          
          // Calculate new start time
          let newHour = oldHour;
          let newMinute = oldMinute;
          
          // Adjust time by 30 minutes slots
          let totalMinutes = newHour * 60 + newMinute - (slotsShifted * 30);
          newHour = Math.floor(totalMinutes / 60);
          newMinute = totalMinutes % 60;
          
          // Bounds check (8:00 - 17:30)
          if (newHour < 8) newHour = 8;
          if (newHour > 17) newHour = 17;
          if (newHour === 17 && newMinute > 30) newMinute = 30;
          
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

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Schedule</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Time column */}
          <div className="w-16 flex-shrink-0">
            <div className="h-12"></div> {/* Empty cell for header row */}
            {timeSlots.map((time, index) => (
              <div key={`time-${index}`} className="h-12 border-r border-b p-1 text-xs text-gray-500 flex items-center justify-end pr-2">
                {time}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          {days.map((day, dayIndex) => (
            <div key={`day-${dayIndex}`} className="flex-1 flex flex-col min-w-[150px]">
              {/* Day header */}
              <div className="h-12 border-b p-2 bg-gray-50 sticky top-0">
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
              </div>
              
              {/* Time slots */}
              {timeSlots.map((time, timeIndex) => {
                const task = findTaskForSlot(day, time);
                const isContinuation = isSlotContinuation(day, time, timeIndex);
                
                return (
                  <div 
                    key={`slot-${dayIndex}-${timeIndex}`} 
                    className={`h-12 border-r border-b ${
                      !task && !isContinuation ? 'hover:bg-gray-50' : ''
                    }`}
                    onDragOver={!task && !isContinuation ? allowDrop : undefined}
                    onDrop={!task && !isContinuation ? (e) => handleDrop(e, day, time) : undefined}
                  >
                    {task && !isContinuation && (
                      <Card
                        ref={previewChange?.taskId === task.id ? resizingRef : undefined}
                        className="m-1 p-2 text-xs overflow-hidden flex flex-col relative group transition-all"
                        style={{ 
                          backgroundColor: 'rgba(121, 110, 255, 0.1)',
                          borderLeft: `3px solid ${task.timeEstimate ? '#796eff' : '#fd7e42'}`,
                          height: previewChange?.taskId === task.id 
                            ? `${previewChange.height - 8}px` // Subtract margin
                            : `calc(${getTaskDuration(task) * 3}rem - 0.5rem)`,
                          transform: previewChange?.taskId === task.id 
                            ? previewChange.transform
                            : undefined,
                          zIndex: previewChange?.taskId === task.id ? 50 : 1,
                          transition: resizing ? 'none' : 'background-color 0.2s ease',
                        }}
                      >
                        {/* Top resize handle */}
                        <div 
                          className="absolute top-0 left-0 w-full h-3 cursor-ns-resize bg-transparent hover:bg-gray-300 opacity-0 group-hover:opacity-80 flex items-center justify-center"
                          onMouseDown={(e) => {
                            const element = e.currentTarget.parentElement as HTMLDivElement;
                            handleResizeStart(e, task.id, getTaskDuration(task), 'top', element);
                          }}
                        >
                          <StretchVertical className="h-2 w-4" />
                        </div>
                        
                        {/* For short tasks (30 min or less), prioritize name display */}
                        {isShortTask(task) ? (
                          <div className="font-medium truncate flex-1 flex items-center">
                            {task.name}
                          </div>
                        ) : (
                          <>
                            <div className="font-medium truncate">{task.name}</div>
                            {task.timeEstimate && (
                              <div className="text-gray-500 mt-1">
                                {Math.floor(task.timeEstimate / 60) > 0 && `${Math.floor(task.timeEstimate / 60)}h `}
                                {task.timeEstimate % 60 > 0 && `${task.timeEstimate % 60}m`}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Bottom resize handle */}
                        <div 
                          className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize bg-transparent hover:bg-gray-300 opacity-0 group-hover:opacity-80 flex items-center justify-center"
                          onMouseDown={(e) => {
                            const element = e.currentTarget.parentElement as HTMLDivElement;
                            handleResizeStart(e, task.id, getTaskDuration(task), 'bottom', element);
                          }}
                        >
                          <StretchVertical className="h-2 w-4" />
                        </div>
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
