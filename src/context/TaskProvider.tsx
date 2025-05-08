
import React from 'react';
import { TaskContext } from './TaskContext';
import { useTaskStorage } from './useTaskStorage';
import { createTaskActions } from './taskActions';
import { useAsanaSync } from '@/services/asana/useAsanaSync';
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

  // Get Asana sync functionality
  const { loading, syncWithAsana } = useAsanaSync();

  // Function to handle Asana sync and update local data
  const handleAsanaSync = async () => {
    toast({
      title: "Syncing with Asana",
      description: "Please wait while we fetch your data from Asana (using the third workspace if available)...",
    });
    
    console.log("Starting Asana sync process...");
    console.log("Current tasks before sync:", tasks.length);
    console.log("Current projects before sync:", projects.length);
    
    try {
      const data = await syncWithAsana();
      
      if (data) {
        console.log("Sync data received:", data);
        console.log("Tasks count:", data.tasks.length);
        console.log("Projects count:", data.projects.length);
        console.log("First few tasks:", data.tasks.slice(0, 3));
        
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
        
        console.log("Updating local state with synced data");
        
        // Update tasks and projects with data from Asana
        setTasks([...data.tasks]);
        setProjects([...data.projects]);
        
        console.log("Updated tasks:", data.tasks.length);
        console.log("Updated projects:", data.projects.length);
        
        // If no project is selected, select the first one
        if (!selectedProjectId && data.projects.length > 0) {
          console.log("Setting selected project to first project:", data.projects[0].id);
          setSelectedProjectId(data.projects[0].id);
        }
        
        // Count scheduled tasks
        const scheduledTasks = data.tasks.filter(task => task.scheduledTime).length;
        
        toast({
          title: "Sync Successful",
          description: `Imported ${data.tasks.length} tasks from ${data.projects.length} projects. ${scheduledTasks} tasks scheduled on calendar.`,
        });
      } else {
        console.error("Sync returned null data");
        toast({
          title: "Sync Failed",
          description: "Failed to sync with Asana. Please check the console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during sync process:", error);
      toast({
        title: "Sync Failed",
        description: "An error occurred during the sync process. Please check the console for details.",
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

  // Log tasks whenever they change
  React.useEffect(() => {
    console.log("Tasks updated in TaskProvider:", tasks.length);
    console.log("Filtered tasks in TaskProvider:", filteredTasks.length);
    console.log("Selected project:", selectedProjectId);
  }, [tasks, filteredTasks, selectedProjectId]);

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
