
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project } from '@/types';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedProjectId: (id: string | null) => void;
  updateTaskTimeEstimate: (taskId: string, timeEstimate: number) => void;
  scheduleTask: (taskId: string, day: Date, startTime: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  syncWithAsana: () => Promise<void>;
  filteredTasks: Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Mock Asana API response for prototyping
const mockProjects: Project[] = [
  { id: 'project-1', name: 'Website Redesign', color: '#796eff' },
  { id: 'project-2', name: 'Marketing Campaign', color: '#fd7e42' },
  { id: 'project-3', name: 'Product Roadmap', color: '#25e8c8' },
];

const mockTasks: Task[] = [
  { id: 'task-1', name: 'Update homepage banner', projectId: 'project-1' },
  { id: 'task-2', name: 'Redesign about page', projectId: 'project-1' },
  { id: 'task-3', name: 'Create social media graphics', projectId: 'project-2' },
  { id: 'task-4', name: 'Draft email newsletter', projectId: 'project-2' },
  { id: 'task-5', name: 'Prioritize Q3 features', projectId: 'project-3' },
  { id: 'task-6', name: 'Create user journey map', projectId: 'project-3' },
];

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with mock data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from Asana API
        setProjects(mockProjects);
        setTasks(mockTasks);
        setLoading(false);
      } catch (err) {
        setError('Failed to load tasks');
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Filter tasks based on selected project
  const filteredTasks = selectedProjectId 
    ? tasks.filter(task => task.projectId === selectedProjectId) 
    : tasks;

  const updateTaskTimeEstimate = (taskId: string, timeEstimate: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, timeEstimate } : task
      )
    );
  };

  const scheduleTask = (taskId: string, day: Date, startTime: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          // Calculate end time based on task's time estimate
          const timeEstimate = task.timeEstimate || 60; // default to 1 hour
          const startTimeParts = startTime.split(':').map(Number);
          let endHour = startTimeParts[0] + Math.floor(timeEstimate / 60);
          let endMinute = startTimeParts[1] + (timeEstimate % 60);
          
          if (endMinute >= 60) {
            endHour += 1;
            endMinute -= 60;
          }
          
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
          
          return {
            ...task,
            scheduledTime: {
              day,
              startTime,
              endTime,
            }
          };
        }
        return task;
      })
    );
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const syncWithAsana = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would make an API call to Asana
      // For now, we'll just simulate a delay and refresh with the mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProjects(mockProjects);
      
      // Preserve existing time estimates and scheduling
      const updatedTasks = mockTasks.map(mockTask => {
        const existingTask = tasks.find(t => t.id === mockTask.id);
        if (existingTask) {
          return {
            ...mockTask,
            timeEstimate: existingTask.timeEstimate,
            scheduledTime: existingTask.scheduledTime,
          };
        }
        return mockTask;
      });
      
      setTasks(updatedTasks);
      setLoading(false);
    } catch (err) {
      setError('Failed to sync with Asana');
      setLoading(false);
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      projects,
      selectedProjectId,
      loading,
      error,
      setTasks,
      setProjects,
      setSelectedProjectId,
      updateTaskTimeEstimate,
      scheduleTask,
      addTask,
      syncWithAsana,
      filteredTasks,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
