import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Toast from './components/ui/Toast';
import InteractiveSimulator from './components/routing/InteractiveSimulator';

import Overview from './pages/Overview';
import SocialFeed from './pages/SocialFeed';
import AgentNetwork from './pages/AgentNetwork';
import RoutingExplorer from './pages/RoutingExplorer';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview onOpenSimulator={() => setIsSimulatorOpen(true)} setActiveTab={setActiveTab} />;
      case 'feed':
        return <SocialFeed onOpenSimulator={() => setIsSimulatorOpen(true)} />;
      case 'agents':
        return <AgentNetwork />;
      case 'routing':
        return <RoutingExplorer onOpenSimulator={() => setIsSimulatorOpen(true)} />;
      case 'notifications':
        return <NotificationsPage />;
      case 'simulator':
        return (
          <div className="p-8 max-w-5xl mx-auto">
            <InteractiveSimulator
              isOpen={true}
              onClose={() => setActiveTab('feed')}
              onPostCreated={() => setActiveTab('feed')}
            />
          </div>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Overview onOpenSimulator={() => setIsSimulatorOpen(true)} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
          {/* Main Sidebar */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar
              onOpenSimulator={() => setIsSimulatorOpen(true)}
              onSearchChange={setGlobalSearch}
              searchValue={globalSearch}
              setActiveTab={setActiveTab}
            />

            <main className="flex-1 overflow-y-auto">
              {renderActivePage()}
            </main>
          </div>

          {/* Simulator Modal (when opened from buttons anywhere) */}
          {activeTab !== 'simulator' && (
            <InteractiveSimulator
              isOpen={isSimulatorOpen}
              onClose={() => setIsSimulatorOpen(false)}
              onPostCreated={() => {
                setIsSimulatorOpen(false);
                setActiveTab('feed');
              }}
            />
          )}

          {/* Real-time Toast Alerts */}
          <Toast />
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
}

