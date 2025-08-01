const crypto = require('crypto');
// NOT: Circular dependency'den kaçınmak için doğrudan import etmiyoruz
// emailConfig'i sadece ihtiyaç olduğunda require edeceğiz

/**
 * Hoş geldin e-postası gönder
 * @param {Object} user - Kullanıcı bilgileri
 * @returns {Promise} Gönderim durumu
 */
const sendWelcomeEmail = async (user) => {
  try {
    console.log('Hoşgeldin e-postası gönderiliyor:', user.email);
    
    const clientBaseUrl = process.env.CLIENT_URL || 'https://curkuslar.online';
    
    // emailConfig'i sadece burada require et (circular dependency'den kaçınmak için)
    const emailConfig = require('../config/emailConfig');
    
    const result = await emailConfig.sendEmail({
      to: user.email,
      subject: 'B2B Sistemine Hoş Geldiniz',
      template: 'welcome',
      context: {
        name: user.name || user.firstName || 'Değerli Üyemiz',
        email: user.email,
        loginUrl: `${clientBaseUrl}/login`
      }
    });
    
    console.log('Hoşgeldin e-postası gönderme sonucu:', result);
    return result;
  } catch (error) {
    console.error('Hoşgeldin e-postası gönderilirken hata:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Şifre sıfırlama tokeni oluştur ve e-posta gönder
 * @param {Object} user - Kullanıcı bilgileri
 * @param {Object} tokenModel - Token modeli (MongoDB model)
 * @returns {Promise} Token ve gönderim durumu
 */
const sendPasswordResetEmail = async (user, tokenModel) => {
  try {
    console.log('Şifre sıfırlama e-postası gönderiliyor:', user.email);
    
    // Rastgele token oluştur
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token'ı hash'le ve veritabanına kaydet
    const resetTokenExpiry = Date.now() + 3600000; // 1 saat geçerli
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    console.log('Token oluşturuldu, veritabanına kaydediliyor');
    
    // Token veritabanında saklanmalı - ya kullanıcı modelinde ya da ayrı token modelinde
    if (tokenModel) {
      // Token modeli varsa o modeli kullan
      await tokenModel.create({
        userId: user._id,
        token: hashedToken,
        type: 'passwordReset',
        expires: resetTokenExpiry
      });
    } else {
      // Kullanıcı modelinde token sakla
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();
    }
    
    const clientBaseUrl = process.env.CLIENT_URL || 'https://curkuslar.online';
    const resetUrl = `${clientBaseUrl}/reset-password/${resetToken}`;
    
    console.log('Reset URL:', resetUrl);
    
    // Template işleyen ve e-posta gönderen fonksiyonları al
    const emailConfig = require('../config/emailConfig');
    
    // Şablon verilerini hazırla
    const templateData = {
      name: user.name || user.firstName || 'Değerli Üyemiz',
      resetUrl,
      expiryTime: 1 // Saat cinsinden geçerlilik süresi
    };
    
    // E-posta gönderme işlemi
    const result = await emailConfig.sendEmail({
      to: user.email,
      subject: 'Şifre Sıfırlama İsteği',
      template: 'password-reset',
      context: templateData
    });
    
    console.log('E-posta gönderme sonucu:', result);
    
    return { success: result.success, token: resetToken };
  } catch (error) {
    console.error('Şifre sıfırlama e-postası gönderilirken hata:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sipariş durumu güncelleme e-postası gönder
 * @param {Object} user - Kullanıcı bilgileri
 * @param {Object} order - Sipariş bilgileri
 * @param {String} newStatus - Yeni sipariş durumu
 * @returns {Promise} Gönderim durumu
 */
const sendOrderStatusEmail = async (user, order, newStatus) => {
  try {
    console.log(`Sipariş durumu e-postası gönderiliyor: ${user.email}, Durum: ${newStatus}`);

    const statusMap = {
      'Onay Bekliyor': { text: 'Onay Bekliyor', class: 'default', message: 'Siparişiniz onay bekliyor.' },
      'Hazırlanıyor': { text: 'Hazırlanıyor', class: 'processing', message: 'Siparişiniz hazırlanıyor.' },
      'Kargoya Verildi': { text: 'Kargoya Verildi', class: 'shipped', message: 'Siparişiniz kargoya verildi.' },
      'Teslim Edildi': { text: 'Teslim Edildi', class: 'delivered', message: 'Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.' },
      'İptal Edildi': { text: 'İptal Edildi', class: 'cancelled', message: 'Siparişiniz iptal edildi.' }
    };

    const statusInfo = statusMap[newStatus] || { text: 'Güncellendi', class: 'default', message: 'Siparişinizin durumu güncellendi.' };

    const clientBaseUrl = process.env.CLIENT_URL || 'https://curkuslar.online';
    const emailConfig = require('../config/emailConfig');
    const updateDate = new Date().toLocaleDateString('tr-TR');
    const orderId = String(order.orderNumber).padStart(4, '0');

    const templateData = {
      name: user.name || user.firstName || 'Değerli Müşterimiz',
      orderId: orderId,
      orderDate: new Date(order.createdAt).toLocaleDateString('tr-TR'),
      updateDate: updateDate,
      statusText: statusInfo.text,
      statusClass: statusInfo.class,
      statusMessage: statusInfo.message,
      products: (order.orderItems || []).map(item => ({
        name: item.name,
        quantity: item.qty,
        unit: item.unit || 'Adet',
        price: (item.price || 0).toFixed(2)
      })),
      totalAmount: (order.totalPrice || 0).toFixed(2),
      orderDetailsUrl: `${clientBaseUrl}/account/orders/${order._id}`,
      shippingInfo: '' // Başlangıçta boş bırak
    };

    if (newStatus === 'Kargoya Verildi') {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 2);
      const dayOfWeek = deliveryDate.getDay();
      if (dayOfWeek === 0) deliveryDate.setDate(deliveryDate.getDate() + 1); // Pazar ise Pazartesi
      else if (dayOfWeek === 6) deliveryDate.setDate(deliveryDate.getDate() + 2); // Cumartesi ise Pazartesi

      const estimatedDelivery = deliveryDate.toLocaleDateString('tr-TR');
      const packagesCount = order.packagesCount || 1;
      templateData.shippingInfo = 
        `<p style="font-size: 14px; color: #555; margin: 5px 0;"><strong>Tahmini Teslimat Tarihi:</strong> ${estimatedDelivery}</p>` +
        `<p style="font-size: 14px; color: #555; margin: 5px 0;"><strong>Koli Sayısı:</strong> ${packagesCount}</p>`;
    }

    const result = await emailConfig.sendEmail({
      to: user.email,
      subject: `Siparişiniz ${statusInfo.text} - No: #${orderId}`,
      template: 'order-update',
      context: templateData
    });

    console.log('Sipariş durumu e-postası gönderme sonucu:', result);
    return result;
  } catch (error) {
    console.error('Sipariş durumu e-postası gönderilirken hata:', error);
    return { success: false, error: error.message };
  }
};

// Uyum için eski fonksiyon imzasını destekleyen sarmalayıcı
const sendOrderStatusUpdateEmail = async ({ user, order, newStatus }) => {
  return sendOrderStatusEmail(user, order, newStatus);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderStatusEmail,
  sendOrderStatusUpdateEmail
};
