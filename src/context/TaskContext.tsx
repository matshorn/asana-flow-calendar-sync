
import { createContext, useContext } from 'react';
import { Task, Project } from '@/types';
import { TaskProvider } from './TaskProvider';

// Define the context shape
export interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  filteredTasks: Task[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  asanaToken: string;
  setAsanaToken: (token: string) => void;
  loading: boolean;
  syncWithAsana: () => void;
  createTask: (name: string, projectId: string) => void;
  addTask: (taskData: { name: string; projectId: string; timeEstimate?: number }) => void;
  updateTaskTimeEstimate: (taskId: string, timeEstimate: number) => void;
  scheduleTask: (taskId: string, day: Date, startTime: string) => void;
  markTaskComplete: (taskId: string) => void;
  removeTaskFromCalendar: (taskId: string) => void;
  updateTaskName: (taskId: string, name: string) => void;
  setProjects: (projects: Project[]) => void;
}

// Create the context with default values
const TaskContext = createContext<TaskContextType>({
  tasks: [],
  projects: [],
  filteredTasks: [],
  selectedProjectId: null,
  setSelectedProjectId: () => {},
  asanaToken: '',
  setAsanaToken: () => {},
  loading: false,
  syncWithAsana: () => {},
  createTask: () => {},
  addTask: () => {},
  updateTaskTimeEstimate: () => {},
  scheduleTask: () => {},
  markTaskComplete: () => {},
  removeTaskFromCalendar: () => {},
  updateTaskName: () => {},
  setProjects: () => {},
});

// Custom hook to use the context
export const useTaskContext = () => useContext(TaskContext);

// Export both the context and provider
export { TaskContext, TaskProvider };
