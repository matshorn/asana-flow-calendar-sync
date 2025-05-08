
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
      console.log("Fetched workspaces:", workspaces.length);
      
      // Select appropriate workspace
      const selectedWorkspace = asanaApi.selectWorkspace(workspaces);
      if (!selectedWorkspace) {
        console.error("No workspace selected");
        setLoading(false);
        return null;
      }
      
      // Fetch projects for the selected workspace
      const asanaProjects = await asanaApi.fetchProjects(selectedWorkspace.gid);
      console.log("Fetched Asana projects:", asanaProjects.length);
      
      if (asanaProjects.length === 0) {
        console.error("No projects found in workspace");
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
      console.log("Transformed projects:", projects.length);
      
      // Fetch tasks for each project
      const allTasks: Task[] = [];
      
      console.log("Fetching tasks for", asanaProjects.length, "projects...");
      
      for (const project of asanaProjects) {
        console.log(`Fetching tasks for project: ${project.name} (${project.gid})`);
        const projectTasks = await asanaApi.fetchTasksForProject(project.gid);
        console.log(`Fetched ${projectTasks.length} tasks for project ${project.name}`);
        
        // Get full task details for each task
        for (const task of projectTasks) {
          try {
            const taskDetail = await asanaApi.fetchTaskDetails(task.gid);
            if (taskDetail) {
              const transformedTask = asanaTransformer.transformTask(taskDetail, project.gid);
              if (transformedTask) {
                allTasks.push(transformedTask);
                console.log("Added task:", taskDetail.name);
              }
            } else {
              console.log(`Skipping task ${task.gid} - no details returned`);
            }
          } catch (error) {
            console.error(`Error fetching details for task ${task.gid}:`, error);
          }
        }
      }
      
      console.log("All tasks fetched:", allTasks.length);
      
      if (allTasks.length === 0) {
        console.warn("No tasks found in any projects");
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
