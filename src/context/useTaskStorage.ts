
import { useEffect, useState } from 'react';
import { Task, Project } from '@/types';

// Custom hook to handle task storage
export const useTaskStorage = () => {
  // State for tasks and projects
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [asanaToken, setAsanaToken] = useState<string>(() => {
    const storedToken = localStorage.getItem('asanaToken');
    return storedToken || '';
  });
  
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

  return {
    tasks,
    setTasks,
    projects,
    filteredTasks,
    selectedProjectId,
    setSelectedProjectId,
    asanaToken,
    setAsanaToken,
  };
};
