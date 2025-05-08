
import React, { useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import TaskCard from '@/components/TaskCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TaskList: React.FC = () => {
  const { 
    tasks, 
    projects, 
    selectedProjectId, 
    setSelectedProjectId,
    syncWithAsana,
    loading,
    addTask
  } = useTaskContext();
  
  const [newTaskName, setNewTaskName] = React.useState('');
  const [newTaskProject, setNewTaskProject] = React.useState('');
  const [newTaskEstimate, setNewTaskEstimate] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Filter out completed tasks
  const activeTasks = tasks.filter(task => !task.completed);
  
  // Filter tasks by selected project
  const filteredTasks = selectedProjectId 
    ? activeTasks.filter(task => task.projectId === selectedProjectId)
    : activeTasks;

  // Group tasks by project
  const tasksByProject: Record<string, typeof filteredTasks> = {};
  
  filteredTasks.forEach(task => {
    if (!tasksByProject[task.projectId]) {
      tasksByProject[task.projectId] = [];
    }
    tasksByProject[task.projectId].push(task);
  });

  console.log("Tasks grouped by project:", tasksByProject);

  const handleAddTask = () => {
    if (newTaskName && newTaskProject) {
      addTask({
        name: newTaskName,
        projectId: newTaskProject,
        timeEstimate: newTaskEstimate ? parseInt(newTaskEstimate) : undefined
      });
      
      setNewTaskName('');
      setNewTaskProject('');
      setNewTaskEstimate('');
      setDialogOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-name">Task Name</Label>
                    <Input 
                      id="task-name" 
                      value={newTaskName} 
                      onChange={(e) => setNewTaskName(e.target.value)} 
                      placeholder="Enter task name" 
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-project">Project</Label>
                    <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                      <SelectTrigger id="task-project" className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-estimate">Time Estimate (minutes)</Label>
                    <Input 
                      id="task-estimate" 
                      value={newTaskEstimate} 
                      onChange={(e) => setNewTaskEstimate(e.target.value)} 
                      placeholder="e.g., 30" 
                      type="number" 
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddTask} variant="secondary">Add Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => syncWithAsana()}
              disabled={loading}
            >
              <RefreshCcw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <Select 
            value={selectedProjectId || 'all'} 
            onValueChange={(value) => {
              setSelectedProjectId(value === 'all' ? null : value);
            }}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-900">
        {selectedProjectId ? (
          // If a project is selected, show only those tasks
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {projects.find(p => p.id === selectedProjectId)?.name || 'Unknown Project'}
            </h3>
            {filteredTasks.map(task => (
              <TaskCard 
                key={task.id}
                task={task}
                project={projects.find(p => p.id === task.projectId)}
              />
            ))}
            {filteredTasks.length === 0 && (
              <p className="text-sm text-gray-400 italic">No tasks in this project</p>
            )}
          </div>
        ) : (
          // Otherwise show tasks grouped by project
          Object.entries(tasksByProject).map(([projectId, tasks]) => (
            <div key={projectId} className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                {projects.find(p => p.id === projectId)?.name || 'Unknown Project'}
              </h3>
              {tasks.map(task => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  project={projects.find(p => p.id === projectId)}
                />
              ))}
            </div>
          ))
        )}
        {Object.keys(tasksByProject).length === 0 && (
          <p className="text-sm text-gray-400 italic">No tasks found. Try syncing with Asana or adding a task.</p>
        )}
      </div>
    </div>
  );
};

export default TaskList;
