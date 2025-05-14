
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
        font-family: Georgia, 'Times New Roman', Times, serif;
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
        font-family: Georgia, 'Times New Roman', Times, serif;
      }
      
      /* Prevent task buttons from triggering the drag */
      .task-action-button {
        pointer-events: auto !important;
      }
      .resize-handle {
        pointer-events: auto !important;
      }
      
      /* Subtle grid background for time slots */
      .time-slot {
        background-image: linear-gradient(rgba(200, 200, 200, 0.015) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(200, 200, 200, 0.015) 1px, transparent 1px);
        background-size: 10px 10px;
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
