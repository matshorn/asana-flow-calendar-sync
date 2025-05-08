
import { Task, Project } from '@/types';
import { AsanaProject, AsanaTask } from './asanaApi';

/**
 * Project color palette
 */
const PROJECT_COLORS = [
  '#796eff', // Asana Purple
  '#25e8c8', // Teal
  '#fd7e42', // Orange
  '#ff5263', // Red
  '#9ee7e3', // Light Teal
  '#ffd500', // Yellow
  '#4186e0', // Blue
  '#a4cf30', // Green
  '#aa62e3', // Violet
  '#ff9a40', // Light Orange
];

/**
 * Transforms Asana projects to our app's project format with consistent colors
 */
export const transformProjects = (asanaProjects: AsanaProject[]): Project[] => {
  console.log("Transforming projects:", asanaProjects.length);
  
  return asanaProjects.map((project, index) => {
    // Use project's own color if provided, otherwise assign from our palette
    const colorIndex = index % PROJECT_COLORS.length;
    const color = project.color || PROJECT_COLORS[colorIndex];
    
    return {
      id: project.gid,
      name: project.name,
      color: color
    };
  });
};

/**
 * Transforms an Asana task to our app's task format
 */
export const transformTask = (taskData: AsanaTask, projectId: string): Task | null => {
  if (!taskData) {
    console.log("Skipping null task");
    return null;
  }
  
  console.log(`Transforming task: ${taskData.name} (${taskData.gid}) for project ${projectId}`);
  
  // Don't set any scheduledTime by default
  const transformedTask = {
    id: taskData.gid,
    name: taskData.name,
    projectId: projectId,
    completed: taskData.completed || false,
    timeEstimate: 30, // Default time estimate
  };
  
  console.log("Transformed task:", transformedTask);
  return transformedTask;
};
