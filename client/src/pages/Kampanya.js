import React, { useEffect } from 'react';

const Kampanya = () => {
  useEffect(() => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const detailsScreen = document.getElementById('details-screen');
    const iskontoButtonsContainer = document.getElementById('iskonto-buttons');
    const tutarInput = document.getElementById('tutar-input');
    const sartlariGorBtn = document.getElementById('sartlari-gor-btn');
    const validationMessage = document.getElementById('validation-message');
    
    const secilenIskontoDeger = document.getElementById('secilen-iskonto-deger');
    const odemeSecenekleriParent = document.getElementById('odeme-secenekleri-parent');
    const odemeSecenekleriContainer = document.getElementById('odeme-secenekleri');
    const paketlerContainer = document.getElementById('paketler-container');
    const paketlerListesi = document.getElementById('paketler-listesi');
    const geriBtn = document.getElementById('geri-btn');

    // --- Data (Default Values) ---
    const defaultOdemePlanlari = {
        "62.5": { aciklamalar: ["Nakit / Peşin ödeme yapabilirsiniz."] },
        "60": { aciklamalar: ["{TARIH} ortalama tarihli 1 Ay vadeli Açık Hesap ile ödeyebilirsiniz.", "Kredi kartı ile Tek Çekim yapabilirsiniz."], vadeAy: 1 },
        "57.5": { aciklamalar: ["{TARIH} ortalama tarihli 2 Ay vadeli Açık Hesap ile ödeyebilirsiniz.", "Kredi kartına 3 Taksit imkanıyla ödeyebilirsiniz."], vadeAy: 2 },
        "55": { aciklamalar: ["{TARIH} ortalama tarihli 4 Ay vadeli Çek ile ödeme yapabilirsiniz."], vadeAy: 4 },
        "52.5": { aciklamalar: ["{TARIH} ortalama tarihli 5 Ay vadeli Çek ile ödeme yapabilirsiniz."], vadeAy: 5 },
        "50": { aciklamalar: ["{TARIH} ortalama tarihli 6 Ay vadeli Çek ile ödeme yapabilirsiniz.", "Kredi kartına 12 Taksit imkanıyla ödeyebilirsiniz."], vadeAy: 6 }
    };

    const defaultPaketTiers = [
         { min: 100000, max: 149999, paketler: [ { ad: "Temel Destek Kiti", tip: "Destek Odaklı", deger: "7.500 TL", icerik: ["3 Aylık E-posta Desteği", "Acil Durum Telefon Hattı"] }, { ad: "Başlangıç Eğitim Paketi", tip: "Eğitim Odaklı", deger: "10.000 TL", icerik: ["Online Video Eğitim Serisi", "1 Saatlik Başlangıç Danışmanlığı"] } ] }, { min: 150000, max: 199999, paketler: [ { ad: "Gümüş Destek Anlaşması", tip: "Kapsamlı Destek", deger: "12.500 TL", icerik: ["6 Aylık Öncelikli Destek", "Aylık Raporlama"] }, { ad: "Strateji Geliştirme Seansı", tip: "Danışmanlık", deger: "15.000 TL", icerik: ["Proje Yol Haritası Çıkarma", "3 Saatlik Strateji Toplantısı"] } ] }, { min: 200000, max: 249999, paketler: [ { ad: "Gelişmiş Raporlama Modülü", tip: "Teknoloji", deger: "17.500 TL", icerik: ["Özelleştirilebilir Rapor Ekranları", "Veri Analizi Aracı"] }, { ad: "Ekip Eğitim Programı", tip: "Eğitim Odaklı", deger: "20.000 TL", icerik: ["Şirketinize Özel Webinar", "5 Kişilik Katılım Hakkı"] } ] }, { min: 250000, max: 299999, paketler: [ { ad: "Altın Destek Paketi", tip: "Öncelikli Destek", deger: "22.500 TL", icerik: ["1 Yıllık Telefon Desteği", "7/24 Acil Durum Hattı"] }, { ad: "Yerinde Kurulum ve Eğitim", tip: "Hizmet", deger: "25.000 TL", icerik: ["Uzman Ekip Tarafından Kurulum", "1 Günlük Yerinde Kullanıcı Eğitimi"] } ] }, { min: 300000, max: 499999, paketler: [ { ad: "Süreç Optimizasyon Danışmanlığı", tip: "Danışmanlık", deger: "30.000 TL", icerik: ["Mevcut Süreç Analizi", "Verimlilik Artırma Raporu"] }, { ad: "Özel Entegrasyon Hizmeti", tip: "Teknoloji", deger: "35.000 TL", icerik: ["Mevcut Yazılımlarınızla Entegrasyon", "API Geliştirme Desteği"] } ] }, { min: 500000, max: 1000000, paketler: [ { ad: "Premium Partner Destek Anlaşması", tip: "VIP Destek", deger: "50.000 TL+", icerik: ["Özel Müşteri Temsilcisi", "Yıllık Strateji Zirvesi", "7/24 Öncelikli Hizmet"] }, { ad: "Kapsamlı Pazar Araştırması", tip: "Strateji", deger: "60.000 TL+", icerik: ["Rakip Analizi", "Pazar Trendleri Raporu", "Giriş Stratejisi Belirleme"] } ] }
    ];

    // --- State Management ---
    let sessionData = {};
    const iskontoOranlari = [62.5, 60, 57.5, 55, 52.5, 50];
    let secilenOran = null;

    function loadSessionData() {
        const savedData = localStorage.getItem('campaignSessionData');
        if (savedData) {
            sessionData = JSON.parse(savedData);
        } else {
            sessionData.odemePlanlari = JSON.parse(JSON.stringify(defaultOdemePlanlari));
            sessionData.paketTiers = JSON.parse(JSON.stringify(defaultPaketTiers));
            saveSessionData();
        }
    }
    function saveSessionData() {
        localStorage.setItem('campaignSessionData', JSON.stringify(sessionData));
    }
    
    loadSessionData();

    // --- Functions ---
    function calculateDueDate(months) {
        if (!months) return '';
        const today = new Date();
        const futureDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
        const lastDayOfMonth = new Date(futureDate.getFullYear(), futureDate.getMonth() + 1, 0);
        return lastDayOfMonth.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function renderDetails() {
        startScreen.classList.add('hidden');
        detailsScreen.classList.remove('hidden');

        secilenIskontoDeger.textContent = `%${secilenOran.toString().replace('.', ',')}`;

        // Render Payment Conditions
        odemeSecenekleriContainer.innerHTML = '';
        const plan = sessionData.odemePlanlari[secilenOran];
        if (plan) {
            const vadeTarihi = calculateDueDate(plan.vadeAy);
            plan.aciklamalar.forEach((aciklama, index) => {
                const conditionElement = createEditableCondition(aciklama.replace('{TARIH}', `<b class="text-white">${vadeTarihi}</b>`), index);
                odemeSecenekleriContainer.appendChild(conditionElement);
            });
        }
        // Remove old button before adding a new one
        odemeSecenekleriParent.querySelector('.add-new-btn')?.remove();
        odemeSecenekleriParent.appendChild(createAddNewButton(odemeSecenekleriContainer, createEditableCondition, "Yeni Koşul Ekle"));

        // Render Packages
        paketlerListesi.innerHTML = '';
        const tutar = parseInt(tutarInput.value.replace(/\./g, ''), 10);
        const uygunTier = sessionData.paketTiers.find(tier => tutar >= tier.min && tutar <= tier.max);

        if (uygunTier) {
            const aciklamaHTML = `<p contenteditable="true" class="text-lg text-gray-300 mb-4">Aşağıdaki <b class="text-white">${uygunTier.paketler.length} paketten</b> birini bedelsiz olarak seçebilirsiniz:</p>`;
            paketlerListesi.innerHTML = aciklamaHTML;

            uygunTier.paketler.forEach((paket, paketIndex) => {
                const paketDiv = createPaketCard(paket, paketIndex, uygunTier);
                paketlerListesi.appendChild(paketDiv);
            });
            
            setupPaketSelection();

        } else {
             if (tutar > 1000000) {
                 paketlerListesi.innerHTML = `<p class="text-gray-300 p-4 text-center bg-gray-700/50 rounded-lg">1.000.000 TL üzerindeki projeler için size özel, çok daha kapsamlı avantajlar sunabilmemiz adına lütfen danışmanınızla doğrudan iletişime geçin.</p>`;
             } else {
                 paketlerListesi.innerHTML = `<p class="text-gray-400">Bu tutar için özel bir avantaj paketi bulunmamaktadır.</p>`;
             }
        }
    }
    
    function createEditableCondition(text, index) {
        const p = document.createElement('p');
        p.className = 'bg-gray-700/40 p-4 rounded-md flex items-start';
        const checkmarkSpan = document.createElement('span');
        checkmarkSpan.className = 'text-yellow-400 mr-3 text-xl flex-shrink-0 mt-1';
        checkmarkSpan.innerHTML = '✓';
        const editableSpan = document.createElement('span');
        editableSpan.setAttribute('contenteditable', 'true');
        editableSpan.innerHTML = text || 'Yeni ödeme koşulunu buraya yazın...';
        editableSpan.onblur = () => {
            sessionData.odemePlanlari[secilenOran].aciklamalar[index] = editableSpan.innerHTML;
            saveSessionData();
        };
        p.appendChild(checkmarkSpan);
        p.appendChild(editableSpan);
        return p;
    }

    function createPaketCard(paket, paketIndex, tier) {
        const paketDiv = document.createElement('div');
        paketDiv.className = 'paket-card p-6 rounded-lg border border-gray-700 flex flex-col';

        const mainContent = document.createElement('div');
        mainContent.className = 'flex-grow';

        const tipSpan = document.createElement('span');
        tipSpan.contentEditable = true;
        tipSpan.className = "inline-block bg-yellow-500/20 text-yellow-300 text-xs font-semibold px-2 py-1 rounded-full mb-2";
        tipSpan.textContent = paket.tip;
        tipSpan.onblur = () => { tier.paketler[paketIndex].tip = tipSpan.textContent; saveSessionData(); };
        
        const adH3 = document.createElement('h3');
        adH3.contentEditable = true;
        adH3.className = "text-xl font-bold gold-gradient-text";
        adH3.textContent = paket.ad;
        adH3.onblur = () => { tier.paketler[paketIndex].ad = adH3.textContent; saveSessionData(); };

        const degerP = document.createElement('p');
        degerP.contentEditable = true;
        degerP.className = "text-gray-400 mb-4";
        degerP.textContent = `Ortalama Değeri: ${paket.deger}`;
        degerP.onblur = () => { tier.paketler[paketIndex].deger = degerP.textContent.replace('Ortalama Değeri: ', ''); saveSessionData(); };

        const icerikListesi = document.createElement('ul');
        icerikListesi.className = 'list-disc list-inside space-y-2 text-gray-300';
        paket.icerik.forEach((item, itemIndex) => {
            icerikListesi.appendChild(createEditableListItem(item, paketIndex, itemIndex, tier));
        });
        
        mainContent.appendChild(tipSpan);
        mainContent.appendChild(adH3);
        mainContent.appendChild(degerP);
        mainContent.appendChild(icerikListesi);
        mainContent.appendChild(createAddNewButton(icerikListesi, createEditableListItem, "Yeni Madde Ekle", {paketIndex, tier}));
        
        const bedelsizP = document.createElement('p');
        bedelsizP.className = "text-center mt-auto pt-4 text-lg font-bold bg-green-600/30 text-green-300 py-2 px-4 rounded-full";
        bedelsizP.textContent = "BU PAKET SİZE BEDELSİZ SUNULACAKTIR";

        paketDiv.appendChild(mainContent);
        paketDiv.appendChild(bedelsizP);

        return paketDiv;
    }

    function createEditableListItem(text, paketIndex, itemIndex, tier) {
        const li = document.createElement('li');
        li.setAttribute('contenteditable', 'true');
        li.textContent = text || 'Yeni maddeyi buraya yazın...';
        li.onblur = () => {
            tier.paketler[paketIndex].icerik[itemIndex] = li.textContent;
            saveSessionData();
        };
        return li;
    }
    
    function createAddNewButton(container, createFunction, buttonText, metadata = {}) {
        const button = document.createElement('button');
        button.className = 'add-new-btn w-full mt-4 bg-gray-700/50 hover:bg-gray-600/50 text-yellow-300 font-semibold py-2 px-4 rounded-lg border border-dashed border-gray-600 hover:border-yellow-400 transition-colors text-sm';
        button.textContent = `+ ${buttonText}`;
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            let newItem;
            if(buttonText === "Yeni Koşul Ekle") {
                const newText = 'Yeni ödeme koşulunu buraya yazın...';
                sessionData.odemePlanlari[secilenOran].aciklamalar.push(newText);
                const newIndex = sessionData.odemePlanlari[secilenOran].aciklamalar.length - 1;
                newItem = createFunction(newText, newIndex);
                container.appendChild(newItem);
            } else if (buttonText === "Yeni Madde Ekle") {
                const newText = 'Yeni maddeyi buraya yazın...';
                metadata.tier.paketler[metadata.paketIndex].icerik.push(newText);
                const newItemIndex = metadata.tier.paketler[metadata.paketIndex].icerik.length - 1;
                newItem = createFunction(newText, metadata.paketIndex, newItemIndex, metadata.tier);
                container.appendChild(newItem);
            }
            saveSessionData();
            newItem.focus();
        });

        return button;
    }
    
    function setupPaketSelection() {
        const allPaketCards = paketlerListesi.querySelectorAll('.paket-card');
        allPaketCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.isContentEditable) return;
                allPaketCards.forEach(c => c.classList.remove('selected', 'deselected'));
                card.classList.add('selected');
                allPaketCards.forEach(c => { if (c !== card) c.classList.add('deselected'); });
            });
        });
    }

    function showStartScreen() {
        detailsScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    // --- Event Listeners and Init ---
    iskontoOranlari.forEach(oran => {
        const button = document.createElement('button');
        button.className = 'iskonto-btn gold-border bg-gray-800/50 text-yellow-300 p-4 rounded-lg text-2xl font-bold cursor-pointer';
        button.textContent = `%${oran.toString().replace('.', ',')}`;
        button.dataset.oran = oran;
        button.addEventListener('click', () => {
            secilenOran = oran;
            document.querySelectorAll('.iskonto-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
        iskontoButtonsContainer.appendChild(button);
    });
    
    sartlariGorBtn.addEventListener('click', () => {
        const tutarValue = parseInt(tutarInput.value.replace(/\./g, ''), 10);
        if (!secilenOran) {
            validationMessage.textContent = 'Lütfen bir iskonto oranı seçin.'; return;
        }
        if (isNaN(tutarValue) || tutarValue < 100000) {
             validationMessage.textContent = 'Lütfen en az 100.000 TL tutarında geçerli bir değer girin.'; return;
        }
        validationMessage.textContent = '';
        renderDetails();
    });

    geriBtn.addEventListener('click', showStartScreen);

    tutarInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value ? new Intl.NumberFormat('tr-TR').format(value) : '';
    });
  }, []);

  return (
    <div className="text-white">
        <style>{`
            body {
                font-family: 'Inter', sans-serif;
                background-color: #111827; /* Dark Gray-Blue */
            }
            .gold-gradient-text {
                 background: linear-gradient(135deg, #FFD700, #B8860B);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .gold-border {
                border: 2px solid;
                border-image-slice: 1;
                border-image-source: linear-gradient(to right, #B8860B, #FFD700, #B8860B);
                transition: all 0.3s ease;
            }
            .iskonto-btn:hover, .iskonto-btn.selected {
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                transform: translateY(-5px) scale(1.02);
                border-image-source: linear-gradient(to right, #FFD700, #F0C400, #FFD700);
            }
            .screen {
                transition: opacity 0.5s ease-out, transform 0.5s ease-out;
            }
            .screen.hidden {
                opacity: 0;
                pointer-events: none;
                position: absolute;
                transform: translateY(20px);
            }
            .paket-card {
                background-color: rgba(31, 41, 55, 0.7);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .paket-card:hover {
                transform: translateY(-5px);
                border-color: #ffd700;
            }
            .paket-card.selected {
                border-color: #4ade80; /* Green border for selected */
                box-shadow: 0 0 25px rgba(74, 222, 128, 0.5);
                transform: scale(1.03);
            }
            .paket-card.deselected {
                opacity: 0.6;
                transform: scale(0.98);
            }
            [contenteditable="true"]:hover, [contenteditable="true"]:focus {
                outline: 2px dashed rgba(255, 215, 0, 0.5);
                background-color: rgba(255, 255, 255, 0.05);
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
                border-radius: 4px;
            }
            /* SSS Akordiyon Stilleri */
            .faq-item summary {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                padding: 1rem;
                background-color: rgba(31, 41, 55, 0.5);
                border-radius: 0.5rem;
                transition: background-color 0.2s ease;
            }
            .faq-item summary:hover {
                background-color: rgba(55, 65, 81, 0.5);
            }
            .faq-item summary::after {
                content: '+';
                font-size: 1.5rem;
                color: #FFD700;
                transition: transform 0.3s ease;
            }
            .faq-item[open] summary::after {
                transform: rotate(45deg);
            }
            .faq-item div {
                padding: 1rem;
                background-color: rgba(17, 24, 39, 0.5);
                border-top: 1px solid #374151;
                border-radius: 0 0 0.5rem 0.5rem;
            }
        `}</style>
      <div className="container mx-auto p-4 sm:p-8 min-h-screen flex flex-col justify-center items-center relative">
        
        {/* Başlangıç Ekranı */}
        <div id="start-screen" className="screen w-full max-w-4xl text-center">
            <h1 style={{fontFamily: 'Playfair Display, serif'}} className="text-4xl md:text-6xl font-bold mb-4 gold-gradient-text">Size Özel İskonto Oranları</h1>
            <p className="text-gray-300 mb-12 text-lg">Lütfen projenize en uygun iskonto oranını seçin ve bağlantı tutarını girin.</p>
            
            <div id="iskonto-buttons" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                {/* İskonto butonları Javascript ile oluşturulacak */}
            </div>

            <div className="max-w-md mx-auto">
                 <label htmlFor="tutar-input" className="block text-lg font-medium text-gray-200 mb-2">Bağlantı Tutarını Girin</label>
                <div className="relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">TL</span>
                    <input type="text" id="tutar-input" placeholder="150.000" className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-500 text-xl p-4 pl-10 rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
            </div>
            <div id="validation-message" className="text-red-400 mt-4 h-6"></div>
            <button id="sartlari-gor-btn" className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 text-xl rounded-lg shadow-lg transition-transform transform hover:scale-105">
                Bağlantı Şartlarını Gör
            </button>
        </div>

        {/* Detay Ekranı */}
        <div id="details-screen" className="screen hidden w-full max-w-5xl">
            <div className="text-center mb-10">
                <p className="text-gray-400 text-2xl mb-2">Seçilen İskonto Oranı</p>
                <h1 id="secilen-iskonto-deger" style={{fontFamily: 'Playfair Display, serif'}} className="text-7xl md:text-9xl font-bold gold-gradient-text">%0</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div id="odeme-secenekleri-parent" className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
                     <h2 className="text-2xl font-semibold text-white mb-6">Ödeme Koşulları</h2>
                     <div id="odeme-secenekleri" className="space-y-4 text-lg text-left">
                         {/* Ödeme seçenekleri Javascript ile oluşturulacak */}
                     </div>
                </div>
                 <div id="paketler-container" className="border border-gray-700 rounded-xl p-8">
                     <h2 className="text-2xl font-semibold text-white mb-6">Size Özel Avantaj Paketleri</h2>
                     <div id="paketler-listesi" className="space-y-4 text-left">
                         {/* Paketler Javascript ile oluşturulacak */}
                     </div>
                 </div>
            </div>

            {/* Sıkça Sorulan Sorular Bölümü */}
            <div id="faq-section" className="mt-12 w-full max-w-5xl">
                <h2 style={{fontFamily: 'Playfair Display, serif'}} className="text-3xl font-bold text-center mb-8 gold-gradient-text">Sıkça Sorulan Sorular</h2>
                <div className="space-y-4">
                    <details className="faq-item">
                        <summary className="text-lg font-semibold">Bu kampanya ne zamana kadar geçerli?</summary>
                        <div className="text-gray-300">
                            Bu özel kampanya, <strong>15 Ekim 2026</strong> tarihine kadar geçerlidir. Bu tarihten sonra yeni bağlantılarda kampanya koşulları uygulanamayacaktır.
                        </div>
                    </details>
                    <details className="faq-item">
                        <summary className="text-lg font-semibold">Birden fazla avantaj paketi seçebilir miyim?</summary>
                        <div className="text-gray-300">
                            Hayır, kampanya kapsamında her bir bağlantı için size sunulan değerli avantaj paketlerinden yalnızca <strong>bir tanesini</strong> seçebilirsiniz.
                        </div>
                    </details>
                    <details className="faq-item">
                        <summary className="text-lg font-semibold">Bedelsiz ürün/hizmet teslimatı ne zaman gerçekleşir?</summary>
                        <div className="text-gray-300">
                            Anlaşılan ön ödemenin tarafımıza ulaşmasını takiben, seçtiğiniz bedelsiz ürün veya hizmetin teslimatı/aktivasyonu <strong>7 iş günü</strong> içerisinde tamamlanacaktır. Kampanyamız stoklarla sınırlıdır; olası bir stok tükenmesi durumunda, müşteri temsilcimiz size eşdeğer veya daha üstün alternatif çözümler sunmak için iletişime geçecektir.
                        </div>
                    </details>
                </div>
            </div>

            <div className="text-center">
                <button id="geri-btn" className="mt-12 bg-transparent gold-border text-yellow-300 font-bold py-3 px-10 rounded-lg hover:bg-yellow-400/10 transition-colors">Geri Dön</button>
            </div>
        </div>

    </div>
    </div>
  );
};

export default Kampanya;
