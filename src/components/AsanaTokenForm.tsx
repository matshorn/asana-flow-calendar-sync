
import React, { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Key } from 'lucide-react';

const AsanaTokenForm: React.FC = () => {
  const { asanaToken, setAsanaToken, syncWithAsana } = useTaskContext();
  const [tempToken, setTempToken] = useState(asanaToken);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAsanaToken(tempToken);
    setIsDialogOpen(false);
    syncWithAsana();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="mr-2 h-4 w-4" />
          {asanaToken ? "Update Asana Token" : "Set Asana Token"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asana Personal Access Token</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="token">Token</Label>
              <Input 
                id="token"
                type="password"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                placeholder="Enter your Asana token"
              />
              <p className="text-xs text-gray-500">
                You can create a Personal Access Token in Asana by going to 
                My Profile Settings -&gt; Apps -&gt; Manage Developer Apps -&gt; Create New Personal Access Token.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Token</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AsanaTokenForm;
