import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Grid, Receipt, Bike, ChefHat,
  Package, Salad, Users, LineChart, Wallet, Building2,
  LogOut, X, UtensilsCrossed, Wine
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const NAV_SECTIONS = [
  {
    label: 'Main Menu',
    items: [
      { id: 'dashboard', label: 'Dashboard',       path: '/',                         icon: LayoutDashboard, roles: ['owner','manager','cashier','waiter','driver'] },
      { id: 'orders',    label: 'Active Orders',   path: '/orders',                   icon: Receipt,         roles: ['owner','manager','cashier','waiter'] },
      { id: 'floor',     label: 'Floor Plan',      path: '/tables',                   icon: Grid,            roles: ['owner','manager','cashier','waiter'] },
      { id: 'menu',      label: 'Menu',            path: '/menu',                     icon: Salad,           roles: ['owner','manager'] },
      { id: 'delivery',  label: 'Delivery',        path: '/delivery',                 icon: Bike,            roles: ['owner','manager','cashier','driver'] },
      { id: 'inventory', label: 'Inventory',       path: '/inventory',                icon: Package,         roles: ['owner','manager'] },
      { id: 'reports',   label: 'Reports',         path: '/reports/revenue',          icon: LineChart,       roles: ['owner','manager'] },
      { id: 'beverages', label: 'Beverage Sales',  path: '/reports/beverages',        icon: Wine,            roles: ['owner','manager'] },
    ]
  },
  {
    label: 'Management',
    items: [
      { id: 'staff',     label: 'Staff',           path: '/staff',                    icon: Users,           roles: ['owner','manager'] },
      { id: 'kds',       label: 'Kitchen Display', path: '/kds',                      icon: ChefHat,         roles: ['owner','manager','chef'] },
      { id: 'cash',      label: 'Cash & Expenses', path: '/reports/cash',                icon: Wallet,       roles: ['owner','manager','cashier'] },
    ]
  }
];

const Sidebar = ({ isOpen, onClose, isCollapsed }) => {
  const { user, logout, hasRole } = useAuthStore();

  const filteredSections = NAV_SECTIONS.map(s => ({
    ...s,
    items: s.items.filter(item => hasRole(item.roles))
  })).filter(s => s.items.length > 0);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full z-50 flex flex-col',
          'transition-all duration-300',
          // Desktop: always visible
          'lg:translate-x-0',
          // Width based on collapsed state
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
          // Mobile: slide in/out as drawer (never collapsed on mobile)
          isOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: '#0A0F1E' }}
      >
        {/* Logo bar */}
        <div
          className="flex items-center shrink-0 relative"
          style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: isCollapsed ? '0 10px' : '0 20px', gap: isCollapsed ? 0 : 12 }}
        >
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}
          >
            <UtensilsCrossed size={17} color="white" strokeWidth={2} />
          </div>
          {!isCollapsed && (
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'white', lineHeight: 1 }}>Amiri POS</p>
              <p style={{ fontSize: 10, fontWeight: 500, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                Restaurant System
              </p>
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="absolute right-4 lg:hidden flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ width: 32, height: 32 }}
          >
            <X size={18} color="#94A3B8" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3" style={{ scrollbarWidth: 'none' }}>
          {filteredSections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-6' : ''}>
              {!isCollapsed && (
                <p style={{
                  fontSize: 10, fontWeight: 600, color: '#475569',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '0 12px', marginBottom: 6
                }}>
                  {section.label}
                </p>
              )}

              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) => clsx(
                      'relative flex items-center rounded-[10px] transition-all duration-200 group',
                      isActive
                        ? 'text-white'
                        : 'text-[#94A3B8] hover:text-white',
                      isCollapsed ? 'justify-center' : 'gap-3'
                    )}
                    style={({ isActive }) => ({
                      height: 44,
                      padding: isCollapsed ? 0 : '0 14px',
                      width: isCollapsed ? 44 : 'auto',
                      margin: isCollapsed ? '0 auto' : undefined,
                      background: isActive ? 'rgba(79,70,229,0.15)' : 'transparent',
                      borderLeft: isCollapsed ? 'none' : isActive ? '3px solid #4F46E5' : '3px solid transparent',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 2}
                          color={isActive ? '#818CF8' : '#64748B'}
                          className="shrink-0 transition-colors duration-200 group-hover:!text-white"
                          style={{ color: isActive ? '#818CF8' : '#64748B' }}
                        />
                        {!isCollapsed && (
                          <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom profile */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: isCollapsed ? '12px 6px' : '16px 12px' }}>
          <div className={clsx("flex items-center mb-3", isCollapsed ? "justify-center" : "gap-3 px-2")}>
            <div
              className="flex items-center justify-center rounded-full shrink-0 text-white font-bold"
              style={{
                width: 36, height: 36, fontSize: 13,
                background: 'linear-gradient(135deg,#4F46E5,#06B6D4)'
              }}
            >
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1 }} className="truncate">
                  {user?.full_name}
                </p>
                <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>
                  {user?.role}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className={clsx(
              "flex items-center rounded-[10px] transition-all hover:bg-red-500/10",
              isCollapsed ? "justify-center w-11 mx-auto" : "gap-3 w-full"
            )}
            style={{ height: 40, padding: isCollapsed ? 0 : '0 14px' }}
          >
            <LogOut size={16} color="#94A3B8" />
            {!isCollapsed && <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8' }}>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
