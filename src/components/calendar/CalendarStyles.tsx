
import React, { useEffect } from 'react';

const CalendarStyles: React.FC = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body.calendar-dragging {
        user-select: none !important;
      }
      body.calendar-dragging * {
        cursor: grabbing !important;
      }
      .calendar-event {
        position: relative;
        z-index: 1;
      }
      .calendar-event.dragging {
        z-index: 100;
      }
      .task-card-dragging {
        position: fixed !important;
        opacity: 0.8 !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        width: calc(100% / 3 - 20px) !important;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5) !important;
        transform: rotate(2deg) !important;
        background-color: rgba(30, 30, 30, 0.7) !important;
      }
      
      /* Prevent task buttons from triggering the drag */
      .task-action-button {
        pointer-events: auto !important;
      }
      .resize-handle {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default CalendarStyles;
