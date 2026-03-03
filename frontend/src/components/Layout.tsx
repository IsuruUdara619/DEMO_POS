import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  mainContentPadding?: number | string;
}

export default function Layout({ children, backgroundColor = '#edf8e9', mainContentPadding = 24 }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Sales', path: '/sales', icon: 'point_of_sale' },
    { label: 'Products', path: '/products', icon: 'inventory_2' },
    { label: 'Inventory', path: '/inventory', icon: 'warehouse' },
    { label: 'Purchase', path: '/purchase', icon: 'shopping_cart' },
    { label: 'Vendors', path: '/vendors', icon: 'local_shipping' },
    { label: 'Expenses', path: '/expenses', icon: 'receipt_long' },
    { label: 'Reports', path: '/reports', icon: 'analytics' },
    { label: 'Loyalty', path: '/loyalty', icon: 'card_membership' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor }}>
      {/* Sidebar */}
      <div style={{
        width: 250,
        backgroundColor: '#134E8E',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, backgroundColor: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E8E', fontWeight: 'bold' }}>POS</div>
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>Heaven Bakers</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {navItems.map(item => {
            const isActive = path === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  color: isActive ? '#134E8E' : 'rgba(255,255,255,0.8)',
                  backgroundColor: isActive ? '#fff' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: isActive ? '4px solid #e6b400' : '4px solid transparent',
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 600 : 400
                }}
              >
                <span style={{ marginRight: 10 }}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: mainContentPadding }}>
          {children}
        </div>
      </div>
    </div>
  );
}
