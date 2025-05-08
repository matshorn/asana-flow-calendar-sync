
import React from 'react';
import { TaskContext } from './TaskContext';
import { useTaskStorage } from './useTaskStorage';
import { createTaskActions } from './taskActions';
import { useAsanaSync } from './useAsanaSync';

// The provider component
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get task storage state and functions
  const {
    tasks,
    setTasks,
    projects,
    filteredTasks,
    selectedProjectId,
    setSelectedProjectId,
    asanaToken,
    setAsanaToken,
  } = useTaskStorage();

  // Get Asana sync functionality
  const { loading, syncWithAsana } = useAsanaSync(asanaToken);

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
    syncWithAsana,
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
