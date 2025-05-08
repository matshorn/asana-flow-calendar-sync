
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
  
  const transformedTask = {
    id: taskData.gid,
    name: taskData.name,
    projectId: projectId,
    completed: taskData.completed || false,
    timeEstimate: 30, // Default time estimate
    scheduledTime, // Add the scheduled time if available
  };
  
  console.log("Transformed task:", transformedTask);
  return transformedTask;
};

/**
 * Assigns some tasks to today's calendar for better demo experience
 */
export const assignTasksToToday = (tasks: Task[]): Task[] => {
  // Filter out completed tasks first
  const activeTasks = tasks.filter(task => !task.completed);
  
  if (activeTasks.length === 0) {
    console.log("No active tasks to schedule for today");
    return [];
  }
  
  console.log(`Scheduling ${Math.min(5, activeTasks.length)} tasks for today out of ${activeTasks.length} total active tasks`);
  
  const today = new Date();
  const tasksToSchedule = Math.min(5, activeTasks.length);
  
  const updatedTasks = [...activeTasks];
  
  for (let i = 0; i < tasksToSchedule; i++) {
    if (updatedTasks[i] && !updatedTasks[i].scheduledTime) {
      // Spread tasks throughout the day starting at 9 AM
      const hour = 9 + Math.floor(i / 2);
      const minute = (i % 2) * 30;
      
      updatedTasks[i] = {
        ...updatedTasks[i],
        scheduledTime: {
          day: today,
          startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        }
      };
      
      console.log(`Scheduled task ${updatedTasks[i].name} at ${hour}:${minute}`);
    }
  }
  
  return updatedTasks;
};
