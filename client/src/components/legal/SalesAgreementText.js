import React from 'react';

// Bu bileşen artık dışarıdan birçok prop alıyor
function SalesAgreementText({ user, cartItems, paymentMethod, totalPrice, shippingPrice, selectedAddress }) {
  // Veriler henüz yüklenmediyse bekle
  if (!user || !cartItems || !selectedAddress) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <h3>Mesafeli Satış Sözleşmesi</h3>
      <h4>MADDE 1- TARAFLAR</h4>
      <p>
        <strong>1.1. SATICI:</strong><br />
        <strong>Unvan:</strong> Curkuşlar İnşaat Malzemeleri Sanayi Ticaret Pazarlama Limited Şirketi<br />
        <strong>Adres:</strong> Yaylacık Mahallesi Şefkat sokak No:9 Başiskele/Kocaeli<br />
        <strong>Telefon:</strong> 0543 281 04 93<br />
        <strong>E-posta:</strong> curkuslar@hotmail.com <br />
        <strong>Vergi Numarası:</strong> 2160010857
      </p>
      <p>
        <strong>1.2. ALICI("TÜKETİCİ"):</strong><br />
        <strong>Adı/Soyadı/Ünvanı:</strong> {user.name}<br />
        <strong>Adresi:</strong> {selectedAddress.fullAddress}, {selectedAddress.district}/{selectedAddress.province}<br />
        <strong>Telefon:</strong> [Kullanıcının Telefon Numarası - modele eklenebilir]<br />
        <strong>Email:</strong> {user.email}<br />
      </p>

      <h4>MADDE 2- KONU</h4>
      <p>İşbu sözleşmenin konusu, TÜKETİCİ'nin, SATICI'ya ait olan internet sitesinden elektronik ortamda siparişini yaptığı aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkındaki Kanun hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.</p>

      <h4>MADDE 3- SÖZLEŞME KONUSU ÜRÜN, ÖDEME VE TESLİMATA İLİŞKİN BİLGİLER</h4>
      <p><strong>3.1- Sözleşme konusu mal veya hizmetin adı, adeti, KDV dahil satış fiyatı, ödeme şekli ve temel nitelikleri</strong></p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Ürün Adı ve Nitelikleri</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Adet</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Satış Bedeli (KDV Dahil)</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map(item => (
            <tr key={item._id}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.qty}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{(item.price * item.qty).toFixed(2)} ₺</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <p><strong>3.2- Ödeme Şekli:</strong> {paymentMethod}</p>
      <p><strong>3.3- İade Prosedürü:</strong></p>
      <p>TÜKETİCİ'nin cayma hakkını kullandığı durumlarda ya da siparişe konu olan ürünün çeşitli sebeplerle tedarik edilememesi veya hakem heyeti kararları ile TÜKETİCİ'ye bedel iadesine karar verilen durumlarda, ödeme seçeneklerine ilişkin iade prosedürü, seçilen ödeme yöntemine göre işleyecektir...</p>
      {/* İade prosedürünün detayları buraya eklenebilir. */}
      
      <p><strong>3.4- Teslimat Şekli ve Adresi:</strong></p>
      <p>
        <strong>Teslimat Adresi:</strong> {selectedAddress.fullAddress}, {selectedAddress.district}/{selectedAddress.province}<br/>
        <strong>Teslim Edilecek Kişi:</strong> {user.name}<br/>
        <strong>Fatura Adresi:</strong> {user.addresses[0].fullAddress}, {user.addresses[0].district}/{user.addresses[0].province}<br/>
      </p>
      <p>
        Kargo ücreti {shippingPrice === 0 ? '0,00 TL (Ücretsiz)' : `${shippingPrice.toFixed(2)} TL`} olup, kargo fiyatı sipariş toplam tutarına eklenmektedir. Teslimat, anlaşmalı kargo şirketi aracılığı ile, TÜKETİCİ'nin yukarıda belirtilen adresinde elden teslim edilecektir...
      </p>

      <h4>MADDE 4- CAYMA HAKKI</h4>
      <p>TÜKETİCİ, SATICI ile imzaladığı işbu Mesafeli Satış Sözleşmesi'nden 14 (ondört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir...</p>
      {/* Cayma hakkı ile ilgili diğer metinler buraya eklenecek */}
      
      <h4>MADDE 5- GENEL HÜKÜMLER</h4>
      <p>5.1- TÜKETİCİ, SATICI'ya ait internet sitesinde sözleşme konusu ürüne ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini beyan eder...</p>
      {/* Diğer genel hükümler buraya eklenecek */}

      <h4>MADDE 6- UYUŞMAZLIK VE YETKİLİ MAHKEME</h4>
      <p>İşbu sözleşme ile ilgili çıkacak ihtilaflarda; Türk Mahkemeleri yetkili olup; uygulanacak hukuk Türk Hukuku’dur...</p>
      {/* Maddenin kalanı buraya eklenecek */}
      <p>Siparişin gerçekleşmesi durumunda TÜKETİCİ işbu sözleşmenin tüm koşullarını kabul etmiş sayılır.</p>
      
      <table style={{ width: '100%', marginTop: '2rem' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', verticalAlign: 'top' }}>
              <strong>SATICI</strong><br />
              Curkuşlar İnşaat Malzemeleri Sanayi Ticaret Pazarlama Limited Şirketi
            </td>
            <td style={{ width: '50%', verticalAlign: 'top' }}>
              <strong>ALICI ("TÜKETİCİ")</strong><br />
              {user.name}
            </td>
          </tr>
          <tr>
            <td style={{paddingTop: '1rem'}}>Tarih: {new Date().toLocaleDateString('tr-TR')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default SalesAgreementText;