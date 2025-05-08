
import React from 'react';
import { TaskContext } from './TaskContext';
import { useTaskStorage } from './useTaskStorage';
import { createTaskActions } from './taskActions';
import { useAsanaSync } from './useAsanaSync';
import { toast } from '@/components/ui/use-toast';

// The provider component
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get task storage state and functions
  const {
    tasks,
    setTasks,
    projects,
    setProjects,
    filteredTasks,
    selectedProjectId,
    setSelectedProjectId,
    asanaToken,
    setAsanaToken,
  } = useTaskStorage();

  // Get Asana sync functionality with hardcoded token
  const { loading, syncWithAsana } = useAsanaSync();

  // Function to handle Asana sync and update local data
  const handleAsanaSync = async () => {
    toast({
      title: "Syncing with Asana",
      description: "Please wait while we fetch your data from Asana...",
    });
    
    const data = await syncWithAsana();
    
    if (data) {
      if (data.projects.length === 0) {
        toast({
          title: "No Projects Found",
          description: "No projects were found in your Asana workspace.",
          variant: "destructive",
        });
        return;
      }
      
      if (data.tasks.length === 0) {
        toast({
          title: "No Tasks Found",
          description: "No tasks were found in your Asana projects.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Updating local state with synced data:", data);
      
      // Update tasks and projects with data from Asana
      setTasks(data.tasks);
      setProjects(data.projects);
      
      // Count scheduled tasks
      const scheduledTasks = data.tasks.filter(task => task.scheduledTime).length;
      
      toast({
        title: "Sync Successful",
        description: `Imported ${data.tasks.length} tasks from ${data.projects.length} projects. ${scheduledTasks} tasks scheduled on calendar.`,
      });
    } else {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Asana. Please check the console for details.",
        variant: "destructive",
      });
    }
  };

  // Get task action functions
  const {
    createTask,
    addTask,
    updateTaskTimeEstimate,
    scheduleTask,
    markTaskComplete,
    removeTaskFromCalendar,
    updateTaskName,
  } = createTaskActions(setTasks);

  // Context value
  const value = {
    tasks,
    projects,
    filteredTasks,
    selectedProjectId,
    setSelectedProjectId,
    asanaToken,
    setAsanaToken,
    loading,
    syncWithAsana: handleAsanaSync,
    createTask,
    addTask,
    updateTaskTimeEstimate,
    scheduleTask,
    markTaskComplete,
    removeTaskFromCalendar,
    updateTaskName,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
