
import { useEffect, useState } from 'react';
import { Task, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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
    console.log("Loading data from localStorage");
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks);
        console.log("Loaded tasks from localStorage:", parsedTasks.length);
        setTasks(parsedTasks);
      } catch (e) {
        console.error("Error parsing tasks from localStorage:", e);
      }
    }

    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects);
        console.log("Loaded projects from localStorage:", parsedProjects.length);
        setProjects(parsedProjects);
      } catch (e) {
        console.error("Error parsing projects from localStorage:", e);
      }
    } else {
      // Add default projects if none exist
      const defaultProjects: Project[] = [
        { id: uuidv4(), name: "Work", color: "#796eff" },
        { id: uuidv4(), name: "Personal", color: "#ff8c00" }
      ];
      console.log("Adding default projects:", defaultProjects);
      setProjects(defaultProjects);
      localStorage.setItem('projects', JSON.stringify(defaultProjects));
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    console.log("Saving tasks to localStorage:", tasks.length);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    console.log("Saving projects to localStorage:", projects.length);
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
    setProjects,
    filteredTasks,
    selectedProjectId,
    setSelectedProjectId,
    asanaToken,
    setAsanaToken,
  };
};
