
import { v4 as uuidv4 } from 'uuid';
import { Task } from '@/types';

// Task creation and management functions
export const createTaskActions = (setTasks: React.Dispatch<React.SetStateAction<Task[]>>) => {
  // Function to create a new task
  const createTask = (name: string, projectId: string) => {
    const newTask: Task = {
      id: uuidv4(),
      name,
      projectId,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Function to add a task with optional time estimate
  const addTask = (taskData: { name: string; projectId: string; timeEstimate?: number }) => {
    const newTask: Task = {
      id: uuidv4(),
      name: taskData.name,
      projectId: taskData.projectId,
      timeEstimate: taskData.timeEstimate,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Function to update a task's time estimate
  const updateTaskTimeEstimate = (taskId: string, timeEstimate: number) => {
    setTasks(prevTasks =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, timeEstimate } : task
      )
    );
  };

  // Function to schedule a task
  const scheduleTask = (taskId: string, day: Date, startTime: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              scheduledTime: {
                day: day,
                startTime: startTime,
              },
            }
          : task
      )
    );
  };

  // Function to mark a task as complete/incomplete
  const markTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Function to remove a task from the calendar
  const removeTaskFromCalendar = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, scheduledTime: undefined } : task
      )
    );
  };

  // Function to update task name
  const updateTaskName = (taskId: string, name: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, name } : task
      )
    );
  };

  return {
    createTask,
    addTask,
    updateTaskTimeEstimate,
    scheduleTask,
    markTaskComplete,
    removeTaskFromCalendar,
    updateTaskName,
  };
};
