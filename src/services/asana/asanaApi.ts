
import { toast } from '@/components/ui/use-toast';

// Types for Asana API responses
export interface AsanaWorkspace {
  gid: string;
  name: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
  color: string;
}

export interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  due_on: string | null;
  notes: string;
}

// Get token from localStorage or use hardcoded demo token
const getAsanaToken = (): string => {
  const tokenFromStorage = localStorage.getItem('asanaToken');
  return tokenFromStorage || "2/708730772520/1210120911116555:51c156887a0bebcf8c101daac7f13496";
};

/**
 * Helper function to make API requests to Asana
 */
const asanaApiRequest = async (endpoint: string): Promise<any> => {
  try {
    console.log(`Making API request to: ${endpoint}`);
    const token = getAsanaToken();
    
    const response = await fetch(`https://app.asana.com/api/1.0${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        errorDetails = `Status: ${response.status}`;
      }
      
      console.error(`API request failed: ${endpoint}`, errorDetails);
      throw new Error(`Request failed: ${errorDetails}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Fetches workspaces from Asana API
 */
export const fetchWorkspaces = async (): Promise<AsanaWorkspace[]> => {
  console.log("Fetching available workspaces...");
  try {
    const data = await asanaApiRequest('/workspaces');
    console.log("Available workspaces:", data);
    return data.data;
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    toast({
      title: "Connection Error",
      description: "Failed to fetch workspaces. Please check your connection and try again.",
      variant: "destructive",
    });
    throw error;
  }
};

/**
 * Fetches projects for a specific workspace
 */
export const fetchProjects = async (workspaceId: string): Promise<AsanaProject[]> => {
  console.log(`Fetching projects for workspace: ${workspaceId}`);
  try {
    const data = await asanaApiRequest(`/workspaces/${workspaceId}/projects`);
    console.log("Projects data:", data);
    return data.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    toast({
      title: "Error",
      description: "Failed to fetch projects from Asana.",
      variant: "destructive",
    });
    throw error;
  }
};

/**
 * Fetches tasks for a specific project
 */
export const fetchTasksForProject = async (projectId: string): Promise<AsanaTask[]> => {
  console.log("Fetching tasks for project:", projectId);
  try {
    const data = await asanaApiRequest(`/projects/${projectId}/tasks`);
    console.log(`Tasks data for project ${projectId}:`, data);
    return data.data;
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    // Don't throw error here to allow partial data loading
    return [];
  }
};

/**
 * Fetches detailed information for a specific task
 */
export const fetchTaskDetails = async (taskId: string): Promise<AsanaTask | null> => {
  console.log("Fetching details for task:", taskId);
  try {
    const data = await asanaApiRequest(`/tasks/${taskId}`);
    return data.data;
  } catch (error) {
    console.error(`Error fetching details for task ${taskId}:`, error);
    return null;
  }
};

/**
 * Selects a workspace from the available workspaces
 * Uses the workspace stored in localStorage, or falls back to default logic
 */
export const selectWorkspace = (workspaces: AsanaWorkspace[]): AsanaWorkspace | null => {
  if (workspaces.length === 0) {
    toast({
      title: "No Workspaces Found",
      description: "No workspaces were found in your Asana account.",
      variant: "destructive",
    });
    return null;
  }
  
  // Check for stored workspace preference
  const storedWorkspaceId = localStorage.getItem('asana_selected_workspace');
  
  if (storedWorkspaceId) {
    // Find the stored workspace in the available workspaces
    const storedWorkspace = workspaces.find(workspace => workspace.gid === storedWorkspaceId);
    if (storedWorkspace) {
      console.log(`Using previously selected workspace: ${storedWorkspace.name} (${storedWorkspace.gid})`);
      return storedWorkspace;
    }
  }
  
  // Fall back to default logic: use the fourth workspace if available, otherwise the first
  const selectedWorkspaceIndex = workspaces.length >= 4 ? 3 : 0; // Index 3 is the fourth workspace
  const selectedWorkspace = workspaces[selectedWorkspaceIndex];
  console.log(`Using workspace: ${selectedWorkspace.name} (${selectedWorkspace.gid}) - Workspace index: ${selectedWorkspaceIndex}`);
  
  return selectedWorkspace;
};
