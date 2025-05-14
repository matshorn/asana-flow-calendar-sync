
import React from 'react';
import { TaskProvider } from '@/context/TaskContext';
import TaskList from '@/components/TaskList';
import Calendar from '@/components/Calendar';
import ProjectColorMenu from '@/components/ProjectColorMenu';
import AsanaTokenForm from '@/components/AsanaTokenForm';
import { format } from 'date-fns';

const Index: React.FC = () => {
  const today = new Date();
  
  return (
    <TaskProvider>
      <div className="min-h-screen flex flex-col bg-grey-950 bg-subtle-grid font-serif">
        <header className="border-b border-grey-800 p-4 bg-grey-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-normal heading-xl text-grey-100">
                Asana Flow Calendar
              </h1>
              <p className="text-grey-400 text-sm">
                {format(today, 'EEEE, MMMM d')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AsanaTokenForm />
              <ProjectColorMenu />
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Task List Panel */}
          <div className="w-full md:w-1/3 lg:w-1/4 border-r border-grey-800 overflow-hidden flex flex-col bg-grey-950">
            <TaskList />
          </div>
          
          {/* Calendar Panel */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col bg-grey-950">
            <Calendar />
          </div>
        </main>
      </div>
    </TaskProvider>
  );
};

export default Index;
