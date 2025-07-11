const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// E-posta göndermek için transport oluştur
const createTransporter = () => {
  // Önce ortam değişkenlerini kontrol et ve logla
  console.log(`E-posta ayarları: SERVICE=${process.env.EMAIL_SERVICE}, USER=${process.env.EMAIL_USER ? '***' : 'TANİMSIZ'}`);
  
  // Gerekli bilgilerin varlığını kontrol et
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('HATA: E-posta kullanıcı adı veya şifre tanımlanmamış!');
    // Boş bir transporter yerine bir hata fırlat ki program hatası açıkça belirlenebilsin
    throw new Error('EMAIL_USER ve EMAIL_PASSWORD ortam değişkenleri tanımlanmalıdır.');
  }
  
  // Gmail için güvenli SMTP ayarı (Uygulama Şifresi ile)
  if ((process.env.EMAIL_SERVICE || 'gmail').toLowerCase() === 'gmail') {
    console.log('Gmail SMTP yapılandırması kullanılıyor...');
    console.log(`E-posta kullanıcısı: ${process.env.EMAIL_USER}`);
    
    // Gmail için açık host ve port belirtme
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS - daha güvenilir bağlantı için
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Sertifika hatalı olsa bile bağlantı kurulmasını sağlar
      }
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
const sendTestEmail = async (to) => {
  console.log(`Test e-postası gönderme isteği: ${to}`);
  
  try {
    // Önce HTML mesajı doğrudan oluştur
    const date = new Date().toLocaleString('tr-TR');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
        <h2>E-posta Sistemi Test</h2>
        <p>Bu bir test e-postasıdır. E-posta sisteminin doğru çalıştığını doğrulamak için gönderilmiştir.</p>
        <p>Gönderim tarihi ve saati: <strong>${date}</strong></p>
      </div>
    `;
    
    // Önce şablon kullanmadan deneme
    const plainResult = await sendEmail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Test E-postası (Doğrudan HTML)',
      html
    });
    
    if (plainResult.success) {
      console.log('Doğrudan HTML ile test e-postası gönderildi');
      return plainResult;
    }
    
    // Eğer başarısız olduysa şablon ile dene
    console.log('Doğrudan HTML ile gönderilemedi, şablon ile deneniyor...');
    
    const templateResult = await sendEmail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Test E-postası (Şablon)',
      template: 'test',
      context: {
        date: date
      }
    });
    
    return templateResult;
  } catch (error) {
    console.error('Test e-postası gönderilirken beklenmeyen hata:', error);
    return { success: false, error: error.message };
  }
};

// Genel amaçlı e-posta gönderme fonksiyonu
const sendEmail = async (mailOptions) => {
  try {
    // Template varsa ve html alanı manuel verilmemişse, template render et
    if (!mailOptions.html && mailOptions.template) {
      const context = mailOptions.context || {};
      mailOptions.html = renderTemplate(mailOptions.template, context);
    }
    console.log('E-posta gönderme işlemi başladı:', { 
      to: mailOptions.to, 
      subject: mailOptions.subject,
      template: mailOptions.template 
    });
    
    // Transporter oluşturma
    const transporter = createTransporter();
    
    // From alanını ayarla
    mailOptions.from = mailOptions.from || process.env.EMAIL_FROM;
    console.log(`Gönderici adresi: ${mailOptions.from}`);
    
    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);
    
    // Başarı bilgisini logla
    console.log('E-posta başarıyla gönderildi:', {
      messageId: info.messageId,
      response: info.response
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderimi başarısız:', {
      errorCode: error.code,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'UNKNOWN'
    };
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
