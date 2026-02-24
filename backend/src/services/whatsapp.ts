/**
 * WhatsApp Service (Stub for Backend)
 * Note: In Electron mode, WhatsApp runs in the main process (electron/services/whatsapp-native.js)
 * This is a stub that provides a compatible interface for the backend diagnostics endpoint
 */

interface WhatsAppStatus {
  isConnected: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasQRCode: boolean;
  lastConnectedAt: Date | null;
}

class WhatsAppService {
  /**
   * Get WhatsApp connection status
   * In Electron mode, this is just a stub - actual status comes from IPC
   */
  getStatus(): WhatsAppStatus {
    return {
      isConnected: false,
      isInitializing: false,
      isAuthenticated: false,
      isLoading: false,
      hasQRCode: false,
      lastConnectedAt: null
    };
  }

  /**
   * Initialize WhatsApp client
   * In Electron mode, this should be called from the main process
   */
  async initialize(): Promise<void> {
    console.log('[WhatsApp Service] Stub: initialize() called - WhatsApp runs in Electron main process');
  }

  /**
   * Get QR code
   */
  getQRCode(): string | null {
    return null;
  }

  /**
   * Send invoice message
   */
  async sendInvoiceMessage(phoneNumber: string, invoiceData: any): Promise<boolean> {
    throw new Error('WhatsApp sending should be done through Electron IPC');
  }

  /**
   * Restart WhatsApp client
   */
  async restart(): Promise<void> {
    console.log('[WhatsApp Service] Stub: restart() called - WhatsApp runs in Electron main process');
  }

  /**
   * Disconnect WhatsApp client
   */
  async disconnect(): Promise<void> {
    console.log('[WhatsApp Service] Stub: disconnect() called - WhatsApp runs in Electron main process');
  }

  /**
   * Reconnect WhatsApp client
   */
  async reconnect(): Promise<void> {
    console.log('[WhatsApp Service] Stub: reconnect() called - WhatsApp runs in Electron main process');
  }
}

// Export singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;
