import { get, post } from './api';

export const whatsapp = {
  getStatus: async () => {
    try {
      // Return mock status if backend endpoint doesn't exist
      // or try to call backend
      return await get('/whatsapp/status');
    } catch (error) {
      console.warn('WhatsApp status check failed, assuming disconnected', error);
      return { isConnected: false };
    }
  },
  
  sendInvoice: async (data: any) => {
    return await post('/whatsapp/send-invoice', data);
  }
};
