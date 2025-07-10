const nodemailer = require('nodemailer');
const path = require('path');
const nodemailerHbs = require('nodemailer-express-handlebars');

// E-posta göndermek için transport oluştur
// Not: Bu bilgileri gerçek bir mail servis sağlayıcısıyla değiştirin
const createTransporter = () => {
  // Gmail için örnek yapılandırma
  // Not: Gmail için "Daha az güvenli uygulamalara izin ver" ayarını etkinleştirmeniz gerekebilir
  // Canlı ortamda bunun yerine SMTP servisi veya Gmail API kullanmanız daha güvenlidir
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Farklı servisler için: 'hotmail', 'yahoo' vb.
    auth: {
      user: process.env.EMAIL_USER || 'ornek@gmail.com', // E-posta adresi
      pass: process.env.EMAIL_PASSWORD || 'sifre123', // E-posta şifresi veya uygulama şifresi
    },
  });

  // E-posta şablonları için handlebars ayarları
  const handlebarOptions = {
    viewEngine: {
      extName: '.hbs',
      partialsDir: path.resolve('./views/emails/'),
      layoutsDir: path.resolve('./views/emails/'),
      defaultLayout: false,
    },
    viewPath: path.resolve('./views/emails/'),
    extName: '.hbs',
  };

  // Handlebars şablon motorunu transporter'a ekle
  transporter.use('compile', nodemailerHbs(handlebarOptions));

  return transporter;
};

// Test amaçlı e-posta gönderimi
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"B2B Sistemi" <ornek@gmail.com>',
      to: process.env.TEST_EMAIL || 'test@ornek.com',
      subject: 'E-posta Sistemi Test',
      template: 'test',
      context: {
        name: 'Test Kullanıcı',
        message: 'Bu bir test e-postasıdır.',
      },
    });

    console.log('Test e-postası gönderildi: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('E-posta gönderimi başarısız:', error);
    return false;
  }
};

// Belirli bir e-posta adresine test e-postası gönder
const sendTestEmail = async (email) => {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"B2B Sistemi" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'B2B Sistemi E-posta Testi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #1a73e8;">B2B Sistemi</h1>
          </div>
          <div style="padding: 20px;">
            <p>Merhaba,</p>
            <p>Bu bir <strong>test e-postasıdır</strong>. E-posta sisteminin düzgün çalıştığını doğrulamak için gönderilmiştir.</p>
            <p>Test zamanı: ${new Date().toLocaleString('tr-TR')}</p>
            <p>Bu e-postayı alıyorsanız, B2B sisteminin e-posta gönderme özelliği başarıyla çalışıyor demektir.</p>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>&copy; ${new Date().getFullYear()} B2B Sistemi - Tüm hakları saklıdır.</p>
          </div>
        </div>
      `
    });

    console.log('Test e-postası gönderildi: %s - Adres: %s', info.messageId, email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Test e-postası gönderimi başarısız:', error);
    return { success: false, error: error.message };
  }
};

// Çeşitli e-posta türleri için fonksiyonlar
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(options);
    console.log('E-posta gönderildi: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderimi başarısız:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createTransporter,
  testEmailConnection,
  sendEmail,
  sendTestEmail,
  transporter: createTransporter()
};
