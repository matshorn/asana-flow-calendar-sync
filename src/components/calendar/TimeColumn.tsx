
import React from 'react';

interface TimeColumnProps {
  timeSlots: string[];
}

const TimeColumn: React.FC<TimeColumnProps> = ({ timeSlots }) => {
  return (
    <div className="w-16 flex-shrink-0 bg-gray-800 border-r border-gray-700">
      <div className="h-12 border-b border-gray-700"></div> {/* Empty cell for header row */}
      {timeSlots.map((time, index) => {
        // Only show time label for full hours
        const showLabel = time.endsWith(':00');
        return (
          <div 
            key={`time-${index}`} 
            className={`h-6 border-r border-gray-700 ${
              time.endsWith(':00') ? 'border-b border-gray-700' : 'border-b border-gray-800'
            } p-1 text-xs text-gray-400 flex items-center justify-end pr-2 ${
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
  );
};

export default TimeColumn;
