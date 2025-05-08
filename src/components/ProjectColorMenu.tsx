
import React, { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Project } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const PRESET_COLORS = [
  '#796eff', // Asana purple
  '#ff8c00', // Orange
  '#25e8c8', // Green
  '#fd7e42', // Coral
  '#2ecc71', // Emerald
  '#3498db', // Blue
  '#9b59b6', // Amethyst
  '#e74c3c', // Red
  '#f1c40f', // Yellow
  '#1abc9c', // Turquoise
];

const ProjectColorMenu: React.FC = () => {
  const { projects, setProjects } = useTaskContext();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [customColor, setCustomColor] = useState<string>('#796eff');

  const updateProjectColor = (project: Project, color: string) => {
    const updatedProjects = projects.map(p => 
      p.id === project.id ? { ...p, color } : p
    );
    setProjects(updatedProjects);
    toast({
      title: "Color updated",
      description: `Updated ${project.name} to ${color}`,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Paintbrush className="h-4 w-4" />
          <span>Project Colors</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium leading-none mb-3">Manage Project Colors</h4>
          
          <div className="grid gap-2">
            <Label htmlFor="project-select">Select Project</Label>
            <select 
              id="project-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const selected = projects.find(p => p.id === e.target.value);
                setSelectedProject(selected || null);
                if (selected?.color) {
                  setCustomColor(selected.color);
                }
              }}
            >
              <option value="" disabled>Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <>
              <div className="grid gap-2">
                <Label>Preset Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => updateProjectColor(selectedProject, color)}
                      aria-label={`Set color to ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="custom-color">Custom Color</Label>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded border border-gray-300" 
                    style={{ backgroundColor: customColor }}
                  />
                  <Input
                    id="custom-color"
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                  />
                  <Button 
                    onClick={() => updateProjectColor(selectedProject, customColor)}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </>
          )}

          {!selectedProject && (
            <p className="text-sm text-muted-foreground">
              Select a project to customize its color.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectColorMenu;
