
import React from 'react';
import TimeColumn from './calendar/TimeColumn';
import DayColumn from './calendar/DayColumn';
import DragPreview from './calendar/DragPreview';
import CalendarStyles from './calendar/CalendarStyles';
import { useCalendar } from './calendar/useCalendar';

const Calendar: React.FC = () => {
  const {
    days,
    timeSlots,
    tasks,
    draggingTask,
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
    handleMouseDown,
    handleResizeStart,
    handleMarkComplete,
    handleRemoveTask,
    handleEditTaskName,
    handleSaveTaskName,
    handleTaskNameKeyDown,
    handleTaskNameChange
  } = useCalendar();

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200" ref={calendarRef}>
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Schedule</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Time column */}
          <TimeColumn timeSlots={timeSlots} />
          
          {/* Calendar days */}
          {days.map((day, dayIndex) => (
            <DayColumn
              key={`day-${dayIndex}`}
              day={day}
              timeSlots={timeSlots}
              currentTimePosition={calculateTimeLinePosition()}
              tasks={tasks}
              draggingTask={draggingTask}
              previewChange={previewChange}
              editingTaskId={editingTaskId}
              editingTaskName={editingTaskName}
              findTaskForSlot={findTaskForSlot}
              isSlotContinuation={isSlotContinuation}
              getTaskDuration={getTaskDuration}
              handleDrop={handleDrop}
              allowDrop={allowDrop}
              handleMouseDown={handleMouseDown}
              handleResizeStart={handleResizeStart}
              handleRemoveTask={handleRemoveTask}
              handleMarkComplete={handleMarkComplete}
              handleEditTaskName={handleEditTaskName}
              handleTaskNameChange={handleTaskNameChange}
              handleSaveTaskName={handleSaveTaskName}
              handleTaskNameKeyDown={handleTaskNameKeyDown}
            />
          ))}
        </div>
      </div>
      
      {/* Dragging preview */}
      <DragPreview 
        draggingTask={draggingTask}
        dragPosition={dragPosition}
        originalTaskData={originalTaskData}
        tasks={tasks}
        getTaskDuration={getTaskDuration}
      />
      
      {/* Add global styles */}
      <CalendarStyles />
    </div>
  );
};

export default Calendar;
