import { Router } from 'express';
import jwt from 'jsonwebtoken';
import whatsappService from '../services/whatsapp';
import { pool } from '../db';

const router = Router();

function requireAuth(req: any, res: any) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).send('Server misconfigured');
    return false;
  }
  if (!token) {
    res.status(401).send('Unauthorized');
    return false;
  }
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    res.status(401).send('Unauthorized');
    return false;
  }
}

// Get WhatsApp connection status
router.get('/status', async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to get status');
  }
});

// Get QR code for WhatsApp connection
router.get('/qr', async (req, res) => {
  console.log('GET /whatsapp/qr request received');
  if (!requireAuth(req, res)) return;

  try {
    const qrCode = whatsappService.getQRCode();
    console.log('GET /whatsapp/qr result:', qrCode ? 'QR Present' : 'No QR');
    
    if (!qrCode) {
      const status = whatsappService.getStatus();
      
      if (status.isConnected) {
        return res.status(400).json({
          error: 'Already connected',
          message: 'WhatsApp is already connected. No QR code needed.'
        });
      }
      
      if (!status.isInitializing) {
        // If client is not initializing and not connected, but has no QR code,
        // it might be stuck. Trigger a restart.
        
        // Only restart if it's been more than 10 seconds since initialization finished
        const initTime = status.initializationFinishedAt ? new Date(status.initializationFinishedAt).getTime() : 0;
        const timeSinceInit = Date.now() - initTime;
        
        if (timeSinceInit > 10000) {
          console.log('Client stuck (no QR, not connected, not initializing). Restarting...');
          await whatsappService.restart();
        }
      }
      
      return res.status(202).json({
        error: 'QR code not ready',
        message: 'QR code is being generated. Please try again in a moment.',
        isInitializing: status.isInitializing
      });
    }

    res.json({ qrCode });
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to get QR code');
  }
});

// Disconnect WhatsApp
router.post('/disconnect', async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    await whatsappService.disconnect();
    res.json({ success: true, message: 'WhatsApp disconnected successfully' });
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to disconnect');
  }
});

// Reconnect WhatsApp (clears session and forces new QR)
router.post('/reconnect', async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    await whatsappService.reconnect();
    res.json({ success: true, message: 'WhatsApp reconnecting... Please scan the new QR code.' });
  } catch (error: any) {
    res.status(500).send(error?.message || 'Failed to reconnect');
  }
});

// Send invoice to loyalty customer
router.post('/send-invoice', async (req, res) => {
  if (!requireAuth(req, res)) return;

  const {
    contact_no,
    invoice_no,
    date,
    customer_name,
    items,
    discount,
    total_amount,
    payment_type
  } = req.body as {
    contact_no: string;
    invoice_no: string;
    date: string;
    customer_name: string;
    items: Array<{ product_name: string; qty: number; selling_price: number }>;
    discount?: number;
    total_amount: number;
    payment_type?: string;
  };

  if (!contact_no) {
    return res.status(400).send('Missing contact number');
  }

  if (!invoice_no || !date || !customer_name || !items || !total_amount) {
    return res.status(400).send('Missing required invoice data');
  }

  try {
    // Check if contact number belongs to a loyalty customer
    const loyaltyCheck = await pool.query(
      'SELECT loyalty_customer_id, name FROM loyalty_customers WHERE mobile_no = $1',
      [contact_no]
    );

    if (loyaltyCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not a loyalty customer',
        message: 'This customer is not registered in the loyalty program'
      });
    }

    const loyaltyCustomer = loyaltyCheck.rows[0];

    // Send WhatsApp message
    await whatsappService.sendInvoiceMessage(contact_no, {
      invoice_no,
      date,
      customer_name: loyaltyCustomer.name || customer_name,
      items,
      discount,
      total_amount,
      payment_type
    });

    res.json({
      success: true,
      message: `Invoice sent to ${loyaltyCustomer.name} via WhatsApp`
    });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      error: error?.message || 'Failed to send invoice',
      details: error?.message
    });
  }
});

export default router;
