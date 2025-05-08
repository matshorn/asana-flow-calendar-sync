
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

// Hardcoded Asana token - this is a publishable key used for API access
const ASANA_TOKEN = "2/708730772520/1210120911116555:51c156887a0bebcf8c101daac7f13496";

/**
 * Fetches workspaces from Asana API
 */
export const fetchWorkspaces = async (): Promise<AsanaWorkspace[]> => {
  console.log("Fetching available workspaces...");
  try {
    const response = await fetch('https://app.asana.com/api/1.0/workspaces', {
      headers: {
        'Authorization': `Bearer ${ASANA_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Workspaces fetch error:", errorData);
      throw new Error(`Failed to fetch workspaces: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Available workspaces:", data);
    return data.data;
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    throw error;
  }
};

/**
 * Fetches projects for a specific workspace
 */
export const fetchProjects = async (workspaceId: string): Promise<AsanaProject[]> => {
  console.log(`Fetching projects for workspace: ${workspaceId}`);
  try {
    const response = await fetch(`https://app.asana.com/api/1.0/workspaces/${workspaceId}/projects`, {
      headers: {
        'Authorization': `Bearer ${ASANA_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Projects fetch error:", errorData);
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Projects data:", data);
    return data.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

/**
 * Fetches tasks for a specific project
 */
export const fetchTasksForProject = async (projectId: string): Promise<AsanaTask[]> => {
  console.log("Fetching tasks for project:", projectId);
  try {
    const response = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${ASANA_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch tasks for project ${projectId}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`Tasks data for project ${projectId}:`, data);
    return data.data;
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    return [];
  }
};

/**
 * Fetches detailed information for a specific task
 */
export const fetchTaskDetails = async (taskId: string): Promise<AsanaTask | null> => {
  console.log("Fetching details for task:", taskId);
  try {
    const response = await fetch(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${ASANA_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching details for task ${taskId}: Status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching details for task ${taskId}:`, error);
    return null;
  }
};

/**
 * Selects a workspace from the available workspaces
 * Returns the fourth workspace if available, otherwise the first
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
  
  // Use the fourth workspace if available, otherwise use the first
  const selectedWorkspaceIndex = workspaces.length >= 4 ? 3 : 0; // Index 3 is the fourth workspace
  const selectedWorkspace = workspaces[selectedWorkspaceIndex];
  console.log(`Using workspace: ${selectedWorkspace.name} (${selectedWorkspace.gid}) - Workspace index: ${selectedWorkspaceIndex}`);
  
  return selectedWorkspace;
};
