import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

class WhatsAppService {
  private client: Client | null = null;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private lastConnectedAt: Date | null = null;
  private qrGeneratedAt: Date | null = null;
  private initializationFinishedAt: Date | null = null;

  constructor() {
    // Auto-initialize on service creation
    this.initialize();
  }

  async initialize() {
    if (this.isInitializing || this.client) {
      return;
    }

    this.isInitializing = true;

    try {
      console.log('Initializing WhatsApp client...');
      
      const authPath = path.join(__dirname, '../../data/.wwebjs_auth');
      
      // Determine platform-specific configuration
      const isWindows = process.platform === 'win32';
      const puppeteerConfig: any = {
        headless: true,
        args: [
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu'
        ]
      };

      // Only add Linux-specific args if not on Windows
      if (!isWindows) {
        puppeteerConfig.args.push(
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-zygote'
        );
        // Set executablePath for Linux/Docker
        puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
      }
      // On Windows, let Puppeteer use its bundled Chrome (don't set executablePath)

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: authPath
        }),
        puppeteer: puppeteerConfig
      });

      // QR Code event
      this.client.on('qr', async (qr) => {
        console.log('QR Code received');
        try {
          this.qrCode = await QRCode.toDataURL(qr);
          this.qrGeneratedAt = new Date();
          console.log('QR Code generated successfully at', this.qrGeneratedAt);
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      });

      // Ready event
      this.client.on('ready', () => {
        console.log('WhatsApp client is ready!');
        this.isReady = true;
        this.qrCode = null;
        this.lastConnectedAt = new Date();
      });

      // Authenticated event
      this.client.on('authenticated', () => {
        console.log('WhatsApp client authenticated');
        this.qrCode = null;
      });

      // Authentication failure event
      this.client.on('auth_failure', (msg) => {
        console.error('WhatsApp authentication failure:', msg);
        this.isReady = false;
        this.qrCode = null;
      });

      // Disconnected event
      this.client.on('disconnected', (reason) => {
        console.log('WhatsApp client disconnected:', reason);
        this.isReady = false;
        this.qrCode = null;
      });

      await this.client.initialize();
      this.initializationFinishedAt = new Date();
      console.log('WhatsApp client initialization started');
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      this.isInitializing = false;
      this.client = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  getStatus() {
    return {
      isConnected: this.isReady,
      isInitializing: this.isInitializing,
      hasQRCode: !!this.qrCode,
      lastConnectedAt: this.lastConnectedAt,
      qrGeneratedAt: this.qrGeneratedAt,
      initializationFinishedAt: this.initializationFinishedAt
    };
  }

  getQRCode(): string | null {
    console.log('getQRCode called. Has QR:', !!this.qrCode, 'Length:', this.qrCode?.length);
    return this.qrCode;
  }

  async restart() {
    console.log('Restarting WhatsApp client...');
    await this.disconnect();
    await this.initialize();
  }

  async clearSession() {
    const authPath = path.join(__dirname, '../../data/.wwebjs_auth');
    try {
      if (fs.existsSync(authPath)) {
        console.log('Clearing WhatsApp session data...');
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('Session data cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing session data:', error);
      throw error;
    }
  }

  async reconnect() {
    console.log('Attempting to reconnect WhatsApp...');
    try {
      // Disconnect existing client
      await this.disconnect();
      
      // Clear session data to force fresh QR code
      await this.clearSession();
      
      // Wait a bit before reinitializing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinitialize
      await this.initialize();
      
      console.log('Reconnection initiated, waiting for QR code...');
    } catch (error) {
      console.error('Error during reconnection:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
        this.lastConnectedAt = null;
        console.log('WhatsApp client disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting WhatsApp client:', error);
        throw error;
      }
    }
  }

  async sendInvoiceMessage(phoneNumber: string, invoiceData: {
    invoice_no: string;
    date: string;
    customer_name: string;
    items: Array<{ product_name: string; qty: number; selling_price: number }>;
    discount?: number;
    total_amount: number;
    payment_type?: string;
  }): Promise<boolean> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready. Please connect first.');
    }

    try {
      // Format phone number (remove any non-digit characters)
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Add country code if not present (assuming Sri Lanka +94)
      if (!formattedNumber.startsWith('94')) {
        // Remove leading 0 if present
        if (formattedNumber.startsWith('0')) {
          formattedNumber = formattedNumber.substring(1);
        }
        formattedNumber = '94' + formattedNumber;
      }

      // WhatsApp number format: number@c.us
      const chatId = `${formattedNumber}@c.us`;

      // Check if number exists on WhatsApp
      const numberExists = await this.client.isRegisteredUser(chatId);
      if (!numberExists) {
        throw new Error('This phone number is not registered on WhatsApp');
      }

      // Format the invoice message
      const message = this.formatInvoiceMessage(invoiceData);

      // Send the message
      await this.client.sendMessage(chatId, message);
      console.log(`Invoice sent to ${formattedNumber}`);
      
      return true;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error(error?.message || 'Failed to send WhatsApp message');
    }
  }

  private formatInvoiceMessage(data: {
    invoice_no: string;
    date: string;
    customer_name: string;
    items: Array<{ product_name: string; qty: number; selling_price: number }>;
    discount?: number;
    total_amount: number;
    payment_type?: string;
  }): string {
    const formattedDate = new Date(data.date).toLocaleDateString('en-GB');
    
    let message = `🧁 *Heaven Bakers Invoice*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 Invoice: ${data.invoice_no}\n`;
    message += `📅 Date: ${formattedDate}\n`;
    message += `👤 Customer: ${data.customer_name}\n\n`;
    message += `🛍️ *Items:*\n`;

    let subtotal = 0;
    data.items.forEach(item => {
      const itemTotal = item.qty * item.selling_price;
      subtotal += itemTotal;
      message += `• ${item.product_name}\n`;
      message += `  ${item.qty} × Rs. ${item.selling_price.toFixed(2)}\n`;
      message += `  Total: Rs. ${itemTotal.toFixed(2)}\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (data.discount && data.discount > 0) {
      message += `Subtotal: Rs. ${subtotal.toFixed(2)}\n`;
      const discountAmount = subtotal * (data.discount / 100);
      message += `Discount (${data.discount}%): -Rs. ${discountAmount.toFixed(2)}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
    }
    
    message += `💰 *TOTAL: Rs. ${data.total_amount.toFixed(2)}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (data.payment_type) {
      message += `💳 Payment: ${data.payment_type}\n\n`;
    }
    
    message += `Thank you for choosing Heaven Bakers! 🙏\n`;
    message += `See you again soon! ✨`;

    return message;
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

export default whatsappService;
