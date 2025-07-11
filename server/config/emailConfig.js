const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// E-posta göndermek için transport oluştur
const createTransporter = () => {
  // Gmail için güvenli SMTP ayarı (Uygulama Şifresi ile)
  if ((process.env.EMAIL_SERVICE || 'gmail') === 'gmail') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  // Diğer servisler için genel ayar
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Şablon dosyasını oku ve değişkenleri yerleştir
const renderTemplate = (templateName, context) => {
  try {
    const templatePath = path.resolve(__dirname, '../views/emails', `${templateName}.hbs`);
    let template = fs.readFileSync(templatePath, 'utf-8');
    
    // Basit değişken değiştirme işlemi
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`\{\{\s*${key}\s*\}\}`, 'g');
      template = template.replace(regex, context[key]);
    });
    
    return template;
  } catch (error) {
    console.error(`Şablon okunamadı: ${templateName}`, error);
    return `<div>E-posta içeriği yüklenemiyor. Lütfen yönetici ile iletişime geçin.</div>`;
  }
};

// Test amaçlı e-posta gönderimi
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = renderTemplate('test', {
      name: 'Test Kullanıcı',
      message: 'Bu bir test e-postasıdır.'
    });
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"B2B Sistemi" <ornek@gmail.com>',
      to: process.env.TEST_EMAIL || 'test@ornek.com',
      subject: 'E-posta Sistemi Test',
      html: htmlContent
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
    const currentDate = new Date().toLocaleString('tr-TR');
    const currentYear = new Date().getFullYear();
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="color: #1a73e8;">B2B Sistemi</h1>
        </div>
        <div style="padding: 20px;">
          <p>Merhaba,</p>
          <p>Bu bir <strong>test e-postasıdır</strong>. E-posta sisteminin düzgün çalıştığını doğrulamak için gönderilmiştir.</p>
          <p>Test zamanı: ${currentDate}</p>
          <p>Bu e-postayı alıyorsanız, B2B sisteminin e-posta gönderme özelliği başarıyla çalışıyor demektir.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
          <p>&copy; ${currentYear} B2B Sistemi - Tüm hakları saklıdır.</p>
        </div>
      </div>
    `;
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"B2B Sistemi" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'B2B Sistemi E-posta Testi',
      html: html
    });

    console.log('Test e-postası gönderildi: %s - Adres: %s', info.messageId, email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Test e-postası gönderimi başarısız:', error);
    return { success: false, error: error.message };
  }
};

// Genel amaçlı e-posta gönderme fonksiyonu
const sendEmail = async (options) => {
  try {
    const { to, subject, template, context } = options;
    const transporter = createTransporter();
    
    // Şablonu işle
    let htmlContent;
    if (template && context) {
      htmlContent = renderTemplate(template, context);
    } else if (options.html) {
      htmlContent = options.html;
    } else {
      htmlContent = "<p>E-posta içeriği bulunamadı.</p>";
    }
    
    // E-posta gönderimi
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"B2B Sistemi" <ornek@gmail.com>',
      to,
      subject,
      html: htmlContent,
    });

    console.log('E-posta gönderildi: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderimi başarısız:', error);
    return { success: false, error: error.message };
  }
};

// Welcome email gönder
const sendWelcomeEmail = async (to, userName) => {
  try {
    const htmlContent = renderTemplate('welcome', { name: userName });
    return await sendEmail({
      to,
      subject: 'B2B Sistemine Hoş Geldiniz',
      html: htmlContent
    });
  } catch (error) {
    console.error('Hoşgeldiniz e-postası gönderimi başarısız:', error);
    return { success: false, error: error.message };
  }
};

// Password reset email gönder
const sendPasswordResetEmail = async (to, resetToken, userName) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const htmlContent = renderTemplate('password-reset', { 
      name: userName,
      resetUrl: resetUrl
    });
    
    return await sendEmail({
      to,
      subject: 'Şifre Sıfırlama Talebi',
      html: htmlContent
    });
  } catch (error) {
    console.error('Şifre sıfırlama e-postası gönderimi başarısız:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  testEmailConnection,
  sendEmail,
  sendTestEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
