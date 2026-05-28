import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, User, Settings, LogOut, Building2, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';

const PAGE_TITLES = {
  '/':                            'Dashboard',
  '/floor-plan':                  'Floor Plan',
  '/orders':                      'Active Orders',
  '/delivery':                    'Delivery Dispatch',
  '/kds':                         'Kitchen Display',
  '/inventory':                   'Inventory',
  '/menu':                        'Menu Management',
  '/staff':                       'Staff Directory',
  '/reports/revenue':             'Revenue Audit',
  '/reports/cash-reconciliation': 'Cash Reconciliation',
  '/branches':                    'Branch Management',
};

const Topbar = ({ onToggleSidebar, onToggleAlerts, onToggleCollapse, isCollapsed, hasAlerts, realtimeStatus }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between w-full px-4 md:px-6"
      style={{
        height: 64,
        background: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden flex items-center justify-center rounded-xl transition-colors hover:bg-slate-50"
          style={{ width: 40, height: 40, color: '#374151' }}
        >
          <Menu size={22} />
        </button>

        {/* Desktop sidebar collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center rounded-xl transition-colors hover:bg-slate-50"
          style={{ width: 36, height: 36, color: '#64748B', border: '1px solid rgba(0,0,0,0.06)' }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Desktop page title */}
        <div className="hidden lg:flex items-center gap-3">
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0A0F1E' }}>
            {PAGE_TITLES[location.pathname] || 'Amiri POS'}
          </span>
          <div className={clsx(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all duration-500",
            realtimeStatus === 'connected' ? "bg-emerald-50 border-emerald-100" :
            realtimeStatus === 'error' ? "bg-red-50 border-red-100" :
            "bg-amber-50 border-amber-100"
          )}>
            <div className={clsx(
              "h-1.5 w-1.5 rounded-full",
              realtimeStatus === 'connected' ? "bg-emerald-500 animate-pulse" :
              realtimeStatus === 'error' ? "bg-red-500" :
              "bg-amber-500 animate-pulse"
            )} />
            <span className={clsx(
              "text-[9px] font-black uppercase tracking-widest",
              realtimeStatus === 'connected' ? "text-emerald-600" :
              realtimeStatus === 'error' ? "text-red-600" :
              "text-amber-600"
            )}>
              {realtimeStatus === 'connected' ? 'Live' : realtimeStatus === 'error' ? 'Error' : 'Connecting'}
            </span>
          </div>
        </div>
      </div>

      {/* Center (desktop only) */}
      <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Amiri's Food Restaurant
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Branch pill */}
        <button
          className="hidden sm:flex items-center gap-2 rounded-full transition-colors hover:bg-slate-50"
          style={{
            border: '1px solid rgba(0,0,0,0.10)',
            padding: '6px 14px',
            fontSize: 13, fontWeight: 500, color: '#374151',
          }}
        >
          <Building2 size={14} color="#94A3B8" />
          <span>Main Branch</span>
          <ChevronDown size={13} color="#94A3B8" />
        </button>

        {/* Notifications */}
        <button
          onClick={onToggleAlerts}
          className="relative flex items-center justify-center rounded-xl transition-colors hover:bg-slate-50"
          style={{ width: 40, height: 40 }}
        >
          <Bell size={20} color="#374151" />
          {hasAlerts && (
            <span
              className="absolute"
              style={{
                top: 8, right: 8, width: 8, height: 8,
                borderRadius: '50%', background: '#EF4444',
                border: '2px solid white',
              }}
            />
          )}
        </button>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(v => !v)}
            className="flex items-center justify-center rounded-full transition-all hover:opacity-90 active:scale-95"
            style={{
              width: 34, height: 34, fontSize: 13, fontWeight: 600,
              color: 'white', cursor: 'pointer',
              background: 'linear-gradient(135deg,#4F46E5,#06B6D4)',
            }}
          >
            {initials}
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
              <div
                className="absolute right-0 mt-2 z-20 py-2 rounded-2xl"
                style={{
                  width: 224, background: 'white',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                  animation: 'enter 0.15s ease-out',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0F1E' }}>{user?.full_name}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                    {user?.role}
                  </p>
                </div>
                <div className="p-1.5">
                  {[
                    { label: 'My Profile', icon: User },
                    { label: 'Settings',   icon: Settings },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className="flex items-center gap-3 w-full rounded-xl transition-colors hover:bg-slate-50"
                      style={{ height: 40, padding: '0 12px', fontSize: 13, fontWeight: 500, color: '#374151' }}
                    >
                      <Icon size={15} color="#94A3B8" />
                      {label}
                    </button>
                  ))}
                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 8px' }} />
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full rounded-xl transition-colors hover:bg-red-50"
                    style={{ height: 40, padding: '0 12px', fontSize: 13, fontWeight: 500, color: '#EF4444' }}
                  >
                    <LogOut size={15} />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
