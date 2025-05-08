
import React from 'react';
import { TaskProvider } from '@/context/TaskContext';
import TaskList from '@/components/TaskList';
import Calendar from '@/components/Calendar';
import ProjectColorMenu from '@/components/ProjectColorMenu';
import AsanaTokenForm from '@/components/AsanaTokenForm';
import { Separator } from '@/components/ui/separator';

const Index: React.FC = () => {
  return (
    <TaskProvider>
      <div className="min-h-screen flex flex-col bg-gray-900">
        <header className="border-b border-gray-700 p-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-asana-purple text-gray-200">Asana Flow Calendar</h1>
            <div className="flex items-center gap-2">
              <AsanaTokenForm />
              <ProjectColorMenu />
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Task List Panel */}
          <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-700 overflow-hidden flex flex-col bg-gray-900">
            <TaskList />
          </div>
          
          {/* Calendar Panel */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col bg-gray-900">
            <Calendar />
          </div>
        </main>
      </div>
    </TaskProvider>
  );
};

export default Index;
