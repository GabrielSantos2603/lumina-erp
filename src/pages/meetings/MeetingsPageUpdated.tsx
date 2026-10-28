import React, { useState } from 'react';
import { ProjectSelector, type Project } from '@/components/meetings/ProjectSelector';
import { SmartMeetingHub } from '@/components/meetings/SmartMeetingHub';

export function MeetingsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  const handleCreateMeeting = () => {
    // Será implementado no SmartMeetingHub
    console.log('Criar nova reunião');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {selectedProject ? (
        <SmartMeetingHub 
          project={selectedProject}
          onCreateMeeting={handleCreateMeeting}
          onBack={handleBackToProjects}
        />
      ) : (
        <ProjectSelector onSelectProject={handleSelectProject} />
      )}
    </div>
  );
}