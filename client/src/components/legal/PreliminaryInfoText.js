import React from 'react';

// Bu bileşen artık dışarıdan props alıyor
function PreliminaryInfoText({ user, cartItems, paymentMethod, totalPrice }) {
  // Eğer veriler henüz yüklenmediyse boş bir div göster
  if (!user || !cartItems) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <h3>Ön Bilgilendirme Formu</h3>
      <p>
        <strong>MADDE 1: SATICI BİLGİLERİ</strong><br />
        <strong>Unvan:</strong> Curkuşlar İnşaat Malzemeleri Sanayi Ticaret Pazarlama Limited Şirketi<br />
        <strong>Adres:</strong> Yaylacık Mahallesi Şefkat sokak No:9 Başiskele/Kocaeli<br />
        <strong>Telefon:</strong> 0543 281 04 93<br />
        <strong>Vergi Numarası:</strong> 2160010857<br />
        <strong>E-posta:</strong> curkuslar@hotmail.com<br />
        <strong>Vergi No:</strong> 2160010857<br />
      </p>
      
      <hr />

      <h4>MADDE 2: SÖZLEŞME KONUSU MAL VEYA HİZMETİN TEMEL NİTELİKLERİ VE FİYATI</h4>
      <p><strong>Ödeme Şekli:</strong> {paymentMethod}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Ürün Adı</th>
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
      <strong>Toplam Tutar: {totalPrice.toFixed(2)} ₺</strong>

      <h4>MADDE 3: TESLİMAT</h4>
      <p>Paketleme, kargo ve teslim masrafları ALICI tarafından karşılanmaktadır. Kargo ücreti sipariş özetinde belirtildiği gibidir. Teslimat, anlaşmalı kargo şirketi aracılığı ile, ALICI'nın aşağıda belirtilen adresine elden teslim edilecektir. Teslim anında ALICI'nın adresinde bulunmaması durumunda dahi Firmamız edimini tam ve eksiksiz olarak yerine getirmiş olarak kabul edilecektir. Bu nedenle, ALICI'nın ürünü geç teslim almasından ve/veya hiç teslim almamasından kaynaklanan zararlardan ve giderlerden SATICI sorumlu değildir. SATICI, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri ve kullanım kılavuzları ile teslim edilmesinden sorumludur.</p>

      <h4>MADDE 4: CAYMA HAKKI</h4>
      <p>Tüketici (ALICI), 14 (ondört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin işbu Mesafeli Satış Sözleşmesi’nden cayma hakkına sahiptir...</p>
      {/* ... Cayma hakkı ile ilgili diğer metinler buraya eklenecek ... */}
      
      <h4>MADDE 5: DİJİTAL İÇERİK</h4>
      <p>Tüketicinin herhangi bir dijital içerik satın alması halinde dijital içeriklerin işlevselliğini etkileyecek teknik koruma önlemleri ve SATICI’nın bildiği ya da makul olarak bilmesinin beklendiği, dijital içeriğin hangi donanım ya da yazılımla birlikte çalışabileceğine ilişkin bilgiler satın alınan ürünün web sitemizdeki tanıtım içeriğinde yer almaktadır.</p>

      <h4>MADDE 6: ŞİKAYET VE İTİRAZLAR</h4>
      <p>İşbu sözleşme ile ilgili çıkacak ihtilaflarda; Türk Mahkemeleri yetkili olup; uygulanacak hukuk Türk Hukuku’dur. Türkiye Cumhuriyeti sınırları içerisinde geçerli olmak üzere İş bu Sözleşme ile ilgili çıkacak ihtilaflarda; her yıl Ticaret Bakanlığı tarafından ilan edilen değere kadar olan ihtilaflar için TÜKETİCİ işleminin yapıldığı veya TÜKETİCİ ikametgahının bulunduğu yerdeki İl veya İlçe Tüketici Hakem Heyetleri, söz konusu değerin üzerindeki ihtilaflarda ise TÜKETİCİ işleminin yapıldığı veya TÜKETİCİ ikametgahının bulunduğu yerdeki Tüketici Mahkemeleri yetkili olacaktır.</p>
      
      {/* ... Geri kalan maddeler (7, 8 vb.) buraya eklenebilir ... */}

      <hr />
      
      <table style={{ width: '100%', marginTop: '2rem' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', verticalAlign: 'top' }}>
              <strong>SATICI</strong><br />
              Curkuşlar İnşaat Malzemeleri Sanayi Ticaret Pazarlama Limited Şirketi
            </td>
            <td style={{ width: '50%', verticalAlign: 'top' }}>
              <strong>ALICI</strong><br />
              {user.name}<br/>
              {user.addresses[0].fullAddress}<br/>
              {user.addresses[0].district}, {user.addresses[0].province}<br/>
              {user.email}
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

export default PreliminaryInfoText;