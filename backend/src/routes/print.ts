import { Router } from 'express';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import JsBarcode from 'jsbarcode';
import fs from 'fs';
import path from 'path';
import { print } from 'pdf-to-printer';

const router = Router();

router.post('/barcode', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send('Server misconfigured');
  if (!token) return res.status(401).send('Unauthorized');
  
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  const { product_name, barcode_value, price, printer_type } = req.body as {
    product_name?: string;
    barcode_value?: string;
    price?: string;
    printer_type?: 'thermal' | 'normal';
  };

  if (!product_name || !barcode_value) {
    return res.status(400).send('Missing product_name or barcode_value');
  }

  const printerType = printer_type || 'thermal'; // Default to thermal for backward compatibility

  const tempDir = path.join(__dirname, '../../temp');
  const pdfPath = path.join(tempDir, `barcode_${Date.now()}.pdf`);

  try {
    console.log('Generating barcode for:', product_name);
    console.log('Barcode value:', barcode_value);

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate barcode image - horizontal, scannable
    const canvas = createCanvas(600, 100);
    JsBarcode(canvas, barcode_value, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 2,
    });
    const barcodeImage = canvas.toDataURL('image/png');

    // Create PDF document - simple portrait
    const doc = new PDFDocument({
      size: [226, 150], // 80mm x ~53mm
      margins: { top: 5, bottom: 5, left: 5, right: 5 }
    });

    // Pipe to file
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Product name on LEFT
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(product_name, 5, 5, { 
         align: 'left',
         width: 110
       });

    // Price on RIGHT - same line
    if (price) {
      const formattedPrice = `Rs. ${Number(price).toFixed(2)}`;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(formattedPrice, 120, 5, { 
           align: 'right',
           width: 101
         });
    }

    // Barcode - horizontal, centered below
    const barcodeBuffer = Buffer.from(barcodeImage.split(',')[1], 'base64');
    doc.image(barcodeBuffer, 13, 25, {
      width: 200,
      height: 70
    });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    console.log('PDF generated at:', pdfPath);

    if (printerType === 'thermal') {
      // Print directly to thermal printer
      console.log('Sending to printer: XP-80C');

      await print(pdfPath, {
        printer: 'XP-80C',
        scale: 'noscale'
      });

      console.log('Print job sent successfully!');

      // Clean up PDF file after a delay
      setTimeout(() => {
        try {
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
            console.log('Temp PDF cleaned up');
          }
        } catch (err) {
          console.error('Error cleaning up PDF:', err);
        }
      }, 5000);

      res.json({
        success: true,
        message: 'Barcode printed successfully to thermal printer',
      });
    } else {
      // Return PDF for normal printer (browser printing)
      console.log('Returning PDF for browser printing');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="barcode_${Date.now()}.pdf"`);
      
      const pdfBuffer = fs.readFileSync(pdfPath);
      res.send(pdfBuffer);

      // Clean up PDF file after a delay
      setTimeout(() => {
        try {
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
            console.log('Temp PDF cleaned up');
          }
        } catch (err) {
          console.error('Error cleaning up PDF:', err);
        }
      }, 5000);
    }
  } catch (error: any) {
    console.error('Print error:', error);
    console.error('Error stack:', error?.stack);
    
    // Clean up PDF file on error
    try {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
    
    res.status(500).send(error?.message || 'Failed to print barcode');
  }
});

router.post('/receipt', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send('Server misconfigured');
  if (!token) return res.status(401).send('Unauthorized');
  
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  const { 
    invoice_no, 
    date, 
    customer_name, 
    items, 
    discount, 
    total_amount, 
    payment_type,
    amount_given,
    change_amount
  } = req.body as {
    invoice_no?: string;
    date?: string;
    customer_name?: string;
    items?: Array<{ product_name: string; qty: number; selling_price: number }>;
    discount?: number;
    total_amount?: number;
    payment_type?: string;
    amount_given?: number;
    change_amount?: number;
  };

  // Optimized printer settings for XP-80C thermal printer
  const settings = {
    marginLeft: 0,
    marginRight: 3,
    marginTop: 10,
    marginBottom: 10,
    contentStartX: 0,
    itemsFontSize: 6,
    subtotalFontSize: 6,
    totalFontSize: 8,
    paymentFontSize: 7,
    itemColumnWidth: 100,
    qtyColumnX: 100,
    qtyColumnWidth: 15,
    priceColumnX: 140,
    priceColumnWidth: 50,
    lineStartX: 0,
    lineEndX: 218.7,
  };

  if (!items || items.length === 0) {
    return res.status(400).send('No items to print');
  }

  const tempDir = path.join(__dirname, '../../temp');
  const pdfPath = path.join(tempDir, `receipt_${Date.now()}.pdf`);

  try {
    console.log('Generating receipt for invoice:', invoice_no);

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create PDF document for 80mm thermal printer
    const doc = new PDFDocument({
      size: [226.77, 841.89], // 80mm width, variable height
      margins: { top: settings.marginTop, bottom: settings.marginBottom, left: settings.marginLeft, right: settings.marginRight }
    });

    // Pipe to file
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const centerWidth = 226.77 - settings.contentStartX - settings.marginRight;
    let yPos = settings.marginTop;

    // Header - Company Name
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .text('Heaven Bakers (PVT) LTD', settings.contentStartX, yPos, { align: 'center', width: centerWidth });
    yPos += 18;

    // Address
    doc.fontSize(9)
       .font('Helvetica')
       .text('No.66 Main Street, Veyangoda', settings.contentStartX, yPos, { align: 'center', width: centerWidth });
    yPos += 12;

    // Phone
    doc.fontSize(9)
       .text('077 655 2084', settings.contentStartX, yPos, { align: 'center', width: centerWidth });
    yPos += 12;

    // Powered by
    doc.fontSize(8)
       .text('Powered by:', settings.contentStartX, yPos, { align: 'center', width: centerWidth });
    yPos += 10;
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Bloomtech', settings.contentStartX, yPos, { align: 'center', width: centerWidth });
    yPos += 15;

    // Separator line
    doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
    yPos += 10;

    // Invoice details
    doc.fontSize(9)
       .font('Helvetica')
       .text(`Invoice: ${invoice_no || '-'}`, settings.contentStartX, yPos, { align: 'left' });
    yPos += 12;

    if (date) {
      const formattedDate = new Date(date).toLocaleDateString('en-GB');
      doc.text(`Date: ${formattedDate}`, settings.contentStartX, yPos, { align: 'left' });
      yPos += 12;
    }

    if (customer_name) {
      doc.text(`Customer: ${customer_name}`, settings.contentStartX, yPos, { align: 'left' });
      yPos += 12;
    }

    // Separator line
    doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
    yPos += 10;

    // Items header
    doc.fontSize(settings.itemsFontSize)
       .font('Helvetica-Bold')
       .text('Item', settings.contentStartX, yPos, { align: 'left', width: settings.itemColumnWidth, continued: false })
       .text('Qty', settings.qtyColumnX, yPos, { align: 'center', width: settings.qtyColumnWidth, continued: false })
       .text('Price', settings.priceColumnX, yPos, { align: 'right', width: settings.priceColumnWidth, continued: false });
    yPos += 12;

    // Separator line
    doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
    yPos += 8;

    // Items
    doc.font('Helvetica');
    let subtotal = 0;
    for (const item of items) {
      const itemTotal = item.qty * item.selling_price;
      subtotal += itemTotal;
      
      // Product name (may wrap)
      const nameLines = doc.heightOfString(item.product_name, { width: settings.itemColumnWidth });
      doc.fontSize(settings.itemsFontSize)
         .text(item.product_name, settings.contentStartX, yPos, { align: 'left', width: settings.itemColumnWidth })
         .text(item.qty.toString(), settings.qtyColumnX, yPos, { align: 'center', width: settings.qtyColumnWidth })
         .text(`Rs. ${itemTotal.toFixed(2)}`, settings.priceColumnX, yPos, { align: 'right', width: settings.priceColumnWidth });
      yPos += Math.max(12, nameLines);
    }

    yPos += 5;

    // Separator line
    doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
    yPos += 10;

    // Subtotal
    if (discount && discount > 0) {
      doc.fontSize(settings.subtotalFontSize)
         .text('Subtotal:', settings.contentStartX, yPos, { align: 'left' })
         .text(`Rs. ${subtotal.toFixed(2)}`, settings.priceColumnX, yPos, { align: 'right', width: settings.priceColumnWidth });
      yPos += 10;

      // Discount
      const discountAmount = subtotal * (discount / 100);
      doc.text(`Discount (${discount}%):`, settings.contentStartX, yPos, { align: 'left' })
         .text(`Rs. ${discountAmount.toFixed(2)}`, settings.priceColumnX, yPos, { align: 'right', width: settings.priceColumnWidth });
      yPos += 10;

      // Separator line
      doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
      yPos += 8;
    }

    // Total
    doc.fontSize(settings.totalFontSize)
       .font('Helvetica-Bold')
       .text('TOTAL:', settings.contentStartX, yPos, { align: 'left' })
       .text(`Rs. ${Number(total_amount || 0).toFixed(2)}`, settings.priceColumnX, yPos, { align: 'right', width: settings.priceColumnWidth });
    yPos += 12;

    // Separator line
    doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
    yPos += 10;

    // Payment details
    doc.fontSize(settings.paymentFontSize)
       .font('Helvetica')
       .text(`Payment: ${payment_type || 'Cash Payment'}`, settings.contentStartX, yPos, { align: 'left' });
    yPos += 10;

    if (payment_type === 'Cash Payment' && amount_given) {
      doc.text('Amount Given:', settings.contentStartX, yPos, { align: 'left' })
         .text(`Rs. ${amount_given.toFixed(2)}`, settings.priceColumnX, yPos, { align: 'right', width: settings.priceColumnWidth });
      yPos += 10;

      if (change_amount !== undefined) {
        doc.text('Change:', settings.contentStartX, yPos, { align: 'left' })
           .text(`Rs. ${change_amount.toFixed(2)}`, settings.priceColumnX, yPos, { align: 'right', width: settings.priceColumnWidth });
        yPos += 10;
      }
    }

    yPos += 5;

    // Separator line
    doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
    yPos += 15;

    // Thank you message
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Thank you for your visit!', settings.contentStartX, yPos, { align: 'center', width: centerWidth });
    yPos += 15;

    // Final separator line
    doc.moveTo(settings.lineStartX, yPos).lineTo(settings.lineEndX, yPos).stroke();
    yPos += 10;

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    console.log('Receipt PDF generated at:', pdfPath);
    console.log('Sending to printer: XP-80C');

    // Print the PDF to the specified printer
    await print(pdfPath, {
      printer: 'XP-80C',
      scale: 'noscale'
    });

    console.log('Receipt printed successfully!');

    // Clean up PDF file after a delay
    setTimeout(() => {
      try {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
          console.log('Temp receipt PDF cleaned up');
        }
      } catch (err) {
        console.error('Error cleaning up receipt PDF:', err);
      }
    }, 5000);

    res.json({
      success: true,
      message: 'Receipt printed successfully',
    });
  } catch (error: any) {
    console.error('Receipt print error:', error);
    console.error('Error stack:', error?.stack);
    
    // Clean up PDF file on error
    try {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
    
    res.status(500).send(error?.message || 'Failed to print receipt');
  }
});

export default router;
