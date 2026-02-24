import { get, post } from './api';

export const whatsapp = {
  initialize: () => post('/whatsapp/initialize', {}),
  getStatus: () => get('/whatsapp/status'),
  getQRCode: () => get('/whatsapp/qr'),
  disconnect: () => post('/whatsapp/disconnect', {}),
  reconnect: () => post('/whatsapp/reconnect', {}),
  sendInvoice: (invoiceData: any) => post('/whatsapp/send-invoice', invoiceData),
};
