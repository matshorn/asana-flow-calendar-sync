
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Define the context shape
interface TaskContextType {
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
});

// Custom hook to use the context
export const useTaskContext = () => useContext(TaskContext);

// The provider component
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for tasks and projects
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [asanaToken, setAsanaToken] = useState<string>(() => {
    const storedToken = localStorage.getItem('asanaToken');
    return storedToken || '';
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Calculate filtered tasks based on selectedProjectId
  const filteredTasks = selectedProjectId 
    ? tasks.filter(task => task.projectId === selectedProjectId)
    : tasks;

  // Load tasks and projects from localStorage on component mount
  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }

    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    }
  }, []);

  // Save tasks and projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  // Save Asana token to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('asanaToken', asanaToken);
  }, [asanaToken]);

  // Function to create a new task
  const createTask = (name: string, projectId: string) => {
    const newTask: Task = {
      id: uuidv4(),
      name,
      projectId,
    };
    setTasks([...tasks, newTask]);
  };

  // Function to add a task with optional time estimate
  const addTask = (taskData: { name: string; projectId: string; timeEstimate?: number }) => {
    const newTask: Task = {
      id: uuidv4(),
      name: taskData.name,
      projectId: taskData.projectId,
      timeEstimate: taskData.timeEstimate,
    };
    setTasks([...tasks, newTask]);
  };

  // Function to sync with Asana
  const syncWithAsana = async () => {
    if (!asanaToken) {
      console.error('No Asana token set');
      return;
    }
    
    setLoading(true);
    try {
      // For now, this is just a placeholder since we don't have actual Asana integration yet
      console.log('Syncing with Asana using token:', asanaToken);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, we would fetch data from Asana API here
      
    } catch (error) {
      console.error('Error syncing with Asana:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update a task's time estimate
  const updateTaskTimeEstimate = (taskId: string, timeEstimate: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, timeEstimate } : task
      )
    );
  };

  // Function to schedule a task
  const scheduleTask = (taskId: string, day: Date, startTime: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              scheduledTime: {
                day: day,
                startTime: startTime,
              },
            }
          : task
      )
    );
  };

  // Function to mark a task as complete/incomplete
  const markTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Function to remove a task from the calendar
  const removeTaskFromCalendar = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, scheduledTime: undefined } : task
      )
    );
  };

  // Function to update task name
  const updateTaskName = (taskId: string, name: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, name } : task
      )
    );
  };

  // Context value
  const value = {
    tasks,
    projects,
    filteredTasks,
    selectedProjectId,
    setSelectedProjectId,
    asanaToken,
    setAsanaToken,
    loading,
    syncWithAsana,
    createTask,
    addTask,
    updateTaskTimeEstimate,
    scheduleTask,
    markTaskComplete,
    removeTaskFromCalendar,
    updateTaskName,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
