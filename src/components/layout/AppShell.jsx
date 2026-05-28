import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import clsx from 'clsx';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AlertsPanel from './AlertsPanel';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { useAuthStore } from '../../store/auth.store';
import { playAlertSound } from '../../utils/sound';
import toast from 'react-hot-toast';

const AppShell = () => {
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('amiri_sidebar_collapsed') === 'true';
  });
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('amiri_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Handle incoming real-time events
  const handleRealtimeEvent = (payload) => {
    console.log('[Realtime DEBUG] Event received →', payload);
    const event = payload.payload || payload;
    
    const newAlert = {
      id: crypto.randomUUID(),
      type: event.type || payload.event || 'info',
      message: event.message || payload.message || 'System update received',
      created_at: new Date().toISOString()
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    playAlertSound();

    if (['new_order', 'low_stock', 'void_request', 'order_ready'].includes(newAlert.type)) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
          <div className="flex-1 w-0">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              {newAlert.type.replace('_', ' ')}
            </p>
            <p className="text-[13px] text-slate-500">{newAlert.message}</p>
          </div>
        </div>
      ), { duration: 6000 });
    }
  };

  const handleStatusChange = (status) => {
    if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
    else if (status === 'CLOSED') setRealtimeStatus('disconnected');
  };

  // Subscribe to branch-specific channel
  useRealtimeChannel(user?.branch_id ? `branch:${user.branch_id}` : null, handleRealtimeEvent, handleStatusChange);
  
  // Subscribe to owner alerts if applicable
  useRealtimeChannel(user?.role === 'owner' ? 'owner:alerts' : null, handleRealtimeEvent, handleStatusChange);

  return (
    // Page background: slight blue-grey tint, not pure white
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main area — shifted right on desktop to clear the fixed sidebar */}
      <div
        className="flex flex-col flex-1 min-w-0 h-full overflow-hidden transition-all duration-300"
      >
        {/* Margin adjusts based on collapsed state */}
        <div className={clsx(
          "flex flex-col flex-1 min-w-0 h-full overflow-hidden transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
        )}>
          <Topbar
            onToggleSidebar={() => setIsSidebarOpen(v => !v)}
            onToggleAlerts={() => setIsAlertsOpen(v => !v)}
            onToggleCollapse={toggleSidebarCollapse}
            isCollapsed={isSidebarCollapsed}
            hasAlerts={alerts.length > 0}
            realtimeStatus={realtimeStatus}
          />

          <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
            <div className="max-w-[1440px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <AlertsPanel
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onClear={() => setAlerts([])}
      />
    </div>
  );
};

export default AppShell;
