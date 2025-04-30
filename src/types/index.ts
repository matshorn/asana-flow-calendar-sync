
export interface Task {
  id: string;
  name: string;
  projectId: string;
  timeEstimate?: number; // in minutes
  scheduledTime?: {
    day: Date;
    startTime: string; // format "HH:MM"
    endTime?: string; // format "HH:MM"
  };
  completed?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
}

export interface CalendarSlot {
  day: Date;
  time: string;
  task?: Task;
}
