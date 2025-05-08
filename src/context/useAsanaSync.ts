import { useState } from 'react';
import { Task, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';

interface AsanaWorkspace {
  gid: string;
  name: string;
}

interface AsanaProject {
  gid: string;
  name: string;
  color: string;
}

interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  due_on: string | null;
  notes: string;
}

// Hardcoded Asana token
const ASANA_TOKEN = "2/708730772520/1210120911116555:51c156887a0bebcf8c101daac7f13496";

// Specify a specific workspace ID here
const SPECIFIC_WORKSPACE_ID = "708730772520"; // Replace with your desired workspace ID

export const useAsanaSync = () => {
  const [loading, setLoading] = useState<boolean>(false);
  
  // Function to sync with Asana
  const syncWithAsana = async () => {
    console.log("Starting Asana sync...");
    setLoading(true);
    try {
      // If using a specific workspace ID
      if (SPECIFIC_WORKSPACE_ID) {
        console.log(`Using specific workspace ID: ${SPECIFIC_WORKSPACE_ID}`);
        
        // Fetch projects in the specified workspace
        console.log(`Fetching projects for workspace: ${SPECIFIC_WORKSPACE_ID}`);
        const projectsResponse = await fetch(`https://app.asana.com/api/1.0/workspaces/${SPECIFIC_WORKSPACE_ID}/projects`, {
          headers: {
            'Authorization': `Bearer ${ASANA_TOKEN}`,
            'Accept': 'application/json'
          }
        });
        
        if (!projectsResponse.ok) {
          throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
        }
        
        const projectsData = await projectsResponse.json();
        console.log("Projects data:", projectsData);
        const asanaProjects: AsanaProject[] = projectsData.data;
        
        if (asanaProjects.length === 0) {
          toast({
            title: "No Projects Found",
            description: "No projects were found in your Asana workspace.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Transform Asana projects to our app's format
        const projects: Project[] = asanaProjects.map(project => ({
          id: project.gid,
          name: project.name,
          color: project.color || "#796eff" // Use default color if not provided
        }));
        
        // Fetch tasks for each project
        const allTasks: Task[] = [];
        
        console.log("Fetching tasks for", asanaProjects.length, "projects...");
        
        for (const project of asanaProjects) {
          console.log("Fetching tasks for project:", project.name);
          const tasksResponse = await fetch(`https://app.asana.com/api/1.0/projects/${project.gid}/tasks`, {
            headers: {
              'Authorization': `Bearer ${ASANA_TOKEN}`,
              'Accept': 'application/json'
            }
          });
          
          if (!tasksResponse.ok) {
            console.error(`Failed to fetch tasks for project ${project.name}: ${tasksResponse.status}`);
            continue;
          }
          
          const tasksData = await tasksResponse.json();
          console.log(`Tasks data for project ${project.name}:`, tasksData);
          const projectTasks: AsanaTask[] = tasksData.data;
          
          // Get full task details for each task
          for (const task of projectTasks) {
            try {
              console.log("Fetching details for task:", task.gid);
              const taskDetailResponse = await fetch(`https://app.asana.com/api/1.0/tasks/${task.gid}`, {
                headers: {
                  'Authorization': `Bearer ${ASANA_TOKEN}`,
                  'Accept': 'application/json'
                }
              });
              
              if (taskDetailResponse.ok) {
                const taskDetail = await taskDetailResponse.json();
                const taskData = taskDetail.data;
                
                // Parse due_on date if available
                let scheduledTime = undefined;
                if (taskData.due_on) {
                  const dueDate = new Date(taskData.due_on);
                  // Default to 10:00 AM for tasks with due dates
                  scheduledTime = {
                    day: dueDate,
                    startTime: "10:00",
                  };
                }
                
                allTasks.push({
                  id: taskData.gid,
                  name: taskData.name,
                  projectId: project.gid,
                  completed: taskData.completed,
                  timeEstimate: 30, // Default time estimate
                  scheduledTime, // Add the scheduled time if available
                });
                console.log("Added task:", taskData.name);
              } else {
                console.error(`Error fetching details for task ${task.gid}: Status ${taskDetailResponse.status}`);
              }
            } catch (error) {
              console.error(`Error fetching details for task ${task.gid}:`, error);
            }
          }
        }
        
        console.log("Sync completed. Fetched", allTasks.length, "tasks from", projects.length, "projects");
        
        // Assign some tasks to today's calendar for better demo experience
        const today = new Date();
        const tasksToSchedule = Math.min(5, allTasks.length);
        
        for (let i = 0; i < tasksToSchedule; i++) {
          if (allTasks[i] && !allTasks[i].scheduledTime) {
            // Spread tasks throughout the day starting at 9 AM
            const hour = 9 + Math.floor(i / 2);
            const minute = (i % 2) * 30;
            
            allTasks[i].scheduledTime = {
              day: today,
              startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            };
          }
        }
        
        // Return the fetched data
        return {
          projects,
          tasks: allTasks
        };
      } else {
        // Original code for fetching workspaces and selecting the first one
        console.log("Fetching workspaces...");
        const workspacesResponse = await fetch('https://app.asana.com/api/1.0/workspaces', {
          headers: {
            'Authorization': `Bearer ${ASANA_TOKEN}`,
            'Accept': 'application/json'
          }
        });
        
        if (!workspacesResponse.ok) {
          throw new Error(`Failed to fetch workspaces: ${workspacesResponse.status}`);
        }
        
        const workspacesData = await workspacesResponse.json();
        console.log("Workspaces data:", workspacesData);
        const workspaces: AsanaWorkspace[] = workspacesData.data;
        
        if (workspaces.length === 0) {
          toast({
            title: "No Workspaces Found",
            description: "No workspaces were found in your Asana account.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Use the first workspace
        const primaryWorkspace = workspaces[3];
        console.log("Using workspace:", primaryWorkspace.name);
        
        // Fetch projects in the workspace
        console.log("Fetching projects for workspace:", primaryWorkspace.gid);
        const projectsResponse = await fetch(`https://app.asana.com/api/1.0/workspaces/${primaryWorkspace.gid}/projects`, {
          headers: {
            'Authorization': `Bearer ${ASANA_TOKEN}`,
            'Accept': 'application/json'
          }
        });
        
        if (!projectsResponse.ok) {
          throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
        }
        
        const projectsData = await projectsResponse.json();
        console.log("Projects data:", projectsData);
        const asanaProjects: AsanaProject[] = projectsData.data;
        
        if (asanaProjects.length === 0) {
          toast({
            title: "No Projects Found",
            description: "No projects were found in your Asana workspace.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Transform Asana projects to our app's format
        const projects: Project[] = asanaProjects.map(project => ({
          id: project.gid,
          name: project.name,
          color: project.color || "#796eff" // Use default color if not provided
        }));
        
        // Fetch tasks for each project
        const allTasks: Task[] = [];
        
        console.log("Fetching tasks for", asanaProjects.length, "projects...");
        
        for (const project of asanaProjects) {
          console.log("Fetching tasks for project:", project.name);
          const tasksResponse = await fetch(`https://app.asana.com/api/1.0/projects/${project.gid}/tasks`, {
            headers: {
              'Authorization': `Bearer ${ASANA_TOKEN}`,
              'Accept': 'application/json'
            }
          });
          
          if (!tasksResponse.ok) {
            console.error(`Failed to fetch tasks for project ${project.name}: ${tasksResponse.status}`);
            continue;
          }
          
          const tasksData = await tasksResponse.json();
          console.log(`Tasks data for project ${project.name}:`, tasksData);
          const projectTasks: AsanaTask[] = tasksData.data;
          
          // Get full task details for each task
          for (const task of projectTasks) {
            try {
              console.log("Fetching details for task:", task.gid);
              const taskDetailResponse = await fetch(`https://app.asana.com/api/1.0/tasks/${task.gid}`, {
                headers: {
                  'Authorization': `Bearer ${ASANA_TOKEN}`,
                  'Accept': 'application/json'
                }
              });
              
              if (taskDetailResponse.ok) {
                const taskDetail = await taskDetailResponse.json();
                const taskData = taskDetail.data;
                
                // Parse due_on date if available
                let scheduledTime = undefined;
                if (taskData.due_on) {
                  const dueDate = new Date(taskData.due_on);
                  // Default to 10:00 AM for tasks with due dates
                  scheduledTime = {
                    day: dueDate,
                    startTime: "10:00",
                  };
                }
                
                allTasks.push({
                  id: taskData.gid,
                  name: taskData.name,
                  projectId: project.gid,
                  completed: taskData.completed,
                  timeEstimate: 30, // Default time estimate
                  scheduledTime, // Add the scheduled time if available
                });
                console.log("Added task:", taskData.name);
              } else {
                console.error(`Error fetching details for task ${task.gid}: Status ${taskDetailResponse.status}`);
              }
            } catch (error) {
              console.error(`Error fetching details for task ${task.gid}:`, error);
            }
          }
        }
        
        console.log("Sync completed. Fetched", allTasks.length, "tasks from", projects.length, "projects");
        
        // Assign some tasks to today's calendar for better demo experience
        const today = new Date();
        const tasksToSchedule = Math.min(5, allTasks.length);
        
        for (let i = 0; i < tasksToSchedule; i++) {
          if (allTasks[i] && !allTasks[i].scheduledTime) {
            // Spread tasks throughout the day starting at 9 AM
            const hour = 9 + Math.floor(i / 2);
            const minute = (i % 2) * 30;
            
            allTasks[i].scheduledTime = {
              day: today,
              startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            };
          }
        }
        
        // Return the fetched data
        return {
          projects,
          tasks: allTasks
        };
      }
    } catch (error) {
      console.error('Error syncing with Asana:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Asana. Please check the console for details.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, syncWithAsana };
};
