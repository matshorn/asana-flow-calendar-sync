import React, { useEffect, useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ExternalLink, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { testAsanaConnection, AsanaWorkspace } from '@/services/asana/asanaApi';

// Define Asana OAuth configuration with appropriate scope and response type
const ASANA_CLIENT_ID = '1210120911116555'; // Client ID for Asana app
const REDIRECT_URI = window.location.origin; // Current origin as the redirect URI
const ASANA_AUTH_URL = 'https://app.asana.com/-/oauth_authorize';

const AsanaTokenForm: React.FC = () => {
  const { syncWithAsana, loading, asanaToken, setAsanaToken } = useTaskContext();
  const [authenticating, setAuthenticating] = useState<boolean>(false);
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [showWorkspaceSelect, setShowWorkspaceSelect] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Function to initiate OAuth flow
  const handleConnectAsana = () => {
    try {
      setConnectionError(null);
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('asana_oauth_state', state);
      
      // Construct the authorization URL with proper encoding
      const authUrl = new URL(ASANA_AUTH_URL);
      authUrl.searchParams.append('client_id', ASANA_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', encodeURIComponent(REDIRECT_URI));
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      
      console.log("Redirecting to Asana authorization URL:", authUrl.toString());
      
      toast({
        title: "Connecting to Asana",
        description: "You will be redirected to Asana to authorize access.",
      });
      
      // Open Asana authorization in a new window
      const authWindow = window.open(authUrl.toString(), 'asana_auth', 'width=800,height=600');
      
      if (!authWindow) {
        console.error("Popup blocked. Please allow popups for this site.");
        setConnectionError("Popup blocked. Please allow popups for this site.");
        toast({
          title: "Connection Error",
          description: "Popup blocked. Please allow popups for this site.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Error initiating OAuth flow:", error);
      setConnectionError(error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Connection Error",
        description: "Failed to connect to Asana. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to fetch workspaces after authentication
  const fetchWorkspaces = async (token: string) => {
    try {
      // Test connection first
      const isConnected = await testAsanaConnection();
      if (!isConnected) {
        setAuthenticating(false);
        return;
      }
      
      toast({
        title: "Connected to Asana",
        description: "Please select a workspace to sync with.",
      });
      
      const response = await fetch('https://app.asana.com/api/1.0/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workspaces: ${response.status}`);
      }
      
      const data = await response.json();
      setWorkspaces(data.data);
      setShowWorkspaceSelect(true);
      
      // Pre-select the fourth workspace if available (index 3)
      if (data.data.length >= 4) {
        setSelectedWorkspaceId(data.data[3].gid);
      } else if (data.data.length > 0) {
        setSelectedWorkspaceId(data.data[0].gid);
      }
      
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      setConnectionError(error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Error Fetching Workspaces",
        description: "Unable to retrieve your Asana workspaces. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAuthenticating(false);
    }
  };

  // Handle workspace selection
  const handleWorkspaceSelect = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
  };

  // Start sync with selected workspace
  const handleStartSync = () => {
    if (selectedWorkspaceId) {
      // Store the selected workspace ID in localStorage
      localStorage.setItem('asana_selected_workspace', selectedWorkspaceId);
      setShowWorkspaceSelect(false);
      syncWithAsana();
    } else {
      toast({
        title: "No Workspace Selected",
        description: "Please select a workspace to continue.",
        variant: "destructive",
      });
    }
  };

  // Check for OAuth callback on component mount
  useEffect(() => {
    console.log("AsanaTokenForm mounted, checking for OAuth callback");
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const savedState = localStorage.getItem('asana_oauth_state');
    const error = urlParams.get('error');
    
    console.log("URL params:", { code: code?.substring(0, 5) + "...", state, error });
    
    // Clear any previous connection errors
    setConnectionError(null);
    
    // If there's an error in the URL, show it to the user
    if (error) {
      console.error("Asana OAuth error:", error);
      setConnectionError(`OAuth Error: ${error}`);
      toast({
        title: "Asana Connection Failed",
        description: `Error: ${error}. Please try again.`,
        variant: "destructive",
      });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    // If we have a code and the states match, exchange it for a token
    if (code && state && state === savedState) {
      setAuthenticating(true);
      
      // Remove the code and state from the URL to prevent reuse
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('asana_oauth_state');
      
      console.log("Received authorization code from Asana, proceeding with token exchange");
      
      toast({
        title: "Authentication in Progress",
        description: "Connecting to your Asana account...",
      });
      
      // For demo purposes, use the hardcoded token
      // In production, implement proper server-side token exchange
      setTimeout(() => {
        console.log("Using demo token for authentication");
        const demoToken = "2/708730772520/1210120911116555:51c156887a0bebcf8c101daac7f13496";
        setAsanaToken(demoToken);
        
        // Fetch workspaces after token is obtained
        fetchWorkspaces(demoToken);
      }, 1500);
    } else {
      // Check if we already have a token
      if (asanaToken) {
        console.log("Already have an Asana token, checking if it's valid");
        // Test if the token is valid
        testAsanaConnection().then(isValid => {
          if (isValid && !showWorkspaceSelect) {
            // Check if we have a previously selected workspace
            const savedWorkspaceId = localStorage.getItem('asana_selected_workspace');
            if (savedWorkspaceId) {
              console.log("Using previously selected workspace:", savedWorkspaceId);
              setSelectedWorkspaceId(savedWorkspaceId);
            } else {
              // If no workspace is selected, show the workspace selector
              console.log("No workspace selected, fetching workspaces");
              fetchWorkspaces(asanaToken);
            }
          }
        });
      }
    }
  }, [asanaToken, setAsanaToken, showWorkspaceSelect]);

  // Show connection error if there is one
  if (connectionError) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-destructive text-sm">{connectionError}</div>
        <Button 
          variant="default"
          size="sm" 
          onClick={handleConnectAsana}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Show button variant based on connection state
  const isConnected = !!asanaToken;

  if (showWorkspaceSelect) {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedWorkspaceId || ''} onValueChange={handleWorkspaceSelect}>
          <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
            {workspaces.map((workspace, index) => (
              <SelectItem key={workspace.gid} value={workspace.gid} className="text-gray-200 focus:bg-gray-700 focus:text-white">
                {workspace.name} {index === 3 ? '(recommended)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleStartSync}
          disabled={!selectedWorkspaceId}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          Start Sync
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant={isConnected ? "secondary" : "default"}
      size="sm" 
      onClick={isConnected ? syncWithAsana : handleConnectAsana}
      disabled={loading || authenticating}
      className={`bg-gray-700 hover:bg-gray-600 text-gray-200 ${authenticating ? 'opacity-70' : ''}`}
    >
      {authenticating ? (
        <>
          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
          Authenticating...
        </>
      ) : loading ? (
        <>
          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
          Syncing with Asana
        </>
      ) : isConnected ? (
        <>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Sync with Asana
        </>
      ) : (
        <>
          <ExternalLink className="mr-2 h-4 w-4" />
          Connect Asana
        </>
      )}
    </Button>
  );
};

export default AsanaTokenForm;
