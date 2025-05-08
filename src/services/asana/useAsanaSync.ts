
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Task, Project } from '@/types';
import * as asanaApi from './asanaApi';
import * as asanaTransformer from './asanaTransformer';

export const useAsanaSync = () => {
  const [loading, setLoading] = useState<boolean>(false);
  
  /**
   * Main function to sync with Asana
   * Orchestrates the fetching and transformation of data
   */
  const syncWithAsana = async (): Promise<{ projects: Project[]; tasks: Task[] } | null> => {
    console.log("Starting Asana sync...");
    setLoading(true);
    
    try {
      // Fetch workspaces
      const workspaces = await asanaApi.fetchWorkspaces();
      
      // Select appropriate workspace
      const selectedWorkspace = asanaApi.selectWorkspace(workspaces);
      if (!selectedWorkspace) {
        setLoading(false);
        return null;
      }
      
      // Fetch projects for the selected workspace
      const asanaProjects = await asanaApi.fetchProjects(selectedWorkspace.gid);
      
      if (asanaProjects.length === 0) {
        toast({
          title: "No Projects Found",
          description: "No projects were found in your Asana workspace.",
          variant: "destructive",
        });
        setLoading(false);
        return null;
      }
      
      // Transform Asana projects to our app's format
      const projects = asanaTransformer.transformProjects(asanaProjects);
      
      // Fetch tasks for each project
      const allTasks: Task[] = [];
      
      console.log("Fetching tasks for", asanaProjects.length, "projects...");
      
      for (const project of asanaProjects) {
        const projectTasks = await asanaApi.fetchTasksForProject(project.gid);
        
        // Get full task details for each task
        for (const task of projectTasks) {
          const taskDetail = await asanaApi.fetchTaskDetails(task.gid);
          if (taskDetail) {
            const transformedTask = asanaTransformer.transformTask(taskDetail, project.gid);
            if (transformedTask) {
              allTasks.push(transformedTask);
              console.log("Added task:", taskDetail.name);
            }
          }
        }
      }
      
      if (allTasks.length === 0) {
        toast({
          title: "No Tasks Found",
          description: "No tasks were found in your Asana projects.",
          variant: "destructive",
        });
        setLoading(false);
        return { projects, tasks: [] };
      }
      
      // Assign some tasks to today for better demo experience
      const tasksWithSchedule = asanaTransformer.assignTasksToToday(allTasks);
      
      console.log("Sync completed. Fetched", tasksWithSchedule.length, "tasks from", projects.length, "projects");
      
      // Return the fetched data
      return {
        projects,
        tasks: tasksWithSchedule
      };
      
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
