
import { Task, Project } from '@/types';
import { AsanaProject, AsanaTask } from './asanaApi';

/**
 * Transforms Asana projects to our app's project format
 */
export const transformProjects = (asanaProjects: AsanaProject[]): Project[] => {
  console.log("Transforming projects:", asanaProjects.length);
  return asanaProjects.map(project => ({
    id: project.gid,
    name: project.name,
    color: project.color || "#796eff" // Use default color if not provided
  }));
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
  if (tasks.length === 0) {
    console.log("No tasks to schedule for today");
    return [];
  }
  
  console.log(`Scheduling ${Math.min(5, tasks.length)} tasks for today out of ${tasks.length} total tasks`);
  
  const today = new Date();
  const tasksToSchedule = Math.min(5, tasks.length);
  
  const updatedTasks = [...tasks];
  
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
