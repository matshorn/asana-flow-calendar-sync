
import React from 'react';
import { isToday } from 'date-fns';

interface CurrentTimeLineProps {
  day: Date;
  position: number | null;
}

const CurrentTimeLine: React.FC<CurrentTimeLineProps> = ({ day, position }) => {
  if (!isToday(day) || position === null) {
    return null;
  }

  return (
    <div 
      className="absolute left-0 right-0 border-t border-red-400 z-10 pointer-events-none"
      style={{ 
        top: `${position + 48}px`, // 48px offset for the header height
      }}
    >
      <div className="absolute -left-1 -top-2 h-4 w-4 rounded-full bg-red-400" />
    </div>
  );
};

export default CurrentTimeLine;
