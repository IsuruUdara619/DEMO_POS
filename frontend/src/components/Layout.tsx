import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children, backgroundColor = '#333', mainContentPadding = '24px' }: { children: React.ReactNode, backgroundColor?: string, mainContentPadding?: string|number }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: backgroundColor, overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{ 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '16px',
          background: 'rgba(0,0,0,0.2)', // Subtle background for separation
          backdropFilter: 'blur(5px)'
        }}>
           {/* Left Side: Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <img src="/wh_logo.png" alt="WH" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 4 }} />
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <h2 style={{ margin: 0, color: '#fff', fontSize: 22, lineHeight: 1.2, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Weerasingha Hardware</h2>
                 <div style={{ color: '#ddd', fontSize: 13, fontWeight: 500, letterSpacing: '0.5px' }}>Quality Hardware Solutions</div>
              </div>
           </div>

           {/* Right Side: Controls */}
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: '#ff5252',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
           </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: mainContentPadding, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
