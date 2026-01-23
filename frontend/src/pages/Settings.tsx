import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { get, post, put, del } from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const roseGold = '#001f3f';
  const gold = '#001f3f';
  const goldHover = '#003366';
  const white = '#ffffff';
  const theme = 'dark';

  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'cashier' });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/sales', { replace: true });
      return;
    }
    loadUsers();
    loadWhatsAppStatus();
    
    // Auto-refresh WhatsApp status every 10 seconds
    const interval = setInterval(loadWhatsAppStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadUsers() {
    try {
      const r = await get('/users');
      setUsers(r.users || []);
    } catch (e: any) {
      alert(e?.message || 'Failed to load users');
    }
  }

  async function handleCreateUser() {
    if (!newUser.username || !newUser.password) {
      alert('Username and password are required');
      return;
    }
    try {
      await post('/users', newUser);
      setShowModal(false);
      setNewUser({ username: '', password: '', role: 'cashier' });
      loadUsers();
    } catch (e: any) {
      alert(e?.message || 'Failed to create user');
    }
  }

  async function handleUpdateRole(userId: number, newRole: string) {
    try {
      await put(`/users/${userId}`, { role: newRole });
      loadUsers();
    } catch (e: any) {
      alert(e?.message || 'Failed to update role');
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await del(`/users/${userId}`);
      loadUsers();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete user');
    }
  }

  async function loadWhatsAppStatus() {
    try {
      const r = await get('/whatsapp/status');
      setWhatsappStatus(r);
    } catch (e: any) {
      // Silently fail, status will be null
      console.error('Failed to load WhatsApp status:', e);
    }
  }

  async function handleConnectWhatsApp() {
    setShowQRModal(true);
    setQrLoading(true);
    setQrCode(null);
    await loadQRCode();
  }

  async function loadQRCode() {
    setQrLoading(true);
    setQrCode(null);

    let attempts = 0;
    const maxAttempts = 30; // 60 seconds total

    const checkQR = async () => {
      try {
        console.log('Fetching QR code...');
        const r = await get('/whatsapp/qr');
        console.log('QR fetch response:', r.qrCode ? 'QR Received' : 'No QR');
        
        if (r.qrCode) {
          setQrCode(r.qrCode);
          setQrLoading(false);
          
          // Poll for connection status and QR updates
          const pollInterval = setInterval(async () => {
            try {
              const status = await get('/whatsapp/status');
              if (status.isConnected) {
                clearInterval(pollInterval);
                setShowQRModal(false);
                setQrCode(null);
                setWhatsappStatus(status);
                alert('✅ WhatsApp connected successfully!');
              } else {
                // Check for updated QR code
                const r = await get('/whatsapp/qr');
                if (r.qrCode) {
                  setQrCode(r.qrCode);
                }
              }
            } catch (e) {
              console.error('Error polling status:', e);
            }
          }, 2000);

          // Clear interval after 2 minutes
          setTimeout(() => clearInterval(pollInterval), 120000);
          return;
        }
        
        // If not ready, retry
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkQR, 2000);
        } else {
          setQrLoading(false);
        }
      } catch (e: any) {
        // Check if already connected (400 Bad Request)
        if (e.status === 400 || (e.response && e.response.status === 400)) {
          setShowQRModal(false);
          setQrCode(null);
          loadWhatsAppStatus();
          alert('✅ WhatsApp is already connected!');
          return;
        }

        console.error('Error loading QR code:', e);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkQR, 2000);
        } else {
          setQrLoading(false);
        }
      }
    };

    checkQR();
  }

  async function handleRefreshQR() {
    try {
      // First reconnect to get a fresh QR code
      await post('/whatsapp/reconnect', {});
      // Wait a moment for the backend to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Then load the new QR code
      await loadQRCode();
    } catch (e: any) {
      alert(e?.message || 'Failed to refresh QR code');
    }
  }

  async function handleDisconnectWhatsApp() {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) return;
    
    try {
      await post('/whatsapp/disconnect', {});
      setWhatsappStatus(null);
      alert('WhatsApp disconnected successfully');
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect');
    }
  }

  async function handleTestConnection() {
    try {
      const status = await get('/whatsapp/status');
      if (status.isConnected) {
        alert('✅ WhatsApp is connected and working properly!');
      } else {
        alert('❌ WhatsApp is not connected. Please connect first.');
      }
    } catch (e: any) {
      alert('❌ Failed to test connection: ' + (e?.message || 'Unknown error'));
    }
  }

  return (
    <Layout backgroundColor="#808080">
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900, margin: 0 }}>User Management</h2>
          <button onClick={() => setShowModal(true)} style={{ background: gold, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.16)'; }} onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; }}>Add User</button>
        </div>

        <div style={{ background: '#808080', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#444' }}>
                <th style={{ padding: 16, textAlign: 'left', color: '#fff', fontWeight: 700 }}>Username</th>
                <th style={{ padding: 16, textAlign: 'left', color: '#fff', fontWeight: 700 }}>Role</th>
                <th style={{ padding: 16, textAlign: 'right', color: '#fff', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} style={{ borderBottom: '1px solid #555' }}>
                  <td style={{ padding: 16, color: '#fff' }}>{user.username}</td>
                  <td style={{ padding: 16 }}>
                    <select value={user.role} onChange={(e) => handleUpdateRole(user.user_id, e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }}>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </td>
                  <td style={{ padding: 16, textAlign: 'right' }}>
                    <button onClick={() => handleDeleteUser(user.user_id)} style={{ background: 'linear-gradient(135deg, #ef5350, #c62828)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* WhatsApp Configuration Section */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900, marginBottom: 24 }}>📱 WhatsApp Invoice Messenger</h2>
          
          <div style={{ background: '#808080', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 32 }}>
            {whatsappStatus?.isConnected ? (
              // Connected State
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)' }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Connected</div>
                    <div style={{ fontSize: 14, color: '#ccc' }}>
                      {whatsappStatus.lastConnectedAt ? 
                        `Last synced: ${new Date(whatsappStatus.lastConnectedAt).toLocaleString()}` : 
                        'Active'}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#444', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: '#fff', marginBottom: 12 }}>
                    ℹ️ <strong>How it works:</strong>
                  </div>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
                    When printing receipts at checkout, you can automatically send invoice details to your loyalty customers via WhatsApp. 
                    The system will check if the customer's phone number matches a registered loyalty customer and ask if you want to send the invoice.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={handleTestConnection}
                    style={{ 
                      flex: 1,
                      background: '#4caf50', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: 8, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    🔍 Test Connection
                  </button>
                  <button 
                    onClick={handleDisconnectWhatsApp}
                    style={{ 
                      flex: 1,
                      background: '#ef5350', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: 8, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 83, 80, 0.3)'
                    }}
                  >
                    🔌 Disconnect
                  </button>
                </div>
              </div>
            ) : (
              // Disconnected State
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#666', boxShadow: '0 0 10px rgba(128, 128, 128, 0.3)' }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Not Connected</div>
                    <div style={{ fontSize: 14, color: '#fff' }}>Connect WhatsApp to send invoices automatically</div>
                  </div>
                </div>

                <div style={{ background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: theme === 'dark' ? '#ccc' : '#555', marginBottom: 12 }}>
                    ✨ <strong>Benefits:</strong>
                  </div>
                  <ul style={{ fontSize: 13, color: theme === 'dark' ? '#bbb' : '#666', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Send invoices to loyalty customers via WhatsApp</li>
                    <li>Completely free - no monthly fees</li>
                    <li>Easy one-time setup (just scan a QR code)</li>
                    <li>Works with your existing WhatsApp account</li>
                  </ul>
                </div>

                <button 
                  onClick={handleConnectWhatsApp}
                  style={{ 
                    width: '100%',
                    background: gold, 
                    color: '#fff', 
                    border: 'none', 
                    padding: '16px 24px', 
                    borderRadius: 12, 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    fontSize: 16,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                    transition: 'transform 150ms ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  🔗 Connect WhatsApp Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: theme === 'dark' ? '#263238' : '#fff', borderRadius: 16, padding: 40, maxWidth: 500, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: theme === 'dark' ? '#f8bbd0' : roseGold, fontSize: 24, fontWeight: 700 }}>Connect WhatsApp</h3>
              <button 
                onClick={() => { setShowQRModal(false); setQrCode(null); }}
                style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: theme === 'dark' ? '#fff' : '#333' }}
              >
                ✕
              </button>
            </div>

            {qrLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                <div style={{ fontSize: 16, color: theme === 'dark' ? '#bbb' : '#666' }}>Generating QR code...</div>
                <div style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#999', marginTop: 8 }}>This may take a few moments</div>
              </div>
            ) : qrCode ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 280, height: 280, border: `4px solid ${roseGold}`, borderRadius: 12 }} />
                </div>

                <div style={{ background: theme === 'dark' ? '#1a1a1a' : '#f9f9f9', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme === 'dark' ? '#fff' : '#333', marginBottom: 12 }}>
                    📱 How to scan:
                  </div>
                  <ol style={{ fontSize: 13, color: theme === 'dark' ? '#bbb' : '#666', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Open <strong>WhatsApp</strong> on your phone</li>
                    <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong></li>
                    <li>Tap <strong>Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li>Point your camera at this QR code</li>
                  </ol>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#999', marginBottom: 12, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    <span style={{ animation: 'blink 1s step-end infinite' }}>■</span> WAITING FOR SCAN...
                  </div>
                  <div style={{ fontSize: 12, color: '#ccc', fontFamily: 'monospace' }}>
                    QR code expires in 30s
                  </div>
                </div>

                <button 
                  onClick={handleRefreshQR}
                  style={{ 
                    width: '100%',
                    background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '12px 24px', 
                    borderRadius: 8, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                  }}
                >
                  🔄 Refresh QR Code
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                <div style={{ fontSize: 16, color: '#ccc', marginBottom: 8 }}>Failed to generate QR code</div>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>
                  This usually happens if:<br/>
                  • The server is still starting up<br/>
                  • Chrome/Chromium is not installed<br/>
                  • There's a session conflict
                </div>
                <button 
                  onClick={handleRefreshQR}
                  style={{ marginTop: 16, background: gold, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; }}
                >
                  🔄 Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#808080', borderRadius: 12, padding: 32, minWidth: 400, boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 24px', color: '#fff', fontSize: 24, fontWeight: 700 }}>Add New User</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600 }}>Username</label>
              <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600 }}>Password</label>
              <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600 }}>Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setNewUser({ username: '', password: '', role: 'cashier' }); }} style={{ background: '#ddd', color: '#333', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateUser} style={{ background: gold, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
