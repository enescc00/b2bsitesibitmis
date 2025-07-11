const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Teklif PDF oluşturur ve uploads/quotes klasörüne kaydeder.
 * @param {object} quote - Mongoose Quote dokümanı (items.product populated)
 * @returns {string} pdfPath - Kaydedilen dosyanın relative yolu
 */
async function generateQuotePdf(quote) {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadsDir = path.join(__dirname, '../uploads/quotes');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
            const quoteIdentifier = quote.quoteNumber ? String(quote.quoteNumber).padStart(4, '0') : quote._id;
      const fileName = `teklif_${quoteIdentifier}.pdf`;
      const pdfPath = path.join(uploadsDir, fileName);

      // Yerel font dosyaları
      const regularFontPath = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf');
      const boldFontPath = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf');
      // Logo dosyasının projedeki yerel yolu
      const logoPath = path.join(__dirname, '../assets/logo.png');

      let regularFont;
      let boldFont;
      const hasRoboto = fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath);

      if (hasRoboto) {
        regularFont = fs.readFileSync(regularFontPath);
        boldFont = fs.readFileSync(boldFontPath);
      }
      
      // Logo yerel dosyadan okunur
      const logoImage = fs.readFileSync(logoPath);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      if (hasRoboto) {
        doc.registerFont('Roboto', regularFont);
        doc.registerFont('Roboto-Bold', boldFont);
      } else {
        // Eğer Roboto yoksa varsayılan Helvetica kullan
        console.warn('Roboto fontları bulunamadı, varsayılan font kullanılacak.');
      }

      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // Logo
      doc.image(logoImage, 50, 45, { width: 150 });

      // Şirket Bilgileri
      doc.font(hasRoboto ? 'Roboto-Bold' : 'Helvetica-Bold').fontSize(10).text('CURKUŞLAR İNŞAAT MALZEMELERİ SANAYİ TİCARET PAZARLAMA LTD. ŞTİ.', 250, 65, { align: 'right' });
      doc.font(hasRoboto ? 'Roboto' : 'Helvetica').fontSize(10).text('Yaylacık Mah. Şefkat Sok. No:9', 250, doc.y, { align: 'right' });
      doc.text('Başiskele / Kocaeli', 250, doc.y, { align: 'right' });
      doc.text('Tel: 0543 281 04 93', 250, doc.y, { align: 'right' });

      doc.moveDown(4);

      // Müşteri ve Teklif Bilgileri - 2 Sütunlu Tasarım
      const infoTop = doc.y;
      const leftCol = 50;
      const rightCol = 350;

      // Sol Sütun: Müşteri Bilgileri
      doc.font(hasRoboto ? 'Roboto-Bold' : 'Helvetica-Bold').text('Müşteri Bilgileri', leftCol, infoTop, { underline: true });
      const customerName = quote.customer?.name || 'N/A';
      doc.font(hasRoboto ? 'Roboto' : 'Helvetica').text(customerName, leftCol, infoTop + 15, { width: 250 });
      const leftHeight = doc.heightOfString(customerName, { width: 250 }) + 15;

      // Sağ Sütun: Teklif Bilgileri
      doc.font(hasRoboto ? 'Roboto-Bold' : 'Helvetica-Bold').text('Teklif Bilgileri', rightCol, infoTop, { underline: true });
            const quoteIdText = `Belge No: #${quote.quoteNumber ? String(quote.quoteNumber).padStart(4, '0') : quote._id}`;
      const dateText = `Tarih: ${new Date(quote.createdAt).toLocaleDateString('tr-TR')}`;
      doc.font(hasRoboto ? 'Roboto' : 'Helvetica').text(quoteIdText, rightCol, infoTop + 15);
      doc.text(dateText, rightCol, infoTop + 30);
      const rightHeight = 45; // 2 satır + başlık için yaklaşık yükseklik

      // İki sütundan uzun olanın altına inerek devam et
      doc.y = infoTop + Math.max(leftHeight, rightHeight);
      doc.moveDown(2);

      // Tablo
      const tableTop = doc.y;
      const itemX = 50;
      const qtyX = 280;
      const priceX = 350;
      const totalX = 450;

      doc.font(hasRoboto ? 'Roboto-Bold' : 'Helvetica-Bold');
      doc.text('Ürün Adı', itemX, tableTop);
      doc.text('Adet', qtyX, tableTop, { width: 50, align: 'right' });
      doc.text('Birim Fiyat', priceX, tableTop, { width: 80, align: 'right' });
      doc.text('Toplam Fiyat', totalX, tableTop, { width: 90, align: 'right' });
      doc.moveDown();
      const tableBottom = doc.y;
      doc.moveTo(itemX, tableBottom).lineTo(doc.page.width - itemX, tableBottom).stroke();
      doc.moveDown();

      doc.font(hasRoboto ? 'Roboto' : 'Helvetica');
      let grandTotal = 0;
      quote.items.forEach((it) => {
        const rowY = doc.y;
        const qty = Number(it.qty) || 0;
        const unitPrice = Number(it.salePrice) || 0;
        const total = unitPrice * qty;
        grandTotal += total;
        
        doc.text(it.product?.name || 'Bilinmeyen Ürün', itemX, rowY, { width: 220 });
        doc.text(String(qty), qtyX, rowY, { width: 50, align: 'right' });
        doc.text(`${unitPrice.toFixed(2)} ₺`, priceX, rowY, { width: 80, align: 'right' });
        doc.text(`${total.toFixed(2)} ₺`, totalX, rowY, { width: 90, align: 'right' });
        doc.moveDown();
      });

      const totalY = doc.y;
      doc.moveTo(priceX - 20, totalY).lineTo(doc.page.width - itemX, totalY).stroke();
      doc.moveDown();
      doc.font(hasRoboto ? 'Roboto-Bold' : 'Helvetica-Bold').text(`Genel Toplam: ${grandTotal.toFixed(2)} ₺`, priceX - 20, doc.y, { align: 'right' });

      doc.end();

      writeStream.on('finish', () => resolve(`/uploads/quotes/${fileName}`));
      writeStream.on('error', reject);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
}

module.exports = { generateQuotePdf };
