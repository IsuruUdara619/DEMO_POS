import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function Settings() {
  const [printerName, setPrinterName] = useState('Default Printer');
  const [enableSound, setEnableSound] = useState(true);

  return (
    <Layout>
      <div style={{ padding: 20 }}>
        <h1 style={{ color: '#134E8E' }}>Settings</h1>
        
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: 10 }}>General Settings</h2>
          
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', marginBottom: 5, color: '#666' }}>Printer Name</label>
            <input 
              type="text" 
              value={printerName} 
              onChange={(e) => setPrinterName(e.target.value)}
              style={{ padding: 8, width: '100%', maxWidth: 300, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={enableSound} 
              onChange={(e) => setEnableSound(e.target.checked)}
              id="sound"
              style={{ marginRight: 10 }}
            />
            <label htmlFor="sound" style={{ color: '#333' }}>Enable Sound Effects</label>
          </div>

          <div style={{ marginTop: 40 }}>
            <button 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#134E8E', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: 'pointer' 
              }}
              onClick={() => alert('Settings Saved!')}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
