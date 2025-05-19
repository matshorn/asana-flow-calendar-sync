
import React, { useEffect, useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Define Asana OAuth configuration
const ASANA_CLIENT_ID = '1210120911116555'; // Client ID for Asana app
const REDIRECT_URI = window.location.origin; // Current origin as the redirect URI
const ASANA_AUTH_URL = 'https://app.asana.com/-/oauth_authorize';
const ASANA_TOKEN_URL = 'https://app.asana.com/-/oauth_token';
const ASANA_SCOPE = 'default'; // Default scope gives read-only access to tasks/projects

const AsanaTokenForm: React.FC = () => {
  const { syncWithAsana, loading, asanaToken, setAsanaToken } = useTaskContext();
  const [authenticating, setAuthenticating] = useState<boolean>(false);

  // Function to initiate OAuth flow
  const handleConnectAsana = () => {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('asana_oauth_state', state);
    
    // Construct the authorization URL
    const authUrl = `${ASANA_AUTH_URL}?client_id=${ASANA_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}&scope=${ASANA_SCOPE}`;
    
    // Redirect the user to Asana's authorization page
    window.location.href = authUrl;
  };

  // Check for OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const savedState = localStorage.getItem('asana_oauth_state');
    
    // If we have a code and the states match, exchange it for a token
    if (code && state && state === savedState) {
      setAuthenticating(true);
      
      // Remove the code and state from the URL to prevent reuse
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('asana_oauth_state');
      
      // Exchange the code for an access token
      // Note: In a production app, this exchange should happen server-side
      // This is a simplified example for demonstration purposes
      const tokenData = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ASANA_CLIENT_ID,
        client_secret: '', // In a real app, this would be stored securely server-side
        redirect_uri: REDIRECT_URI,
        code: code
      });
      
      // Note: The token exchange is normally done server-side to protect client_secret
      // For this demo, we'll use the pre-configured token in the asanaApi.ts file
      // In a real app, implement proper server-side token exchange
      
      // Simulate successful token exchange using the existing token
      setTimeout(() => {
        const demoToken = "2/708730772520/1210120911116555:51c156887a0bebcf8c101daac7f13496";
        setAsanaToken(demoToken);
        toast({
          title: "Connected to Asana",
          description: "Successfully authenticated with Asana. Starting data sync...",
        });
        
        // After token is set, trigger the sync process
        syncWithAsana();
        setAuthenticating(false);
      }, 1500);
    }
  }, [syncWithAsana, setAsanaToken]);

  // Show button variant based on connection state
  const isConnected = !!asanaToken;

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
