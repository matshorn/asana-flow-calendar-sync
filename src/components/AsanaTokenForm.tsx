
import React from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

const AsanaTokenForm: React.FC = () => {
  const { syncWithAsana, loading } = useTaskContext();

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={() => syncWithAsana()}
      disabled={loading}
      className="bg-gray-700 hover:bg-gray-600 text-gray-200"
    >
      <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Sync with Asana
    </Button>
  );
};

export default AsanaTokenForm;
