
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

  // Get Asana sync functionality
  const { loading, syncWithAsana } = useAsanaSync(asanaToken);

  // Function to handle Asana sync and update local data
  const handleAsanaSync = async () => {
    const data = await syncWithAsana();
    
    if (data) {
      // Update tasks and projects with data from Asana
      setTasks(data.tasks);
      setProjects(data.projects);
      toast({
        title: "Sync Successful",
        description: `Imported ${data.tasks.length} tasks from ${data.projects.length} projects.`,
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
