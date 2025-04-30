import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { toast } from '@/components/ui/use-toast';

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
  asanaToken: string;
  setAsanaToken: (token: string) => void;
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

// Replace 'YOUR_ASANA_TOKEN_HERE' with your actual Asana token
const FIXED_ASANA_TOKEN = '2/708730772520/1210120911116555:51c156887a0bebcf8c101daac7f13496';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the fixed token instead of reading from localStorage
  const [asanaToken, setAsanaToken] = useState<string>(FIXED_ASANA_TOKEN);

  // Remove localStorage effect since we're using a fixed token

  // Initialize with mock data or fetch from Asana
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        if (asanaToken) {
          await fetchFromAsana();
        } else {
          // Use mock data as fallback
          setProjects(mockProjects);
          setTasks(mockTasks);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load tasks');
        setLoading(false);
      }
    };

    initializeData();
  }, []); // Remove asanaToken dependency since it won't change

  // Fetch data from Asana API
  const fetchFromAsana = async () => {
    if (!asanaToken) {
      throw new Error('Asana token is required');
    }

    try {
      // First get the user's workspace
      const workspaceResponse = await fetch('https://app.asana.com/api/1.0/workspaces', {
        headers: {
          'Authorization': `Bearer ${asanaToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!workspaceResponse.ok) {
        throw new Error('Failed to fetch workspaces. Please check your token.');
      }
      
      const workspaceData = await workspaceResponse.json();
      
      if (!workspaceData.data || workspaceData.data.length === 0) {
        throw new Error('No workspaces found');
      }
      
      const workspaceId = workspaceData.data[3].gid;
      
      // Fetch projects
      const projectsResponse = await fetch(`https://app.asana.com/api/1.0/workspaces/${workspaceId}/projects`, {
        headers: {
          'Authorization': `Bearer ${asanaToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await projectsResponse.json();
      
      // Transform Asana projects to our format
      const fetchedProjects: Project[] = projectsData.data.map((p: any) => ({
        id: p.gid,
        name: p.name,
        color: p.color || '#796eff' // Default color if not provided by Asana
      }));
      
      setProjects(fetchedProjects);
      
      // Fetch tasks for each project
      const allTasks: Task[] = [];
      
      for (const project of fetchedProjects) {
        const tasksResponse = await fetch(`https://app.asana.com/api/1.0/projects/${project.id}/tasks`, {
          headers: {
            'Authorization': `Bearer ${asanaToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          
          // Transform Asana tasks to our format
          const projectTasks: Task[] = tasksData.data.map((t: any) => ({
            id: t.gid,
            name: t.name,
            projectId: project.id,
            // Keep any existing time estimates or schedules if we're refreshing
            // and the task already exists
            ...tasks.find(existingTask => existingTask.id === t.gid)
          }));
          
          allTasks.push(...projectTasks);
        }
      }
      
      setTasks(allTasks);
      toast({
        title: "Asana Sync Successful",
        description: `Loaded ${allTasks.length} tasks from ${fetchedProjects.length} projects.`,
      });
      
    } catch (err: any) {
      console.error('Error fetching from Asana:', err);
      setError(err.message || 'Failed to fetch from Asana');
      // Fall back to mock data if API fails
      setProjects(mockProjects);
      setTasks(mockTasks);
      toast({
        title: "Asana Sync Error",
        description: err.message || "Failed to fetch from Asana",
        variant: "destructive",
      });
    }
  };

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
          // Now supporting 15-minute granularity
          const timeEstimate = task.timeEstimate || 30; // default to 30 minutes
          const startTimeParts = startTime.split(':').map(Number);
          
          // Calculate new end time with proper minute handling
          let endHour = startTimeParts[0];
          let endMinute = startTimeParts[1] + timeEstimate;
          
          while (endMinute >= 60) {
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
      if (asanaToken) {
        await fetchFromAsana();
      } else {
        // If no token, simulate API delay and refresh mock data
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
      }
      
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
      asanaToken,
      setAsanaToken,
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
