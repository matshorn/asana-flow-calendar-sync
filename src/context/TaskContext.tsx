import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Define the context shape
interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  createTask: (name: string, projectId: string) => void;
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
  createTask: () => {},
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

  // Function to create a new task
  const createTask = (name: string, projectId: string) => {
    const newTask: Task = {
      id: uuidv4(),
      name,
      projectId,
    };
    setTasks([...tasks, newTask]);
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
    createTask,
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
