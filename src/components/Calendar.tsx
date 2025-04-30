
import React from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { format, addDays } from 'date-fns';
import { CalendarSlot, Task } from '@/types';
import { Card } from '@/components/ui/card';

const Calendar: React.FC = () => {
  const { tasks, scheduleTask } = useTaskContext();
  const today = new Date();
  
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
                        className="m-1 p-2 text-xs h-full overflow-hidden flex flex-col"
                        style={{ 
                          backgroundColor: 'rgba(121, 110, 255, 0.1)',
                          borderLeft: `3px solid ${task.timeEstimate ? '#796eff' : '#fd7e42'}`,
                          height: `calc(${getTaskDuration(task) * 3}rem - 0.5rem)`,
                        }}
                      >
                        <div className="font-medium truncate">{task.name}</div>
                        {task.timeEstimate && (
                          <div className="text-gray-500 mt-1">
                            {Math.floor(task.timeEstimate / 60) > 0 && `${Math.floor(task.timeEstimate / 60)}h `}
                            {task.timeEstimate % 60 > 0 && `${task.timeEstimate % 60}m`}
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
