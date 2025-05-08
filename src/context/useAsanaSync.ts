
import { useState } from 'react';
import { Task, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';

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

export const useAsanaSync = (asanaToken: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  // Function to sync with Asana
  const syncWithAsana = async () => {
    if (!asanaToken) {
      toast({
        title: "No Asana Token",
        description: "Please set your Asana Personal Access Token first.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // First, fetch user workspaces
      const workspacesResponse = await fetch('https://app.asana.com/api/1.0/workspaces', {
        headers: {
          'Authorization': `Bearer ${asanaToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!workspacesResponse.ok) {
        throw new Error(`Failed to fetch workspaces: ${workspacesResponse.status}`);
      }
      
      const workspacesData = await workspacesResponse.json();
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
      const primaryWorkspace = workspaces[0];
      
      // Fetch projects in the workspace
      const projectsResponse = await fetch(`https://app.asana.com/api/1.0/workspaces/${primaryWorkspace.gid}/projects`, {
        headers: {
          'Authorization': `Bearer ${asanaToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
      }
      
      const projectsData = await projectsResponse.json();
      const asanaProjects: AsanaProject[] = projectsData.data;
      
      // Transform Asana projects to our app's format
      const projects: Project[] = asanaProjects.map(project => ({
        id: project.gid,
        name: project.name,
        color: project.color || "#796eff" // Use default color if not provided
      }));
      
      // Fetch tasks for each project
      const allTasks: Task[] = [];
      
      for (const project of asanaProjects) {
        const tasksResponse = await fetch(`https://app.asana.com/api/1.0/projects/${project.gid}/tasks`, {
          headers: {
            'Authorization': `Bearer ${asanaToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (!tasksResponse.ok) {
          console.error(`Failed to fetch tasks for project ${project.name}: ${tasksResponse.status}`);
          continue;
        }
        
        const tasksData = await tasksResponse.json();
        const projectTasks: AsanaTask[] = tasksData.data;
        
        // Get full task details for each task
        for (const task of projectTasks) {
          try {
            const taskDetailResponse = await fetch(`https://app.asana.com/api/1.0/tasks/${task.gid}`, {
              headers: {
                'Authorization': `Bearer ${asanaToken}`,
                'Accept': 'application/json'
              }
            });
            
            if (taskDetailResponse.ok) {
              const taskDetail = await taskDetailResponse.json();
              const taskData = taskDetail.data;
              
              allTasks.push({
                id: taskData.gid,
                name: taskData.name,
                projectId: project.gid,
                completed: taskData.completed,
                timeEstimate: 30, // Default time estimate
                // Only adding fields that exist in the Task type
              });
            }
          } catch (error) {
            console.error(`Error fetching details for task ${task.gid}:`, error);
          }
        }
      }
      
      // Return the fetched data
      return {
        projects,
        tasks: allTasks
      };
      
    } catch (error) {
      console.error('Error syncing with Asana:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Asana. Please check your token and try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, syncWithAsana };
};
