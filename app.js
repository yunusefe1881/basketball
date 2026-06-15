    // ===== DRAWER NAV =====
    function openMenu() {
        document.getElementById('hamburger').classList.add('ac');
        document.getElementById('mobMenu').classList.add('ac');
        var bd = document.getElementById('drawerBackdrop'); if (bd) bd.classList.add('ac');
        document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
        document.getElementById('hamburger').classList.remove('ac');
        document.getElementById('mobMenu').classList.remove('ac');
        var bd = document.getElementById('drawerBackdrop'); if (bd) bd.classList.remove('ac');
        document.body.style.overflow = '';
    }
    function toggleMenu() {
        var open = document.getElementById('mobMenu').classList.contains('ac');
        if (open) { closeMenu(); } else { openMenu(); }
    }

    // ===== VIEW ROUTER (uygulama gibi ayrı ekranlar) =====
    var VIEW_MAP = {
        home:     { els: ['heroSection', 'homeHub'], label: 'Ana Sayfa',   icon: '🏠' },
        matches:  { els: ['matches'],                label: 'Maç Takvimi', icon: '🏀' },
        standings:{ els: ['standings'],              label: 'Puan Durumu', icon: '📊' },
        training: { els: ['training'],               label: 'Antrenman',   icon: '💪' },
        diet:     { els: ['diet'],                   label: 'Beslenme',    icon: '🥗' },
        calc:     { els: ['calc'],                   label: 'Hesaplayıcılar', icon: '🧮' },
        performans:{ els: ['performans'],            label: 'Performans',  icon: '📈' },
        takim:    { els: ['takim'],                  label: 'Takım',       icon: '👤' }
    };
    var ALL_VIEW_ELS = ['heroSection', 'homeHub', 'matches', 'standings', 'training', 'diet', 'calc', 'performans', 'takim'];
    var _aktifView = 'home';

    function showView(name, ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (!VIEW_MAP[name]) name = 'home';
        _aktifView = name;

        ALL_VIEW_ELS.forEach(function (id) {
            var el = document.getElementById(id); if (el) el.style.display = 'none';
        });
        VIEW_MAP[name].els.forEach(function (id) {
            var el = document.getElementById(id); if (el) el.style.display = '';
        });

        if (name === 'performans' && typeof perfInit === 'function') { perfInit(); }

        document.querySelectorAll('.drawer-item').forEach(function (d) {
            d.classList.toggle('active', d.getAttribute('data-view') === name);
        });
        document.querySelectorAll('.bn-item').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-view') === name);
        });

        var lbl = document.getElementById('currentViewLabel');
        if (lbl) {
            if (name === 'home') { lbl.classList.remove('show'); lbl.innerHTML = ''; }
            else { lbl.innerHTML = VIEW_MAP[name].icon + ' ' + VIEW_MAP[name].label; lbl.classList.add('show'); }
        }

        closeMenu();
        try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
        if (history.replaceState) { try { history.replaceState(null, '', '#' + name); } catch (e) {} }
    }

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    window.addEventListener('DOMContentLoaded', function () {
        var initial = (location.hash || '').replace('#', '');
        showView(VIEW_MAP[initial] ? initial : 'home');
    });

    var MACLAR = [];

    var secilenKat = null;

    function parseKat(kat) {
        var m = kat.match(/^(U\d+)([EK])([A-C])$/);
        if (!m) return { yas: kat, cinsiyet: '?', lig: '' };
        return { yas: m[1], cinsiyet: m[2] === 'E' ? 'Erkek' : 'Kiz', lig: m[3] + ' Ligi', raw: kat };
    }

    function getKatRenk(kat) {
        var p = parseKat(kat);
        if (p.cinsiyet === 'Kiz') return '#ec4899';
        var yr = {'U10':'#6366f1','U11':'#f59e0b','U12':'#10b981','U14':'#ef4444','U16':'#ff4d05','U18':'#3b82f6'};
        return yr[p.yas] || '#94a3b8';
    }

    // ---- KATEGORİ SEÇİCİ ----
    var secilenYas = null;

    function buildKatStil() {
        if (document.getElementById('katSt')) return;
        var s = document.createElement('style');
        s.id = 'katSt';
        s.textContent =
            // ADIM 1: yaş kartları yatay
            '.yas-grid{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:32px;}' +
            '.yas-kart{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 22px;border-radius:16px;border:2px solid;background:transparent;cursor:pointer;font-family:Inter,sans-serif;transition:all 0.2s;min-width:80px;position:relative;}' +
            '.yas-kart:hover{transform:translateY(-3px);}' +
            '.yas-kart.aktif{transform:translateY(-3px);}' +
            '.yas-kart .yk-yas{font-size:1.25rem;font-weight:900;letter-spacing:-0.5px;}' +
            '.yas-kart .yk-sayi{font-size:0.7rem;font-weight:600;opacity:0.7;}' +
            // ADIM 2: cinsiyet + lig seçimi (aşağı kayar panel)
            '.lig-panel{display:none;background:#111827;border:1px solid #1e293b;border-radius:16px;padding:24px 28px;margin-bottom:28px;animation:slideDown 0.22s ease;}' +
            '.lig-panel.ac{display:block;}' +
            '@keyframes slideDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}' +
            '.lig-panel-ust{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}' +
            '.lig-panel-baslik{font-size:1rem;font-weight:800;color:#f1f5f9;}' +
            '.lig-kapat{background:none;border:none;color:#475569;font-size:1.1rem;cursor:pointer;padding:4px 8px;border-radius:8px;}' +
            '.lig-kapat:hover{color:#94a3b8;background:#1e293b;}' +
            '.cins-blok{margin-bottom:16px;}' +
            '.cins-blok:last-child{margin-bottom:0;}' +
            '.cins-etiket{font-size:0.7rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}' +
            '.cins-satirlar{display:flex;gap:8px;flex-wrap:wrap;}' +
            '.lig-btn{display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:12px;border:1.5px solid;background:transparent;cursor:pointer;font-family:Inter,sans-serif;transition:all 0.18s;}' +
            '.lig-btn:hover{transform:translateY(-2px);}' +
            '.lig-btn.aktif{transform:translateY(-2px);}' +
            '.lig-btn .lb-kod{font-size:0.9rem;font-weight:800;}' +
            '.lig-btn .lb-lig{font-size:0.72rem;font-weight:500;opacity:0.75;}' +
            '.lig-btn .lb-n{font-size:0.68rem;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid;margin-left:4px;}' +
            // Tüm maçlar
            '.tum-btn{display:block;width:100%;padding:11px;border-radius:50px;background:transparent;border:1.5px solid #334155;color:#64748b;font-family:Inter,sans-serif;font-size:0.88rem;font-weight:600;cursor:pointer;transition:all 0.2s;text-align:center;margin-bottom:20px;}' +
            '.tum-btn:hover{border-color:#94a3b8;color:#94a3b8;}' +
            '.tum-btn.aktif{background:#ff4d05;border-color:#ff4d05;color:#fff;}' +
            // TARİH FİLTRESİ (takvim)
            '.tarih-filtre{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;}' +
            '.tf-lbl{font-size:0.82rem;font-weight:700;color:#94a3b8;display:flex;align-items:center;gap:6px;}' +
            '.tf-input{background:#1e293b;border:1.5px solid #334155;border-radius:50px;color:#f1f5f9;font-family:Inter,sans-serif;font-size:0.88rem;font-weight:600;padding:9px 16px;outline:none;cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s;color-scheme:dark;}' +
            '.tf-input:focus{border-color:#ff4d05;box-shadow:0 0 0 3px rgba(255,77,5,0.15);}' +
            '.tf-input.aktif{border-color:#ff4d05;color:#ffb98f;}' +
            '.tf-temizle{background:transparent;border:1.5px solid #334155;color:#94a3b8;font-family:Inter,sans-serif;font-size:0.8rem;font-weight:600;padding:8px 14px;border-radius:50px;cursor:pointer;transition:all 0.18s;}' +
            '.tf-temizle:hover{border-color:#ff4d05;color:#fff;}';
        document.head.appendChild(s);
    }

    function initKatFiltre() {
        buildKatStil();
        var el = document.getElementById('katFiltre');
        var kategoriler = Array.from(new Set(MACLAR.map(function(m){ return m.kat; }))).sort();

        // Yaş → {erkek:[], kiz:[]} grupla
        var yasMap = {};
        kategoriler.forEach(function(kat){
            var p = parseKat(kat);
            if (!yasMap[p.yas]) yasMap[p.yas] = { erkek:[], kiz:[] };
            if (p.cinsiyet === 'Erkek') yasMap[p.yas].erkek.push(kat);
            else yasMap[p.yas].kiz.push(kat);
        });
        var yaslar = Object.keys(yasMap).sort();

        el.innerHTML = '';

        // TARİH FİLTRESİ (takvim) — sezon aralığıyla sınırlı
        var macTarihleri = Array.from(new Set(MACLAR.map(function(m){ return m.tarih; }))).sort();
        var dWrap = document.createElement('div');
        dWrap.className = 'tarih-filtre';
        dWrap.innerHTML =
            '<span class="tf-lbl">📅 Tarihe göre</span>' +
            '<input type="date" id="macTarihInput" class="tf-input"' +
                (macTarihleri.length ? ' min="' + macTarihleri[0] + '" max="' + macTarihleri[macTarihleri.length-1] + '"' : '') + '>' +
            '<button id="macTarihTemizle" class="tf-temizle" style="display:none;">✕ Temizle</button>';
        el.appendChild(dWrap);
        var dInp = document.getElementById('macTarihInput');
        if (dInp) dInp.addEventListener('change', function(){ macTarihSec(dInp.value); });
        var dTmz = document.getElementById('macTarihTemizle');
        if (dTmz) dTmz.addEventListener('click', function(){ if (dInp) dInp.value=''; macTarihSec(''); });

        // Tüm maçlar butonu
        var tb = document.createElement('button');
        tb.className = 'tum-btn aktif';
        tb.id = 'btnTumu';
        tb.innerHTML = '🏀 Tüm Maçlar — ' + MACLAR.length + ' maç';
        tb.onclick = function(){ selectKat(null); };
        el.appendChild(tb);

        // ADIM 1: yaş kartları
        var grid = document.createElement('div');
        grid.className = 'yas-grid';

        yaslar.forEach(function(yas){
            var toplam = MACLAR.filter(function(m){ return parseKat(m.kat).yas === yas; }).length;
            var yasRenk = getYasRenk(yas);

            var kart = document.createElement('button');
            kart.className = 'yas-kart';
            kart.id = 'yaskart_' + yas;
            kart.style.borderColor = yasRenk + '55';
            kart.style.color = yasRenk;
            kart.innerHTML =
                '<span class="yk-yas">' + yas + '</span>' +
                '<span class="yk-sayi">' + toplam + ' maç</span>';
            kart.onclick = (function(y, yr){ return function(){ toggleYasPanel(y, yr); }; })(yas, yasRenk);
            grid.appendChild(kart);
        });
        el.appendChild(grid);

        // ADIM 2: lig seçim paneli (başta gizli)
        var panel = document.createElement('div');
        panel.className = 'lig-panel';
        panel.id = 'ligPanel';
        el.appendChild(panel);
    }

    function getYasRenk(yas) {
        var yr = {'U10':'#6366f1','U11':'#f59e0b','U12':'#10b981','U14':'#ef4444','U16':'#ff4d05','U18':'#3b82f6'};
        return yr[yas] || '#94a3b8';
    }

    // Tarih (takvim) filtresini görsel olarak sıfırla
    function macTarihReset() {
        var d = document.getElementById('macTarihInput');
        if (d) { d.value = ''; d.classList.remove('aktif'); }
        var t = document.getElementById('macTarihTemizle');
        if (t) t.style.display = 'none';
    }

    // Takvimden tarih seçilince o günün maçlarını göster
    function macTarihSec(tarih) {
        var dInp = document.getElementById('macTarihInput');
        var dTmz = document.getElementById('macTarihTemizle');

        // Kategori/yaş seçim görselini sıfırla (iki filtre çakışmasın)
        secilenKat = null;
        secilenYas = null;
        var tumu = document.getElementById('btnTumu'); if (tumu) tumu.classList.remove('aktif');
        var lp = document.getElementById('ligPanel'); if (lp) { lp.classList.remove('ac'); lp.innerHTML = ''; }
        document.querySelectorAll('.yas-kart').forEach(function (k) {
            var yr = getYasRenk(k.id.replace('yaskart_', ''));
            k.style.background = 'transparent'; k.style.color = yr;
            k.style.borderColor = yr + '55'; k.style.boxShadow = '';
            k.classList.remove('aktif');
        });

        if (!tarih) {
            macTarihReset();
            if (tumu) tumu.classList.add('aktif');
            document.getElementById('macListesi').innerHTML = '';
            document.getElementById('macListesi').style.display = 'block';
            document.getElementById('macYok').style.display = 'none';
            var ph = document.getElementById('macSecilmedi'); if (ph) ph.style.display = 'block';
            return;
        }

        if (dInp) dInp.classList.add('aktif');
        if (dTmz) dTmz.style.display = '';
        var ph2 = document.getElementById('macSecilmedi'); if (ph2) ph2.style.display = 'none';
        document.getElementById('macYok').textContent = 'Bu tarihte maç yok — başka bir gün seçin.';
        document.getElementById('macListesi').style.display = 'block';
        renderMaclar(null, tarih);
        setTimeout(function () {
            var ml = document.getElementById('macListesi'); if (ml) ml.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }

    function toggleYasPanel(yas, yasRenk) {
        macTarihReset();
        var panel = document.getElementById('ligPanel');
        var kategoriler = Array.from(new Set(MACLAR.map(function(m){ return m.kat; }))).sort();

        // Yaş kartı aktif toggle
        document.querySelectorAll('.yas-kart').forEach(function(k){
            var yr = getYasRenk(k.id.replace('yaskart_',''));
            k.style.background = 'transparent';
            k.style.color = yr;
            k.style.borderColor = yr + '55';
            k.style.boxShadow = '';
            k.classList.remove('aktif');
        });

        // Aynı yas tekrar tıklandıysa kapat
        if (secilenYas === yas) {
            secilenYas = null;
            panel.classList.remove('ac');
            panel.innerHTML = '';
            document.getElementById('macListesi').innerHTML = '';
            var ph = document.getElementById('macSecilmedi');
            if (ph) ph.style.display = 'block';
            document.getElementById('macYok').style.display = 'none';
            return;
        }

        secilenYas = yas;

        var aktifKart = document.getElementById('yaskart_' + yas);
        if (aktifKart) {
            aktifKart.style.background = yasRenk + '1a';
            aktifKart.style.color = yasRenk;
            aktifKart.style.borderColor = yasRenk;
            aktifKart.style.boxShadow = '0 4px 20px ' + yasRenk + '44';
            aktifKart.classList.add('aktif');
        }

        // Panel içeriğini doldur
        var yasKatlar = kategoriler.filter(function(k){ return parseKat(k).yas === yas; });
        var erkekler = yasKatlar.filter(function(k){ return parseKat(k).cinsiyet === 'Erkek'; });
        var kizlar   = yasKatlar.filter(function(k){ return parseKat(k).cinsiyet === 'Kiz'; });

        panel.innerHTML = '';
        panel.classList.add('ac');

        // Başlık + kapat
        var ust = document.createElement('div');
        ust.className = 'lig-panel-ust';
        ust.innerHTML =
            '<span class="lig-panel-baslik" style="color:' + yasRenk + ';">' + yas + ' — Lig Seç</span>';
        var kapatBtn = document.createElement('button');
        kapatBtn.className = 'lig-kapat';
        kapatBtn.innerHTML = '✕';
        kapatBtn.onclick = function(){
            secilenYas = null;
            panel.classList.remove('ac');
            panel.innerHTML = '';
            document.querySelectorAll('.yas-kart').forEach(function(k){
                var yr = getYasRenk(k.id.replace('yaskart_',''));
                k.style.background = 'transparent'; k.style.color = yr;
                k.style.borderColor = yr + '55'; k.style.boxShadow = '';
                k.classList.remove('aktif');
            });
            document.getElementById('macListesi').innerHTML = '';
            var ph = document.getElementById('macSecilmedi');
            if (ph) ph.style.display = 'block';
            document.getElementById('macYok').style.display = 'none';
        };
        ust.appendChild(kapatBtn);
        panel.appendChild(ust);

        // Erkek + Kız blokları
        [
            { label: '♂ Erkek', renk: '#60a5fa', katlar: erkekler },
            { label: '♀ Kız',   renk: '#f472b6', katlar: kizlar   }
        ].forEach(function(grup){
            if (!grup.katlar.length) return;
            var blok = document.createElement('div');
            blok.className = 'cins-blok';

            var et = document.createElement('div');
            et.className = 'cins-etiket';
            et.style.color = grup.renk;
            et.innerHTML = grup.label;
            blok.appendChild(et);

            var satirlar = document.createElement('div');
            satirlar.className = 'cins-satirlar';

            grup.katlar.forEach(function(kat){
                var p = parseKat(kat);
                var kr = grup.renk;
                var sayim = MACLAR.filter(function(m){ return m.kat === kat; }).length;

                var btn = document.createElement('button');
                btn.className = 'lig-btn';
                btn.id = 'ligbtn_' + kat;
                btn.style.borderColor = kr + '55';
                btn.style.color = kr;
                btn.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:2px;">' +
                        '<span class="lb-kod">' + kat + '</span>' +
                        '<span class="lb-lig">' + p.lig + '</span>' +
                    '</div>' +
                    '<span class="lb-n" style="color:' + kr + ';border-color:' + kr + '44;background:' + kr + '11;">' + sayim + '</span>';

                btn.onclick = (function(k, kr2){ return function(){ selectKat(k, kr2); }; })(kat, kr);
                satirlar.appendChild(btn);
            });
            blok.appendChild(satirlar);
            panel.appendChild(blok);
        });
    }

    function selectKat(kat, renk) {
        secilenKat = kat;
        macTarihReset();
        var myDef = document.getElementById('macYok'); if (myDef) myDef.textContent = 'Bu kategoride maç bulunamadı.';

        // tüm lig butonlarını sıfırla
        document.querySelectorAll('.lig-btn').forEach(function(b){
            var kr = b.id.replace('ligbtn_','');
            var p2 = parseKat(kr);
            var cr = p2.cinsiyet === 'Kiz' ? '#f472b6' : '#60a5fa';
            b.style.background = 'transparent';
            b.style.color = cr;
            b.style.borderColor = cr + '55';
            b.classList.remove('aktif');
            b.style.boxShadow = '';
        });

        var tumuBtn = document.getElementById('btnTumu');
        if (!kat) {
            tumuBtn.classList.add('aktif');
            document.getElementById('ligPanel').classList.remove('ac');
            secilenYas = null;
            document.querySelectorAll('.yas-kart').forEach(function(k){
                var yr = getYasRenk(k.id.replace('yaskart_',''));
                k.style.background = 'transparent'; k.style.color = yr;
                k.style.borderColor = yr + '55'; k.style.boxShadow = '';
                k.classList.remove('aktif');
            });
            // Tüm Maçlar seçildiğinde TÜM maçları tarihe göre listele
            document.getElementById('macListesi').style.display = 'block';
            document.getElementById('macYok').style.display = 'none';
            var ph = document.getElementById('macSecilmedi');
            if (ph) ph.style.display = 'none';
            renderMaclar(null);
            return;
        }
        tumuBtn.classList.remove('aktif');

        var ab = document.getElementById('ligbtn_' + kat);
        if (ab) {
            ab.style.background = renk + '22';
            ab.style.color = renk;
            ab.style.borderColor = renk;
            ab.classList.add('aktif');
            ab.style.boxShadow = '0 4px 16px ' + renk + '44';
        }

        renderMaclar(kat);

        // Maç listesine kaydır
        setTimeout(function(){
            var ml = document.getElementById('macListesi');
            if (ml) ml.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }

    function bugunISO(){
        var d = new Date();
        return d.getFullYear() + '-' +
               String(d.getMonth() + 1).padStart(2, '0') + '-' +
               String(d.getDate()).padStart(2, '0');
    }

    function salonMapsURL(salon){
        var q = String(salon || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ' İstanbul');
    }

    function gotoBugun(){
        showView('matches');
        var b = bugunISO();
        var hedef = MACLAR.some(function(m){ return m.tarih === b; }) ? b : null;
        if (!hedef) {
            var ileri = MACLAR.filter(function(m){ return m.tarih > b; }).map(function(m){ return m.tarih; }).sort();
            hedef = ileri.length ? ileri[0] : null;
        }
        renderMaclar(null, hedef);
        setTimeout(function(){
            var el = document.querySelector('.mg-bugun') || document.querySelector('.mg-blok') || document.getElementById('macListesi');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    }

    function renderBugunBanner(){
        var box = document.getElementById('bugunBanner');
        if (!box) return;

        if (!document.getElementById('bugunStyle')) {
            var bs = document.createElement('style');
            bs.id = 'bugunStyle';
            bs.textContent =
                '.bugun-banner{max-width:900px;margin:0 auto 30px;background:linear-gradient(135deg,#1b1205,#1e293b);border:1px solid #ff5a1855;border-radius:18px;padding:18px 22px;box-shadow:0 12px 40px -14px #ff5a1840;}' +
                '.bb-head{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-weight:900;font-size:0.92rem;color:#ffb98a;letter-spacing:0.3px;}' +
                '.bb-dot{width:9px;height:9px;border-radius:50%;background:#ff3b30;box-shadow:0 0 0 4px #ff3b3033;animation:bbpulse 1.6s infinite;flex-shrink:0;}' +
                '@keyframes bbpulse{0%,100%{opacity:1;}50%{opacity:0.35;}}' +
                '.bb-count{margin-left:auto;font-size:0.75rem;font-weight:800;color:#fff;background:#ff5a18;padding:3px 11px;border-radius:20px;white-space:nowrap;}' +
                '.bb-list{margin:14px 0 4px;display:flex;flex-direction:column;gap:9px;}' +
                '.bb-mac{display:flex;align-items:center;gap:12px;font-size:0.86rem;color:#cbd5e1;min-width:0;}' +
                '.bb-saat{font-weight:900;color:#ff7849;min-width:46px;flex-shrink:0;}' +
                '.bb-vs{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
                '.bb-vs i{color:#64748b;font-style:normal;font-size:0.78rem;padding:0 5px;}' +
                '.bb-kalan{font-size:0.78rem;color:#64748b;padding-left:58px;}' +
                '.bb-btn{margin-top:14px;background:linear-gradient(135deg,#ff6322,#ff9248);color:#fff;border:none;border-radius:10px;padding:11px 20px;font-weight:800;font-size:0.9rem;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;}' +
                '.bb-btn:hover{transform:translateY(-2px);box-shadow:0 10px 26px -8px #ff5a1899;}' +
                '.bb-bos-alt{margin:10px 0 2px;font-size:0.88rem;color:#94a3b8;}' +
                '.bb-bos-alt b{color:#e2e8f0;}' +
                '.bb-dot.bos{background:#475569;box-shadow:none;animation:none;}' +
                '.bb-head.bos{color:#94a3b8;}' +
                '.bb-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}';
            document.head.appendChild(bs);
        }

        var bugun = bugunISO();
        var bugunMac = MACLAR.filter(function(m){ return m.tarih === bugun; });

        if (bugunMac.length) {
            bugunMac.sort(function(a,b){ return a.saat.localeCompare(b.saat); });
            var satirlar = bugunMac.slice(0, 4).map(function(m){
                return '<div class="bb-mac"><span class="bb-saat">' + m.saat + '</span>' +
                       '<span class="bb-vs">' + puanEsc(m.a) + ' <i>vs</i> ' + puanEsc(m.b) + '</span></div>';
            }).join('');
            var kalan = bugunMac.length > 4 ? '<div class="bb-kalan">+' + (bugunMac.length - 4) + ' maç daha</div>' : '';
            box.innerHTML =
                '<div class="bb-head"><span class="bb-dot"></span><span class="bb-title">BUGÜN · ' + bugunMac[0].gun + ', ' + bugunMac[0].td + '</span>' +
                    '<span class="bb-count">' + bugunMac.length + ' maç</span></div>' +
                '<div class="bb-list">' + satirlar + kalan + '</div>' +
                '<button class="bb-btn" onclick="gotoBugun()">Bugünün maçlarını gör →</button>';
            box.style.display = '';
        } else {
            var ileri = MACLAR.filter(function(m){ return m.tarih > bugun; }).map(function(m){ return m.tarih; }).sort();
            if (ileri.length) {
                var sm = MACLAR.filter(function(m){ return m.tarih === ileri[0]; })[0];
                box.innerHTML =
                    '<div class="bb-head bos"><span class="bb-dot bos"></span><span class="bb-title">Bugün planlanmış maç yok</span></div>' +
                    '<div class="bb-bos-alt">Sıradaki maç günü: <b>' + sm.gun + ', ' + sm.td + '</b></div>' +
                    '<button class="bb-btn" onclick="gotoBugun()">Takvime git →</button>';
                box.style.display = '';
            } else {
                box.style.display = 'none';
            }
        }
    }

    function renderMaclar(kat, sadeceTarih) {
        var liste = document.getElementById('macListesi');
        var yok   = document.getElementById('macYok');
        var placeholder = document.getElementById('macSecilmedi');
        if (placeholder) placeholder.style.display = 'none';
        var filtered = kat ? MACLAR.filter(function(m){ return m.kat === kat; }) : MACLAR;
        if (sadeceTarih) filtered = filtered.filter(function(m){ return m.tarih === sadeceTarih; });

        liste.innerHTML = '';

        if (filtered.length === 0) {
            yok.style.display = 'block';
            return;
        }
        yok.style.display = 'none';

        if (!document.getElementById('macStyle')) {
            var st = document.createElement('style');
            st.id = 'macStyle';
            st.textContent =
                '.mg-blok{margin-bottom:8px;border-radius:16px;overflow:hidden;border:1px solid #1a2540;}' +
                '.mg-blok:hover{box-shadow:0 4px 20px rgba(0,0,0,0.4);}' +
                '.mg-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;cursor:pointer;user-select:none;background:#1e293b;}' +
                '.mg-hdr:hover{background:#243044;}' +
                '.mg-sol{display:flex;align-items:center;gap:14px;}' +
                '.mg-bar{width:3px;border-radius:2px;height:36px;flex-shrink:0;}' +
                '.mg-tarih{font-size:1rem;font-weight:800;color:#f1f5f9;}' +
                '.mg-sayi{font-size:0.75rem;color:#64748b;margin-top:3px;}' +
                '.mg-chev{font-size:0.85rem;color:#475569;transition:transform 0.22s;display:inline-block;}' +
                '.mg-chev.ac{transform:rotate(180deg);}' +
                '.mg-body{display:none;background:#0c1221;}' +
                '.mg-body.ac{display:block;}' +
                '.ms{display:flex;align-items:stretch;border-bottom:1px solid #0d1826;min-height:76px;transition:background 0.15s;}' +
                '.ms:last-child{border-bottom:none;}' +
                '.ms:hover{background:rgba(255,255,255,0.03);}' +
                '.ms-saat{flex:0 0 110px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-right:1px solid #0d1826;padding:0 12px;}' +
                '.ms-saat-val{font-size:1.05rem;font-weight:900;letter-spacing:0.5px;}' +
                '.ms-saat-ico{font-size:0.7rem;opacity:0.4;}' +
                '.ms-orta{flex:1;display:flex;align-items:center;gap:0;min-width:0;}' +
                '.ms-takim{flex:1;display:flex;align-items:center;min-width:0;padding:0 20px;}' +
                '.ms-takim-a{justify-content:flex-end;}' +
                '.ms-takim-b{justify-content:flex-start;}' +
                '.ms-takim-isim{font-size:1rem;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
                '.ms-vs{flex:0 0 52px;display:flex;align-items:center;justify-content:center;}' +
                '.ms-vs-ic{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0a1628;border:1.5px solid #1e3050;font-size:0.65rem;font-weight:900;color:#2d4060;letter-spacing:1px;}' +
                '.ms-meta{flex:0 0 230px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:7px;padding:14px 24px 14px 14px;border-left:1px solid #0d1826;}' +
                '.ms-rozet{font-size:0.74rem;font-weight:800;padding:4px 14px;border-radius:20px;white-space:nowrap;}' +
                '.ms-salon{display:block;font-size:0.72rem;color:#5b738f;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px;cursor:pointer;text-decoration:none;transition:color 0.15s;}' +
                '.ms-salon:hover{color:#ff7849;text-decoration:underline;}' +
                '.ms-salon::before{content:"📍 ";font-size:0.65rem;}' +
                '.ms-grup{font-size:0.68rem;font-weight:700;padding:2px 10px;border-radius:8px;background:#0f1929;color:#475569;border:1px solid #1e293b;}' +
                '.mg-bugun{border-color:#ff5a18;box-shadow:0 0 0 1px #ff5a1855,0 6px 24px -8px #ff5a1855;}' +
                '.mg-bugun .mg-hdr{background:linear-gradient(90deg,#2a1810,#1e293b);}' +
                '.mg-bugun-rozet{display:inline-block;margin-left:8px;font-size:0.62rem;font-weight:900;letter-spacing:0.5px;color:#fff;background:#ff5a18;padding:2px 8px;border-radius:6px;vertical-align:middle;}' +
                // tarihi gecmis (oynanmis) gunler soluk gosterilir
                '.mg-gecmis{opacity:0.5;transition:opacity 0.18s;}' +
                '.mg-gecmis:hover{opacity:0.9;}' +
                '.mg-gecmis-rozet{display:inline-block;margin-left:8px;font-size:0.62rem;font-weight:800;letter-spacing:0.5px;color:#94a3b8;background:#1e293b;border:1px solid #334155;padding:2px 8px;border-radius:6px;vertical-align:middle;}' +
                // MOBIL: dikey kart — ust satir saat+rozet, orta tam genislik "A vs B", alt satir saha
                '@media(max-width:768px){' +
                '.ms{flex-direction:column;align-items:stretch;gap:10px;padding:13px 15px;min-height:0;}' +
                '.ms-saat{flex:none;flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;border-right:none;padding:0;}' +
                '.ms-saat-val{font-size:0.95rem;}' +
                '.ms-saat-ico{display:inline;font-size:0.8rem;opacity:0.55;}' +
                '.ms-orta{flex:none;width:100%;}' +
                '.ms-takim{padding:0 6px;}' +
                '.ms-takim-isim{font-size:0.9rem;white-space:normal;}' +
                '.ms-vs{flex:0 0 42px;}' +
                '.ms-vs-ic{width:30px;height:30px;font-size:0.55rem;}' +
                '.ms-meta{display:flex!important;flex:none;width:100%;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:8px;border-left:none;border-top:1px solid #0d1826;padding:10px 0 0;}' +
                '.ms-rozet{display:inline-flex;font-size:0.7rem;padding:3px 11px;}' +
                '.ms-grup{display:inline-flex;}' +
                '.ms-salon{max-width:none;text-align:left;font-size:0.8rem;}' +
                '}';
            document.head.appendChild(st);
        }

        var gruplar = {};
        filtered.forEach(function(m){
            if (!gruplar[m.tarih]) gruplar[m.tarih] = [];
            gruplar[m.tarih].push(m);
        });

        var tarihler = Object.keys(gruplar).sort();
        var bugun = bugunISO();

        tarihler.forEach(function(t, idx){
            var maclar = gruplar[t].sort(function(a,b){ return a.saat.localeCompare(b.saat); });
            var ilk  = maclar[0];
            var renk = kat ? getKatRenk(kat) : '#ff4d05';
            var isBugun = (t === bugun);
            var isGecmis = (t < bugun);
            var bid  = 'mg_' + t.replace(/-/g,'');
            var cid  = bid + '_c';

            var blok = document.createElement('div');
            blok.className = 'mg-blok' + (isBugun ? ' mg-bugun' : '') + (isGecmis ? ' mg-gecmis' : '');

            var hdr = document.createElement('div');
            hdr.className = 'mg-hdr';
            hdr.innerHTML =
                '<div class="mg-sol">' +
                    '<div class="mg-bar" style="background:' + renk + '"></div>' +
                    '<div>' +
                        '<div class="mg-tarih">' + ilk.gun + ', ' + ilk.td + (isBugun ? ' <span class="mg-bugun-rozet">BUGÜN</span>' : (isGecmis ? ' <span class="mg-gecmis-rozet">OYNANDI</span>' : '')) + '</div>' +
                        '<div class="mg-sayi">' + maclar.length + ' mac</div>' +
                    '</div>' +
                '</div>' +
                '<span class="mg-chev" id="' + cid + '">&#9660;</span>';

            var body = document.createElement('div');
            body.className = 'mg-body';
            body.id = bid;

            maclar.forEach(function(m){
                var kr = kat ? renk : getKatRenk(m.kat);
                var satir = document.createElement('div');
                satir.className = 'ms';
                satir.innerHTML =
                    '<div class="ms-saat" style="background:linear-gradient(180deg,' + kr + '0a 0%,transparent 100%);">' +
                        '<span class="ms-saat-val" style="color:' + kr + ';">' + m.saat + '</span>' +
                        '<span class="ms-saat-ico">⏱</span>' +
                    '</div>' +
                    '<div class="ms-orta">' +
                        '<div class="ms-takim ms-takim-a"><span class="ms-takim-isim puan-takim-link" onclick="showTakimProfil(\'' + takimAttr(m.a) + '\')">' + puanEsc(m.a) + '</span></div>' +
                        '<div class="ms-vs"><div class="ms-vs-ic">VS</div></div>' +
                        '<div class="ms-takim ms-takim-b"><span class="ms-takim-isim puan-takim-link" onclick="showTakimProfil(\'' + takimAttr(m.b) + '\')">' + puanEsc(m.b) + '</span></div>' +
                    '</div>' +
                    '<div class="ms-meta">' +
                        '<span class="ms-rozet" style="color:' + kr + ';border:1px solid ' + kr + '44;background:' + kr + '18;">' + puanEsc(m.kat) + '</span>' +
                        '<a class="ms-salon" href="' + salonMapsURL(m.salon) + '" target="_blank" rel="noopener" title="Google Maps\'te göster">' + puanEsc(m.salon) + '</a>' +
                        (m.grup ? '<span class="ms-grup">' + puanEsc(m.grup) + '</span>' : '') +
                    '</div>';
                body.appendChild(satir);
            });

            hdr.onclick = (function(bid2, cid2){
                return function(){
                    var b2 = document.getElementById(bid2);
                    var c2 = document.getElementById(cid2);
                    if (b2) b2.classList.toggle('ac');
                    if (c2) c2.classList.toggle('ac');
                };
            })(bid, cid);

            blok.appendChild(hdr);
            blok.appendChild(body);
            liste.appendChild(blok);

            if (idx === 0 || isBugun) {
                body.classList.add('ac');
                var ch = document.getElementById(cid);
                if (ch) ch.classList.add('ac');
            }
        });
    }


    // Mac verileri TBF Istanbul programindan uretilen data/matches.json'dan yuklenir
    function yukleMaclar() {
        return fetch('data/matches.json', { cache: 'no-store' })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function (data) { MACLAR = Array.isArray(data) ? data : []; initKatFiltre(); renderBugunBanner(); renderFavoriBanner(); })
            .catch(function (e) {
                console.error('matches.json yuklenemedi:', e);
                var ml = document.getElementById('macListesi');
                if (ml) {
                    ml.style.display = 'block';
                    ml.innerHTML = '<p style="text-align:center;color:#f87171;padding:40px;">Maclar su an yuklenemedi. Lutfen daha sonra tekrar deneyin.</p>';
                }
            });
    }
    yukleMaclar();

    // Acik kalan sekme gece yarisini gecerse: gun degisince verileri yeniden cek
    // ve "bugun" vurgusunu yeni gune tasi (her dakika kontrol).
    var _sonGun = bugunISO();
    setInterval(function () {
        var simdi = bugunISO();
        if (simdi !== _sonGun) {
            _sonGun = simdi;
            yukleMaclar();
        }
    }, 60000);
    // Sayfa açıldığında maç listesi gizli — kategori seçilince gösterilir

    // ===== PUAN DURUMU =====
    var STANDINGS = null;
    var secilenLigId = null;

    function puanEsc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function buildPuanStil() {
        if (document.getElementById('puanSt')) return;
        var s = document.createElement('style');
        s.id = 'puanSt';
        s.textContent =
            '.puan-lig-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:50px;border:1.5px solid #334155;background:transparent;color:#94a3b8;font-family:Inter,sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.18s;}' +
            '.puan-lig-btn:hover{border-color:#ff4d05;color:#f1f5f9;transform:translateY(-2px);}' +
            '.puan-lig-btn.aktif{background:#ff4d05;border-color:#ff4d05;color:#fff;box-shadow:0 6px 18px -6px rgba(255,77,5,0.6);}' +
            /* ---- arama ---- */
            '.puan-arama{width:100%;padding:15px 48px 15px 50px;background:#1e293b;border:1.5px solid #334155;border-radius:50px;color:#f1f5f9;font-size:0.95rem;font-family:Inter,sans-serif;outline:none;transition:border-color 0.2s,box-shadow 0.2s;}' +
            '.puan-arama:focus{border-color:#ff4d05;box-shadow:0 0 0 3px rgba(255,77,5,0.15);}' +
            '.puan-arama::placeholder{color:#64748b;}' +
            '.puan-arama-sil{display:none;position:absolute;right:16px;top:50%;transform:translateY(-50%);background:none;border:none;color:#64748b;font-size:1.1rem;cursor:pointer;line-height:1;padding:6px;border-radius:50%;transition:color 0.2s;}' +
            '.puan-arama-sil:hover{color:#ff4d05;}' +
            /* ---- breadcrumb (arama sonucu) ---- */
            '.puan-bread{display:flex;align-items:center;flex-wrap:wrap;gap:7px;font-size:0.8rem;font-weight:700;color:#94a3b8;margin-bottom:14px;}' +
            '.puan-bread .pb-lig{color:#ffb98f;background:rgba(255,77,5,0.12);border:1px solid rgba(255,77,5,0.3);padding:3px 11px;border-radius:50px;}' +
            '.puan-bread .pb-sep{color:#475569;}' +
            '.puan-arama-bos{text-align:center;padding:48px 20px;color:#64748b;}' +
            '.puan-arama-bos .pab-ico{font-size:2.6rem;margin-bottom:12px;}' +
            '.puan-arama-bos b{display:block;color:#94a3b8;font-size:1rem;margin-bottom:5px;}' +
            /* ---- akordeon ---- */
            '.puan-tier-lbl{font-size:0.72rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ff8a45;margin:22px 4px 12px;display:flex;align-items:center;gap:9px;}' +
            '.puan-tier-lbl::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,138,69,0.35),transparent);}' +
            '.puan-tier-lbl:first-child{margin-top:0;}' +
            '.pa-blok{margin-bottom:9px;border-radius:14px;overflow:hidden;border:1px solid #1e293b;background:#0f172a;}' +
            '.pa-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;cursor:pointer;user-select:none;background:#161f33;transition:background 0.15s;}' +
            '.pa-hdr:hover{background:#1c2740;}' +
            '.pa-hsol{display:flex;align-items:center;gap:13px;min-width:0;}' +
            '.pa-bar{width:3px;border-radius:2px;height:34px;flex-shrink:0;background:#ff4d05;}' +
            '.pa-ad{font-size:0.95rem;font-weight:800;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.pa-alt{font-size:0.74rem;color:#64748b;margin-top:2px;}' +
            '.pa-chev{font-size:0.8rem;color:#475569;transition:transform 0.22s;flex-shrink:0;margin-left:10px;}' +
            '.pa-chev.ac{transform:rotate(180deg);}' +
            '.pa-body{display:none;background:#0c1221;overflow-x:auto;padding:6px 14px 12px;}' +
            '.pa-body.ac{display:block;}' +
            '.puan-chip-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;margin-bottom:12px;}' +
            '.puan-chip-row:empty{display:none;margin:0;}' +
            '.puan-chip-lbl{font-size:0.7rem;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;color:#475569;margin-right:3px;}' +
            '.puan-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:50px;border:1px solid #1e293b;background:#0f172a;color:#94a3b8;font-family:Inter,sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.16s;-webkit-tap-highlight-color:transparent;white-space:nowrap;}' +
            '.puan-chip:hover{border-color:#ff4d05;color:#f1f5f9;}' +
            '.puan-chip:active{transform:scale(0.95);}' +
            '.puan-chip.aktif{background:rgba(255,77,5,0.15);border-color:#ff4d05;color:#ffb98f;}' +
            '.puan-chip .pc-say{font-size:0.68rem;font-weight:600;color:#64748b;background:rgba(148,163,184,0.12);padding:1px 7px;border-radius:50px;}' +
            '.puan-chip.aktif .pc-say{color:#ffb98f;background:rgba(255,77,5,0.18);}' +
            '@media(max-width:560px){.puan-chip-row{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;-webkit-overflow-scrolling:touch;padding-bottom:5px;margin-bottom:10px;}.puan-chip-row::-webkit-scrollbar{height:0;}.puan-chip{flex:0 0 auto;}.puan-chip-lbl{position:sticky;left:0;background:linear-gradient(90deg,#0b1120 70%,transparent);padding-right:6px;}}' +
            '.puan-grup-kart{background:#111827;border:1px solid #1e293b;border-radius:16px;padding:18px 18px 10px;margin-bottom:22px;overflow-x:auto;}' +
            '.puan-grup-baslik{font-size:0.95rem;font-weight:800;color:#f1f5f9;margin-bottom:14px;display:flex;align-items:center;gap:8px;}' +
            '.puan-grup-baslik .pg-hafta{font-size:0.7rem;font-weight:600;color:#64748b;margin-left:auto;}' +
            '.puan-tablo{width:100%;border-collapse:collapse;font-family:Inter,sans-serif;min-width:420px;}' +
            '.puan-tablo th{font-size:0.66rem;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#64748b;text-align:center;padding:8px 6px;border-bottom:1px solid #1e293b;}' +
            '.puan-tablo th.takim,.puan-tablo td.takim{text-align:left;}' +
            '.puan-tablo td{font-size:0.86rem;color:#cbd5e1;text-align:center;padding:10px 6px;border-bottom:1px solid #1e293b;}' +
            '.puan-tablo td.puan{font-weight:800;color:#f1f5f9;}' +
            '.puan-tablo td.sira{font-weight:800;color:#64748b;width:34px;}' +
            '.puan-takim{display:flex;align-items:center;gap:10px;font-weight:600;color:#f1f5f9;}' +
            '.puan-takim img{width:24px;height:24px;object-fit:contain;border-radius:5px;flex-shrink:0;background:#1e293b;}' +
            /* logosuz takimlar icin bas-harf rozeti */
            '.puan-logo-fb{width:24px;height:24px;border-radius:5px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:#cbd5e1;background:linear-gradient(135deg,#334155,#1e293b);}' +
            '.puan-takim-link{cursor:pointer;transition:color 0.15s;}' +
            '.puan-takim-link:hover{color:#ff7849!important;text-decoration:underline;}' +
            '.puan-tablo tbody tr:hover td{background:rgba(255,77,5,0.05);}' +
            /* ilk sira renk kodu */
            '.puan-tablo td.sira.s1{color:#fbbf24;box-shadow:inset 3px 0 #fbbf24;}' +
            '.puan-tablo td.sira.s2,.puan-tablo td.sira.s3{color:#34d399;box-shadow:inset 3px 0 #34d399;}' +
            /* aranan takim vurgusu */
            '.puan-tablo tr.vurgu td{background:rgba(255,77,5,0.16)!important;}' +
            '.puan-tablo tr.vurgu td.takim .puan-takim>span:last-child{color:#ffb98f;}' +
            // form (son 5 sonuc noktalari)
            '.puan-tablo th.form,.puan-tablo td.form{text-align:center;white-space:nowrap;}' +
            '.puan-form{display:inline-flex;gap:3px;align-items:center;justify-content:center;}' +
            '.pf-dot{width:7px;height:7px;border-radius:50%;display:inline-block;}' +
            '.pf-w{background:#34d399;}' +
            '.pf-l{background:#f87171;}' +
            '@media(max-width:560px){' +
                '.puan-tablo .hide-sm{display:none;}' +
                '.puan-tablo{min-width:0;font-size:0.8rem;}' +
                '.puan-tablo th{font-size:0.58rem;padding:7px 3px;}' +
                '.puan-tablo td{padding:8px 3px;}' +
                '.puan-tablo td.sira,.puan-tablo th.sira{width:20px;}' +
                '.puan-takim{gap:7px;}' +
                '.puan-takim img,.puan-logo-fb{width:18px;height:18px;font-size:0.6rem;}' +
                '.puan-grup-kart{padding:12px 10px 6px;}' +
                '.puan-grup-baslik{font-size:0.85rem;}' +
                '.puan-lig-btn{padding:9px 14px;font-size:0.82rem;}' +
                '.pa-hdr{padding:12px 14px;}' +
                '.pa-ad{font-size:0.88rem;}' +
                '.pa-body{padding:4px 10px 10px;}' +
                '.puan-arama{padding:13px 44px 13px 46px;font-size:0.9rem;}' +
                '.pf-dot{width:6px;height:6px;}.puan-form{gap:2px;}' +
            '}';
        document.head.appendChild(s);
    }

    function initPuanDurumu() {
        buildPuanStil();
        // Aramayi JS ile bagla (inline oninput bazi mobil tarayicilarda tetiklenmeyebilir)
        var aramaInp = document.getElementById('puanAramaInput');
        if (aramaInp && !aramaInp._bagli) {
            aramaInp._bagli = true;
            aramaInp.addEventListener('input', function () { puanTakimArama(aramaInp.value); });
            var silBtn = document.getElementById('puanAramaSil');
            if (silBtn) silBtn.addEventListener('click', puanAramaTemizle);
        }
        var sec = document.getElementById('puanLigSecici');
        var ligler = (STANDINGS && STANDINGS.ligler) || [];
        var gun = document.getElementById('puanGuncelleme');
        if (gun) gun.textContent = (STANDINGS && STANDINGS.guncelleme) ? ('Son güncelleme: ' + STANDINGS.guncelleme) : '';
        var surum = document.getElementById('siteSurum');
        if (surum) surum.textContent = 'Sürüm 2026.06.14' + ((STANDINGS && STANDINGS.guncelleme) ? (' · Veri ' + STANDINGS.guncelleme) : '');
        sec.innerHTML = '';
        if (!ligler.length) {
            document.getElementById('puanSecilmedi').style.display = 'none';
            var py = document.getElementById('puanYok');
            py.style.display = 'block';
            py.textContent = 'Şu an gösterilecek puan durumu yok.';
            return;
        }
        ligler.forEach(function (lig) {
            var b = document.createElement('button');
            b.className = 'puan-lig-btn';
            b.id = 'puanLig_' + lig.leagueId;
            b.innerHTML = '📊 ' + puanEsc(lig.etiket);
            b.onclick = (function (id) { return function () { selectLig(id); }; })(lig.leagueId);
            sec.appendChild(b);
        });
        selectLig(ligler[0].leagueId);
    }

    function selectLig(leagueId) {
        secilenLigId = leagueId;
        document.querySelectorAll('.puan-lig-btn').forEach(function (b) {
            b.classList.toggle('aktif', b.id === 'puanLig_' + leagueId);
        });
        var lig = ((STANDINGS && STANDINGS.ligler) || []).filter(function (l) { return l.leagueId === leagueId; })[0];
        document.getElementById('puanSecilmedi').style.display = 'none';
        var py = document.getElementById('puanYok'); py.style.display = 'none';
        var tiers = puanBuildTiers(lig);
        if (!tiers.length) {
            document.getElementById('puanAkordeon').innerHTML = '';
            py.style.display = 'block';
            py.textContent = 'Bu lig için henüz puan durumu yok.';
            return;
        }
        renderAkordeon(tiers);
    }

    // "ERKEKLER U10C LİGİ ASYA F GRUBU" -> { tier:'U10C', sub:'ASYA F' }
    function puanParcaGrup(rawName) {
        var name = (rawName || '').toUpperCase().replace(/\s+/g, ' ').trim();
        var m = name.match(/U\d{1,2}[A-Z]?/);
        var tier = m ? m[0] : '';
        var sub = name
            .replace(/ERKEKLER|KIZLAR|ERKEK|KIZ/g, '')
            .replace(/L[İI]G[İI]?/g, '')
            .replace(/GRUBU|GRUP/g, '')
            .replace(/U\d{1,2}[A-Z]?/, '')
            .replace(/\s+/g, ' ').trim();
        if (!tier) tier = sub || name;
        return { tier: tier, sub: sub };
    }

    // Ligin gruplarını alt-lig (tier) altında kümele: tier'lar API sırasında, gruplar alfabetik
    function puanBuildTiers(lig) {
        var tiers = [], idx = {};
        ((lig && lig.gruplar) || []).forEach(function (g) {
            var p = puanParcaGrup(g.grup);
            if (!(p.tier in idx)) { idx[p.tier] = tiers.length; tiers.push({ tier: p.tier, gruplar: [] }); }
            tiers[idx[p.tier]].gruplar.push({ sub: p.sub, veri: g });
        });
        tiers.forEach(function (t) {
            t.gruplar.sort(function (a, b) { return a.sub.localeCompare(b.sub, 'tr'); });
        });
        return tiers;
    }

    // Lig akordeonunu kur: tier'lar bölüm başlığı, her grup katlanır kart.
    function renderAkordeon(tiers) {
        var wrap = document.getElementById('puanAkordeon');
        wrap.innerHTML = '';
        var cokTier = tiers.length > 1;
        var ilkAcildi = false;

        tiers.forEach(function (t) {
            if (cokTier) {
                var lbl = document.createElement('div');
                lbl.className = 'puan-tier-lbl';
                lbl.textContent = t.tier + ' Ligi';
                wrap.appendChild(lbl);
            }
            t.gruplar.forEach(function (g) {
                var grup = g.veri;
                var n = (grup.takimlar || []).length;
                var basAd = g.sub || t.tier || 'Grup';

                var blok = document.createElement('div');
                blok.className = 'pa-blok';

                var hdr = document.createElement('div');
                hdr.className = 'pa-hdr';
                hdr.innerHTML =
                    '<div class="pa-hsol">' +
                        '<span class="pa-bar"></span>' +
                        '<div><div class="pa-ad">🏆 ' + puanEsc(basAd) + '</div>' +
                        '<div class="pa-alt">' + (grup.hafta ? grup.hafta + '. hafta · ' : '') + n + ' takım</div></div>' +
                    '</div>' +
                    '<span class="pa-chev">▼</span>';

                var body = document.createElement('div');
                body.className = 'pa-body';
                body.innerHTML = puanTabloHTML(grup, {});

                hdr.onclick = function () {
                    body.classList.toggle('ac');
                    hdr.querySelector('.pa-chev').classList.toggle('ac');
                };

                blok.appendChild(hdr);
                blok.appendChild(body);
                wrap.appendChild(blok);

                if (!ilkAcildi) {
                    body.classList.add('ac');
                    hdr.querySelector('.pa-chev').classList.add('ac');
                    ilkAcildi = true;
                }
            });
        });
    }

    // Takım logosu: yoksa baş-harf rozeti
    function puanLogoHTML(t) {
        if (t.logo) return '<img src="' + puanEsc(t.logo) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
        var harf = puanEsc(((t.takim || '?').trim().charAt(0) || '?').toUpperCase());
        return '<span class="puan-logo-fb">' + harf + '</span>';
    }

    // Tek grup tablosu (string döndürür); opts.highlightSet = vurgulanacak normalize isimler
    function puanTabloHTML(grup, opts) {
        opts = opts || {};
        var hl = opts.highlightSet;
        if (!grup || !grup.takimlar || !grup.takimlar.length) return '';
        var html = '<table class="puan-tablo"><thead><tr>' +
                '<th class="sira">#</th><th class="takim">Takım</th>' +
                '<th>O</th><th>G</th><th>M</th>' +
                '<th class="hide-sm">A</th><th class="hide-sm">Y</th>' +
                '<th>Av</th><th>P</th></tr></thead><tbody>';
        grup.takimlar.forEach(function (t) {
            var av = (t.av > 0 ? '+' : '') + t.av;
            var sCls = (t.sira == 1 ? ' s1' : (t.sira == 2 ? ' s2' : (t.sira == 3 ? ' s3' : '')));
            var vur = (hl && hl[normalizeText(t.takim)]) ? ' class="vurgu"' : '';
            html += '<tr' + vur + '>' +
                '<td class="sira' + sCls + '">' + (t.sira || '') + '</td>' +
                '<td class="takim"><span class="puan-takim">' + puanLogoHTML(t) + '<span class="puan-takim-link" onclick="showTakimProfil(\'' + takimAttr(t.takim) + '\')">' + puanEsc(t.takim) + '</span></span></td>' +
                '<td>' + t.o + '</td><td>' + t.g + '</td><td>' + t.m + '</td>' +
                '<td class="hide-sm">' + t.a + '</td><td class="hide-sm">' + t.y + '</td>' +
                '<td>' + av + '</td>' +
                '<td class="puan">' + t.puan + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    // Takım arama: tüm ligler/gruplar taranır, eşleşen takımın tablosu vurgulu açılır
    function puanTakimArama(val) {
        var sil = document.getElementById('puanAramaSil');
        var sonuc = document.getElementById('puanAramaSonuc');
        var gozat = document.getElementById('puanGozat');
        var py = document.getElementById('puanYok');

        if (!val || val.trim().length < 2) { puanAramaTemizle(); return; }

        sil.style.display = 'block';
        gozat.style.display = 'none';
        if (py) py.style.display = 'none';
        sonuc.style.display = 'block';

        var q = normalizeText(val.trim());
        var ligler = (STANDINGS && STANDINGS.ligler) || [];
        var bulunan = [];
        ligler.forEach(function (lig) {
            (lig.gruplar || []).forEach(function (grup) {
                var hlSet = {}, eslesti = false;
                (grup.takimlar || []).forEach(function (t) {
                    if (normalizeText(t.takim).indexOf(q) !== -1) { hlSet[normalizeText(t.takim)] = true; eslesti = true; }
                });
                if (eslesti) {
                    var p = puanParcaGrup(grup.grup);
                    bulunan.push({ lig: lig, tier: p.tier, sub: p.sub, grup: grup, hl: hlSet });
                }
            });
        });

        if (!bulunan.length) {
            sonuc.innerHTML = '<div class="puan-arama-bos"><div class="pab-ico">🔍</div>' +
                '<b>Eşleşen takım bulunamadı</b>' +
                '<div>"' + puanEsc(val) + '" için sonuç yok — farklı bir takım adı deneyin</div></div>';
            return;
        }

        var KAP = 24;
        var fazla = bulunan.length - KAP;
        if (fazla > 0) bulunan = bulunan.slice(0, KAP);

        var html = '';
        bulunan.forEach(function (b) {
            var bread = '<div class="puan-bread"><span class="pb-lig">' + puanEsc(b.lig.etiket) + '</span>' +
                (b.tier ? '<span class="pb-sep">›</span>' + puanEsc(b.tier) : '') +
                (b.sub ? '<span class="pb-sep">›</span>' + puanEsc(b.sub) : '') + '</div>';
            html += '<div class="puan-grup-kart">' + bread + puanTabloHTML(b.grup, { highlightSet: b.hl }) + '</div>';
        });
        if (fazla > 0) html += '<p class="calc-note">+' + fazla + ' grup daha — aramayı daraltın.</p>';
        sonuc.innerHTML = html;

        var ilk = sonuc.querySelector('tr.vurgu');
        if (ilk && ilk.scrollIntoView) { try { ilk.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
    }

    function puanAramaTemizle() {
        var inp = document.getElementById('puanAramaInput'); if (inp) inp.value = '';
        var sil = document.getElementById('puanAramaSil'); if (sil) sil.style.display = 'none';
        var sonuc = document.getElementById('puanAramaSonuc'); if (sonuc) { sonuc.style.display = 'none'; sonuc.innerHTML = ''; }
        var gozat = document.getElementById('puanGozat'); if (gozat) gozat.style.display = '';
    }

    // ===== TAKIM PROFILI =====
    // takim adini tek-tirnakli JS string + cift-tirnakli HTML attribute icinde guvenli kilar
    function takimAttr(ad) {
        return puanEsc(String(ad == null ? '' : ad).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
    }

    function takimLogoBul(takimAdi) {
        var ligler = (STANDINGS && STANDINGS.ligler) || [];
        for (var i = 0; i < ligler.length; i++) {
            var gr = ligler[i].gruplar || [];
            for (var j = 0; j < gr.length; j++) {
                var tk = gr[j].takimlar || [];
                for (var k = 0; k < tk.length; k++) {
                    if (tk[k].logo && ayniTakim(tk[k].takim, takimAdi)) return tk[k].logo;
                }
            }
        }
        return '';
    }

    function buildTakimStil() {
        if (document.getElementById('takimSt')) return;
        var s = document.createElement('style');
        s.id = 'takimSt';
        s.textContent =
            '.tp-geri{background:rgba(148,163,184,0.1);border:1px solid #334155;color:#cbd5e1;font-family:Inter,sans-serif;font-size:0.85rem;font-weight:600;padding:8px 16px;border-radius:50px;cursor:pointer;margin-bottom:20px;transition:all 0.18s;}' +
            '.tp-geri:hover{border-color:#ff4d05;color:#fff;}' +
            '.tp-head{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,#1e293b,#141d31);border:1px solid #334155;border-radius:20px;padding:22px 24px;max-width:760px;margin:0 auto 22px;}' +
            '.tp-logo{width:64px;height:64px;border-radius:16px;flex-shrink:0;object-fit:contain;background:#0f172a;border:1px solid #1e293b;}' +
            '.tp-logo-fb{width:64px;height:64px;border-radius:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.7rem;font-weight:800;color:#cbd5e1;background:linear-gradient(135deg,#334155,#1e293b);}' +
            '.tp-ad{font-family:"Space Grotesk",Inter,sans-serif;font-size:1.5rem;font-weight:800;color:#fff;line-height:1.15;min-width:0;word-break:break-word;}' +
            '.tp-alt{font-size:0.82rem;color:#94a3b8;margin-top:4px;}' +
            '.tp-sec{max-width:760px;margin:0 auto 14px;}' +
            '.tp-sec-lbl{font-size:0.72rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ff8a45;margin:24px auto 12px;max-width:760px;display:flex;align-items:center;gap:9px;}' +
            '.tp-sec-lbl::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,138,69,0.35),transparent);}' +
            '.tp-bos{text-align:center;color:#64748b;padding:24px;font-size:0.9rem;background:#0f172a;border:1px solid #1e293b;border-radius:13px;}' +
            '.tp-mac{display:flex;align-items:center;gap:12px;background:#0f172a;border:1px solid #1e293b;border-radius:13px;padding:12px 14px;margin-bottom:8px;}' +
            '.tp-mac-tar{flex:0 0 58px;text-align:center;}' +
            '.tp-mac-gun{font-size:0.66rem;color:#64748b;text-transform:uppercase;font-weight:700;}' +
            '.tp-mac-saat{font-size:0.95rem;font-weight:900;color:#ff7849;}' +
            '.tp-mac-orta{flex:1;min-width:0;}' +
            '.tp-mac-rakip{font-size:0.92rem;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.tp-mac-rakip b{color:#94a3b8;font-weight:600;font-size:0.8rem;}' +
            '.tp-mac-alt{font-size:0.72rem;color:#5b738f;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.tp-mac-kat{flex-shrink:0;font-size:0.66rem;font-weight:700;color:#94a3b8;background:#1e293b;border:1px solid #334155;padding:3px 9px;border-radius:8px;}' +
            // son sonuclar
            '.tp-son{display:flex;align-items:center;gap:14px;background:#0f172a;border:1px solid #1e293b;border-radius:13px;padding:10px 14px;margin-bottom:8px;}' +
            '.tp-son-skor{flex:0 0 auto;min-width:66px;font-family:"Space Grotesk",Inter,sans-serif;font-size:1.1rem;font-weight:800;border-radius:10px;padding:6px 8px;display:flex;align-items:center;justify-content:center;}' +
            '.tp-son-skor i{font-style:normal;opacity:0.5;margin:0 2px;}' +
            '.tp-son-skor.win{color:#34d399;background:rgba(52,211,153,0.12);}' +
            '.tp-son-skor.loss{color:#f87171;background:rgba(248,113,113,0.12);}' +
            '.tp-son-gm{font-size:0.64rem;font-weight:900;margin-right:5px;opacity:0.85;}' +
            '.tp-son-orta{flex:1;min-width:0;}' +
            '.tp-son-rakip{font-size:0.9rem;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.tp-son-rakip b{color:#94a3b8;font-weight:600;font-size:0.78rem;}' +
            '.tp-son-alt{font-size:0.72rem;color:#5b738f;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '@media(max-width:560px){.tp-head{padding:16px;gap:12px;}.tp-logo,.tp-logo-fb{width:50px;height:50px;font-size:1.3rem;}.tp-ad{font-size:1.2rem;}.tp-mac-kat{display:none;}.tp-son-skor{font-size:1rem;min-width:58px;}}';
        document.head.appendChild(s);
    }

    var _takimGeri = 'standings';
    var _acikTakimAdi = null;

    function showTakimProfil(takimAdi) {
        if (!takimAdi) return;
        _acikTakimAdi = takimAdi;
        buildPuanStil();
        buildTakimStil();
        _takimGeri = (_aktifView && _aktifView !== 'takim') ? _aktifView : 'standings';

        var logo = takimLogoBul(takimAdi);

        // --- baslik karti ---
        var bas = document.getElementById('takimBaslik');
        var logoHtml = logo
            ? '<img class="tp-logo" src="' + puanEsc(logo) + '" alt="" onerror="this.style.display=\'none\'">'
            : '<span class="tp-logo-fb">' + puanEsc((takimAdi.trim().charAt(0) || '?').toUpperCase()) + '</span>';
        buildFavStil();
        bas.className = 'tp-head';
        var favAktif = favoriVar(takimAdi);
        var favBtn = '<button id="tpFavBtn" class="tp-fav' + (favAktif ? ' ac' : '') + '" data-ad="' + puanEsc(takimAdi) + '" onclick="favoriToggle(\'' + takimAttr(takimAdi) + '\')">' + (favAktif ? '★ Favorilerde' : '☆ Favorile') + '</button>';
        bas.innerHTML = logoHtml + '<div style="min-width:0;flex:1;"><div class="tp-ad">' + puanEsc(takimAdi) + '</div>' +
            '<div class="tp-alt">İstanbul Altyapı Basketbol</div></div>' + favBtn;

        // --- son sonuclari (oynanmis, skorlu) ---
        var sonucEl = document.getElementById('takimSonuc');
        var sonuclar = (RESULTS || []).filter(function (r) {
            return ayniTakim(r.a, takimAdi) || ayniTakim(r.b, takimAdi);
        });
        sonuclar.sort(function (a, b) { return (b.tarih + b.saat).localeCompare(a.tarih + a.saat); });
        if (sonuclar.length) {
            var sh = '<div class="tp-sec-lbl">📋 Son Sonuçları <span style="color:#64748b;font-weight:600;text-transform:none;letter-spacing:0;">(' + sonuclar.length + ')</span></div><div class="tp-sec">';
            sonuclar.slice(0, 12).forEach(function (r) {
                var benEv = ayniTakim(r.a, takimAdi);
                var rakip = benEv ? r.b : r.a;
                var benS = benEv ? r.as : r.bs;
                var rakS = benEv ? r.bs : r.as;
                var gal = benS > rakS;
                var etk = lidEtiket(r.lid);
                sh += '<div class="tp-son">' +
                    '<div class="tp-son-skor ' + (gal ? 'win' : 'loss') + '"><span class="tp-son-gm">' + (gal ? 'G' : 'M') + '</span>' + benS + '<i>-</i>' + rakS + '</div>' +
                    '<div class="tp-son-orta">' +
                        '<div class="tp-son-rakip"><b>vs</b> <span class="puan-takim-link" onclick="showTakimProfil(\'' + takimAttr(rakip) + '\')">' + puanEsc(rakip) + '</span></div>' +
                        '<div class="tp-son-alt">' + puanEsc(r.tarih) + (etk ? ' · ' + puanEsc(etk) : '') + '</div>' +
                    '</div>' +
                    '</div>';
            });
            sh += '</div>';
            sonucEl.innerHTML = sh;
        } else {
            sonucEl.innerHTML = '';
        }

        // --- puan durumundaki yeri ---
        var puanEl = document.getElementById('takimPuan');
        var bulunan = [];
        ((STANDINGS && STANDINGS.ligler) || []).forEach(function (lig) {
            (lig.gruplar || []).forEach(function (grup) {
                var hlSet = {}, has = false;
                (grup.takimlar || []).forEach(function (t) {
                    if (ayniTakim(t.takim, takimAdi)) { hlSet[normalizeText(t.takim)] = true; has = true; }
                });
                if (has) { var p = puanParcaGrup(grup.grup); bulunan.push({ lig: lig, tier: p.tier, sub: p.sub, grup: grup, hl: hlSet }); }
            });
        });
        var ph = '<div class="tp-sec-lbl">📊 Puan Durumu</div>';
        if (bulunan.length) {
            bulunan.forEach(function (b) {
                var bread = '<div class="puan-bread"><span class="pb-lig">' + puanEsc(b.lig.etiket) + '</span>' +
                    (b.tier ? '<span class="pb-sep">›</span>' + puanEsc(b.tier) : '') +
                    (b.sub ? '<span class="pb-sep">›</span>' + puanEsc(b.sub) : '') + '</div>';
                ph += '<div class="tp-sec"><div class="puan-grup-kart">' + bread + puanTabloHTML(b.grup, { highlightSet: b.hl }) + '</div></div>';
            });
        } else {
            ph += '<div class="tp-sec"><div class="tp-bos">Bu takım puan durumu verisinde yok (yalnızca U10–U12 mevcut).</div></div>';
        }
        puanEl.innerHTML = ph;

        // --- maclari ---
        var macEl = document.getElementById('takimMaclar');
        var maclar = (MACLAR || []).filter(function (m) {
            return ayniTakim(m.a, takimAdi) || ayniTakim(m.b, takimAdi);
        });
        maclar.sort(function (a, b) { return (a.tarih + a.saat).localeCompare(b.tarih + b.saat); });
        var mh = '<div class="tp-sec-lbl">🏀 Maçları <span style="color:#64748b;font-weight:600;text-transform:none;letter-spacing:0;">(' + maclar.length + ')</span></div><div class="tp-sec">';
        if (!maclar.length) {
            mh += '<div class="tp-bos">Yaklaşan maç bulunamadı.</div>';
        } else {
            maclar.forEach(function (m) {
                var benEv = ayniTakim(m.a, takimAdi);
                var rakip = benEv ? m.b : m.a;
                var gunKisa = (m.gun || '').slice(0, 3);
                mh += '<div class="tp-mac">' +
                    '<div class="tp-mac-tar"><div class="tp-mac-gun">' + puanEsc(gunKisa) + '</div><div class="tp-mac-saat">' + puanEsc(m.saat) + '</div></div>' +
                    '<div class="tp-mac-orta">' +
                        '<div class="tp-mac-rakip"><b>vs</b> <span class="puan-takim-link" onclick="showTakimProfil(\'' + takimAttr(rakip) + '\')">' + puanEsc(rakip) + '</span></div>' +
                        '<div class="tp-mac-alt">' + puanEsc(m.td || '') + ' · ' + puanEsc(m.salon || '') + '</div>' +
                    '</div>' +
                    '<span class="tp-mac-kat">' + puanEsc(m.kat || '') + '</span>' +
                    '</div>';
            });
        }
        mh += '</div>';
        macEl.innerHTML = mh;

        showView('takim');
        var lbl = document.getElementById('currentViewLabel');
        if (lbl) { lbl.innerHTML = '👤 ' + puanEsc(takimAdi); lbl.classList.add('show'); }
        try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) {}
    }

    function takimGeri() { _acikTakimAdi = null; showView(_takimGeri || 'standings'); }

    // ===== FAVORI TAKIMLAR =====
    var FAV_KEY = 'baskeportal_favoriler_v1';
    function favoriList() {
        try { var a = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); return Array.isArray(a) ? a : []; }
        catch (e) { return []; }
    }
    function favoriKaydet(list) { try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {} }
    function favoriVar(ad) {
        var q = normalizeText(ad);
        return favoriList().some(function (x) { return normalizeText(x) === q; });
    }
    function favoriToggle(ad) {
        if (!ad) return;
        var q = normalizeText(ad), list = favoriList(), i = -1;
        for (var k = 0; k < list.length; k++) { if (normalizeText(list[k]) === q) { i = k; break; } }
        if (i >= 0) list.splice(i, 1); else list.push(ad);
        favoriKaydet(list);
        var btn = document.getElementById('tpFavBtn');
        if (btn && normalizeText(btn.getAttribute('data-ad') || '') === q) {
            var aktif = favoriVar(ad);
            btn.classList.toggle('ac', aktif);
            btn.innerHTML = aktif ? '★ Favorilerde' : '☆ Favorile';
        }
        renderFavoriBanner();
    }

    function buildFavStil() {
        if (document.getElementById('favSt')) return;
        var s = document.createElement('style');
        s.id = 'favSt';
        s.textContent =
            '.tp-fav{flex-shrink:0;margin-left:auto;align-self:flex-start;background:rgba(255,77,5,0.1);border:1.5px solid rgba(255,77,5,0.4);color:#ffb98f;font-family:Inter,sans-serif;font-size:0.82rem;font-weight:700;padding:8px 14px;border-radius:50px;cursor:pointer;white-space:nowrap;transition:all 0.18s;-webkit-tap-highlight-color:transparent;}' +
            '.tp-fav:hover{border-color:#ff4d05;color:#fff;}' +
            '.tp-fav.ac{background:#ff4d05;border-color:#ff4d05;color:#fff;box-shadow:0 6px 18px -6px rgba(255,77,5,0.6);}' +
            '.fav-banner{max-width:900px;margin:0 auto 30px;background:linear-gradient(135deg,#101a2e,#1e293b);border:1px solid #334155;border-radius:18px;padding:16px 18px;}' +
            '.fv-head{font-weight:900;font-size:0.95rem;color:#ffd9a3;margin-bottom:12px;letter-spacing:0.3px;}' +
            '.fv-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:rgba(15,23,42,0.6);border:1px solid #1e293b;border-radius:12px;padding:11px 14px;margin-bottom:8px;cursor:pointer;font-family:Inter,sans-serif;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}' +
            '.fv-row:last-child{margin-bottom:0;}' +
            '.fv-row:hover{border-color:#ff4d05;transform:translateX(2px);}' +
            '.fv-ad{font-size:0.92rem;font-weight:800;color:#f1f5f9;flex-shrink:0;max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.fv-mac{font-size:0.8rem;color:#cbd5e1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.fv-bugun{color:#fff;background:#ff5a18;padding:1px 7px;border-radius:6px;font-size:0.68rem;font-weight:900;}' +
            '.fv-yok{font-size:0.8rem;color:#64748b;}' +
            '.fv-chev{margin-left:auto;color:#475569;font-size:1.2rem;flex-shrink:0;}' +
            '@media(max-width:560px){.fv-ad{max-width:38%;font-size:0.84rem;}.fv-mac,.fv-yok{font-size:0.74rem;}}';
        document.head.appendChild(s);
    }

    function renderFavoriBanner() {
        var box = document.getElementById('favoriBanner');
        if (!box) return;
        var favs = favoriList();
        if (!favs.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
        buildFavStil();
        box.className = 'fav-banner';
        var bugun = (typeof bugunISO === 'function') ? bugunISO() : '';
        var rows = favs.map(function (ad) {
            var q = normalizeText(ad);
            var ileri = (MACLAR || []).filter(function (m) {
                return (normalizeText(m.a).indexOf(q) !== -1 || normalizeText(m.b).indexOf(q) !== -1) && m.tarih >= bugun;
            }).sort(function (a, b) { return (a.tarih + a.saat).localeCompare(b.tarih + b.saat); });
            var mac = ileri[0], sat;
            if (mac) {
                var rakip = normalizeText(mac.a).indexOf(q) !== -1 ? mac.b : mac.a;
                var ne = (mac.tarih === bugun) ? '<b class="fv-bugun">BUGÜN</b> ' : (puanEsc(mac.td) + ' · ');
                sat = '<span class="fv-mac">' + ne + puanEsc(mac.saat) + ' · vs ' + puanEsc(rakip) + '</span>';
            } else {
                sat = '<span class="fv-yok">Yaklaşan maç yok</span>';
            }
            return '<button class="fv-row" onclick="showTakimProfil(\'' + takimAttr(ad) + '\')">' +
                '<span class="fv-ad">⭐ ' + puanEsc(ad) + '</span>' + sat + '<span class="fv-chev">›</span></button>';
        }).join('');
        box.innerHTML = '<div class="fv-head">⭐ Favori Takımların</div>' + rows;
        box.style.display = '';
    }

    // Puan durumu verisi data/standings.json'dan yuklenir (update_standings.py uretir)
    fetch('data/standings.json', { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) { STANDINGS = data || { ligler: [] }; initPuanDurumu(); })
        .catch(function (e) {
            console.error('standings.json yuklenemedi:', e);
            var ps = document.getElementById('puanSecilmedi'); if (ps) ps.style.display = 'none';
            var py = document.getElementById('puanYok'); if (py) py.style.display = 'block';
        });

    // Mac sonuclari (oynanmis, skorlu) data/results.json'dan yuklenir (update_results.py uretir)
    var RESULTS = [];
    fetch('data/results.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) {
            RESULTS = Array.isArray(d) ? d : [];
            _FORM = null;
            // Puan durumu zaten cizildiyse formu gostermek icin mevcut ligi yeniden ciz
            if (secilenLigId != null && typeof selectLig === 'function') { try { selectLig(secilenLigId); } catch (e) {} }
            // Takim profili aciksa form bilgisini guncelle
            if (_acikTakimAdi) { try { showTakimProfil(_acikTakimAdi); } catch (e) {} }
        })
        .catch(function () { RESULTS = []; });

    // leagueId -> etiket (STANDINGS'ten)
    function lidEtiket(lid) {
        var ligler = (STANDINGS && STANDINGS.ligler) || [];
        for (var i = 0; i < ligler.length; i++) { if (ligler[i].leagueId === lid) return ligler[i].etiket; }
        return '';
    }

    // ===== FORM (son 5 sonuc) =====
    var _FORM = null;
    function formIndexKur() {
        _FORM = {};
        (RESULTS || []).forEach(function (r) {
            var an = normalizeText(r.a), bn = normalizeText(r.b), t = r.tarih + (r.saat || '');
            (_FORM[an] = _FORM[an] || []).push({ t: t, win: r.as > r.bs });
            (_FORM[bn] = _FORM[bn] || []).push({ t: t, win: r.bs > r.as });
        });
        Object.keys(_FORM).forEach(function (k) {
            _FORM[k].sort(function (a, b) { return a.t.localeCompare(b.t); });
        });
    }
    function takimForm(ad) {
        if (_FORM === null) formIndexKur();
        return (_FORM[normalizeText(ad)] || []).slice(-5); // son 5, eski -> yeni
    }

    // ===== TAKIM ARAMA =====
    function normalizeText(str) {
        var map = {'İ':'I','Ş':'S','Ğ':'G','Ü':'U','Ö':'O','Ç':'C',
                   'ı':'I','ş':'S','ğ':'G','ü':'U','ö':'O','ç':'C','i':'I'};
        return str.replace(/[İŞĞÜÖÇışğüöçi]/g, function(c){ return map[c] || c; }).toUpperCase();
    }

    // ===== TAKIM ADI EŞLEŞTIRME (kaynaklar arası isim farklarını köprüle) =====
    // Maç takvimi Google Sheets'ten (elle yazılmış isimler), puan/sonuçlar TBF
    // API'den (resmi isimler) geliyor. Aynı takım farklı yazılabiliyor:
    // "İSTANBUL MARMARA S.K (A)" ↔ "MARMARA SPOR (A)". Token tabanlı bulanık
    // eşleştirme (Jaccard ≥ 0.5 + grup harfi kapısı) ile aynı kulübü yakalarız.
    var _TAKIM_STOP = { SK:1, S:1, K:1, SPOR:1, KULUBU:1, KULUB:1, KULUP:1,
                        BASKETBOL:1, BSK:1, BK:1, SPORTU:1, SPORTIF:1, VE:1 };
    var _kanonMemo = {};
    function takimKanon(ad) {
        var key = String(ad == null ? '' : ad);
        if (_kanonMemo[key]) return _kanonMemo[key];
        var n = normalizeText(key);
        var grp = '';
        var mg = n.match(/\(([A-Z0-9])\)\s*$/);   // sondaki (A)/(B)/(1) grup harfi
        if (mg) grp = mg[1];
        n = n.replace(/\([^)]*\)/g, ' ').replace(/[^A-Z0-9]+/g, ' ');
        var toks = {}, arr = n.split(' '), nt = 0;
        for (var i = 0; i < arr.length; i++) {
            var t = arr[i];
            if (t && !_TAKIM_STOP[t] && !toks[t]) { toks[t] = 1; nt++; }
        }
        var res = { toks: toks, grp: grp, n: nt };
        _kanonMemo[key] = res;
        return res;
    }
    // İki ad aynı kulübü mü gösteriyor? Yanlış eşleşme boş profilden kötü olduğu
    // için eşik muhafazakar (0.5) ve grup harfleri çelişirse asla eşleşmez.
    function ayniTakim(a, b) {
        var ka = takimKanon(a), kb = takimKanon(b);
        if (!ka.n || !kb.n) return false;
        if (ka.grp && kb.grp && ka.grp !== kb.grp) return false;
        var inter = 0, t;
        for (t in ka.toks) { if (kb.toks[t]) inter++; }
        if (!inter) return false;
        return (inter / (ka.n + kb.n - inter)) >= 0.5;
    }

    // Arama sonuç stilleri — bir kez inject edilir
    function injectAramaStil() {
        if (document.getElementById('aramaSt')) return;
        var s = document.createElement('style');
        s.id = 'aramaSt';
        s.textContent = [
            /* ---- ozet banner ---- */
            '.ar-ozet{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:20px;}',
            '.ar-ozet-ic{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#1e293b,#162032);',
            'border:1px solid #334155;border-radius:50px;padding:10px 24px;}',
            '.ar-ozet-top{font-size:0.82rem;color:#94a3b8;letter-spacing:0.3px;}',
            '.ar-ozet-badge{background:linear-gradient(135deg,#ff4d05,#ff7738);color:white;font-size:0.78rem;font-weight:800;',
            'padding:3px 12px;border-radius:20px;}',
            /* ---- gun grubu ---- */
            '.ar-gun{margin-bottom:14px;border-radius:20px;overflow:hidden;',
            'border:1px solid #1e3a5f;box-shadow:0 4px 24px rgba(0,0,0,0.35);transition:box-shadow 0.2s;}',
            '.ar-gun:hover{box-shadow:0 8px 32px rgba(0,0,0,0.5);}',
            /* ---- gun baslik ---- */
            '.ar-gun-hdr{display:flex;align-items:center;justify-content:space-between;',
            'padding:18px 28px;background:linear-gradient(90deg,#1e3050 0%,#1a2740 100%);',
            'border-bottom:1px solid #1e3a5f;}',
            '.ar-gun-sol{display:flex;align-items:center;gap:16px;}',
            '.ar-gun-bar{width:4px;border-radius:3px;height:38px;flex-shrink:0;}',
            '.ar-gun-tarih{font-size:1.05rem;font-weight:800;color:#f1f5f9;letter-spacing:-0.2px;}',
            '.ar-gun-sayi{display:inline-flex;align-items:center;gap:5px;',
            'background:rgba(255,255,255,0.06);border-radius:20px;padding:4px 12px;',
            'font-size:0.75rem;font-weight:700;color:#64748b;}',
            /* ---- satır ---- */
            '.ar-satir{display:flex;align-items:stretch;border-bottom:1px solid #0d1826;',
            'min-height:76px;transition:background 0.15s;}',
            '.ar-satir:last-child{border-bottom:none;}',
            '.ar-satir:hover{background:rgba(255,255,255,0.03);}',
            /* saat */
            '.ar-saat{flex:0 0 110px;display:flex;flex-direction:column;align-items:center;justify-content:center;',
            'gap:3px;border-right:1px solid #0d1826;padding:0 12px;}',
            '.ar-saat-val{font-size:1.05rem;font-weight:900;letter-spacing:0.5px;}',
            '.ar-saat-ico{font-size:0.7rem;opacity:0.4;}',
            /* orta */
            '.ar-orta{flex:1;display:flex;align-items:center;gap:0;min-width:0;}',
            '.ar-takim{flex:1;display:flex;align-items:center;min-width:0;padding:0 20px;}',
            '.ar-takim-a{justify-content:flex-end;}',
            '.ar-takim-b{justify-content:flex-start;}',
            '.ar-takim-isim{font-size:1rem;font-weight:700;color:#e2e8f0;',
            'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.ar-vs{flex:0 0 52px;display:flex;align-items:center;justify-content:center;}',
            '.ar-vs-ic{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
            'background:#0a1628;border:1.5px solid #1e3050;',
            'font-size:0.65rem;font-weight:900;color:#2d4060;letter-spacing:1px;}',
            /* meta */
            '.ar-meta{flex:0 0 230px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;',
            'gap:7px;padding:14px 24px 14px 14px;border-left:1px solid #0d1826;}',
            '.ar-rozet{font-size:0.74rem;font-weight:800;padding:4px 14px;border-radius:20px;white-space:nowrap;}',
            '.ar-salon{font-size:0.72rem;color:#3d5068;text-align:right;',
            'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px;}',
            '.ar-salon::before{content:"📍 ";font-size:0.65rem;}',
            '.ar-grup{font-size:0.68rem;font-weight:700;padding:2px 10px;border-radius:8px;',
            'background:#0f1929;color:#475569;border:1px solid #1e293b;}',
            /* bos sonuc */
            '.ar-bos{text-align:center;padding:60px 20px;}',
            '.ar-bos-ico{font-size:3rem;margin-bottom:16px;}',
            '.ar-bos-txt{font-size:1rem;font-weight:700;color:#475569;margin-bottom:6px;}',
            '.ar-bos-alt{font-size:0.85rem;color:#334155;}',
            /* mobil */
            '@media(max-width:768px){',
            '.ar-satir{flex-direction:column;align-items:stretch;gap:10px;padding:13px 15px;min-height:0;}',
            '.ar-saat{flex:none;flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;border-right:none;padding:0;}',
            '.ar-saat-val{font-size:0.95rem;}',
            '.ar-saat-ico{display:inline;font-size:0.8rem;opacity:0.55;}',
            '.ar-orta{flex:none;width:100%;}',
            '.ar-takim{padding:0 6px;}',
            '.ar-takim-isim{font-size:0.9rem;white-space:normal;}',
            '.ar-vs{flex:0 0 42px;}',
            '.ar-vs-ic{width:30px;height:30px;font-size:0.55rem;}',
            '.ar-meta{display:flex;flex:none;width:100%;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:8px;border-left:none;border-top:1px solid #0d1826;padding:10px 0 0;}',
            '.ar-rozet{font-size:0.7rem;padding:3px 11px;}',
            '.ar-salon{max-width:none;text-align:left;font-size:0.8rem;}',
            '.ar-gun-hdr{padding:12px 16px;}',
            '.ar-gun-tarih{font-size:0.88rem;}',
            '}'
        ].join('');
        document.head.appendChild(s);
    }

    function takimArama(val) {
        var silBtn = document.getElementById('takimAramaSil');
        var sonucDiv = document.getElementById('takimAramaSonuc');
        var katFiltre = document.getElementById('katFiltre');
        var macListesi = document.getElementById('macListesi');
        var macYok = document.getElementById('macYok');
        var placeholder = document.getElementById('macSecilmedi');

        if (!val || val.trim().length < 2) {
            silBtn.style.display = 'none';
            sonucDiv.style.display = 'none';
            sonucDiv.innerHTML = '';
            katFiltre.style.display = '';
            macListesi.style.display = '';
            if (macYok) macYok.style.display = 'none';
            if (placeholder) placeholder.style.display = 'block';
            return;
        }
        if (placeholder) placeholder.style.display = 'none';

        injectAramaStil();
        silBtn.style.display = 'block';
        var q = normalizeText(val.trim());

        var eslesen = MACLAR.filter(function(m) {
            return normalizeText(m.a).indexOf(q) !== -1 || normalizeText(m.b).indexOf(q) !== -1;
        });

        katFiltre.style.display = 'none';
        macListesi.style.display = 'none';
        if (macYok) macYok.style.display = 'none';

        sonucDiv.style.display = 'block';
        sonucDiv.innerHTML = '';

        if (eslesen.length === 0) {
            sonucDiv.innerHTML =
                '<div class="ar-bos">' +
                    '<div class="ar-bos-ico">🔍</div>' +
                    '<div class="ar-bos-txt">Eşleşen maç bulunamadı</div>' +
                    '<div class="ar-bos-alt">"' + val + '" için sonuç yok — farklı bir takım adı deneyin</div>' +
                '</div>';
            return;
        }

        var gruplar = {};
        eslesen.forEach(function(m) {
            if (!gruplar[m.tarih]) gruplar[m.tarih] = [];
            gruplar[m.tarih].push(m);
        });
        var tarihler = Object.keys(gruplar).sort();

        // Özet banner
        var ozet = document.createElement('div');
        ozet.className = 'ar-ozet';
        ozet.innerHTML =
            '<div class="ar-ozet-ic">' +
                '<span class="ar-ozet-badge">' + eslesen.length + ' maç</span>' +
                '<span class="ar-ozet-top">' + tarihler.length + ' farklı günde bulundu</span>' +
            '</div>';
        sonucDiv.appendChild(ozet);

        tarihler.forEach(function(t) {
            var maclar = gruplar[t].sort(function(a, b) { return a.saat.localeCompare(b.saat); });
            var ilk = maclar[0];
            var gunRenk = '#ff4d05';

            var gun = document.createElement('div');
            gun.className = 'ar-gun';

            // Gün başlığı
            var hdr = document.createElement('div');
            hdr.className = 'ar-gun-hdr';
            hdr.innerHTML =
                '<div class="ar-gun-sol">' +
                    '<div class="ar-gun-bar" style="background:' + gunRenk + ';box-shadow:0 0 8px ' + gunRenk + '66;"></div>' +
                    '<div>' +
                        '<div class="ar-gun-tarih">🗓 ' + ilk.gun + ' — ' + ilk.td + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ar-gun-sayi">🏀 ' + maclar.length + ' maç</div>';
            gun.appendChild(hdr);

            maclar.forEach(function(m) {
                var kr = getKatRenk(m.kat);
                var satir = document.createElement('div');
                satir.className = 'ar-satir';
                satir.innerHTML =
                    '<div class="ar-saat" style="background:linear-gradient(180deg,' + kr + '0a 0%,transparent 100%);">' +
                        '<span class="ar-saat-val" style="color:' + kr + ';">' + m.saat + '</span>' +
                        '<span class="ar-saat-ico">⏱</span>' +
                    '</div>' +
                    '<div class="ar-orta">' +
                        '<div class="ar-takim ar-takim-a">' +
                            '<span class="ar-takim-isim puan-takim-link" onclick="showTakimProfil(\'' + takimAttr(m.a) + '\')">' + puanEsc(m.a) + '</span>' +
                        '</div>' +
                        '<div class="ar-vs"><div class="ar-vs-ic">VS</div></div>' +
                        '<div class="ar-takim ar-takim-b">' +
                            '<span class="ar-takim-isim puan-takim-link" onclick="showTakimProfil(\'' + takimAttr(m.b) + '\')">' + puanEsc(m.b) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ar-meta">' +
                        '<span class="ar-rozet" style="color:' + kr + ';border:1px solid ' + kr + '44;background:' + kr + '18;">' + puanEsc(m.kat) + '</span>' +
                        '<div class="ar-salon">' + puanEsc(m.salon) + '</div>' +
                        (m.grup ? '<span class="ar-grup">' + puanEsc(m.grup) + '</span>' : '') +
                    '</div>';
                gun.appendChild(satir);
            });

            sonucDiv.appendChild(gun);
        });
    }

    function takimAramaTemizle() {
        var input = document.getElementById('takimAramaInput');
        input.value = '';
        takimArama('');
        input.focus();
    }

        // STATE
        var state = {
            days: null, duration: 60,
            sports: [], level: null, goal: null, equip: []
        };

        // MODAL OPEN / CLOSE
        function openModal() {
            document.getElementById('programModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('programModal').classList.remove('active');
            document.body.style.overflow = '';
        }

        document.getElementById('programModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });

        // STEP NAVİGASYON
        function goStep(n) {
            document.querySelectorAll('.form-step').forEach(function(s) { s.classList.remove('active'); });
            document.getElementById('step-' + n).classList.add('active');

            for (var i = 1; i <= 4; i++) {
                var dot = document.getElementById('dot-' + i);
                dot.classList.remove('active', 'done');
                if (i < n) dot.classList.add('done');
                else if (i === n) dot.classList.add('active');
            }

            for (var j = 1; j <= 3; j++) {
                var line = document.getElementById('line-' + j);
                line.classList.toggle('done', j < n);
            }

            if (n === 4) buildSummary();
        }

        // GÜN SEÇİMİ
        function toggleDay(btn, val) {
            document.querySelectorAll('.day-btn').forEach(function(b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
            state.days = val;
            document.getElementById('next-1').disabled = false;
        }

        // SÜRE
        function updateDuration(val) {
            state.duration = parseInt(val);
            document.getElementById('durationVal').textContent = val + ' dakika';
            var pct = ((val - 20) / (120 - 20)) * 100;
            document.getElementById('durationSlider').style.background =
                'linear-gradient(to right, #ff4d05 0%, #ff4d05 ' + pct + '%, #334155 ' + pct + '%, #334155 100%)';
        }

        // SPOR SEÇİMİ
        function toggleSport(card, sport) {
            card.classList.toggle('selected');
            if (card.classList.contains('selected')) {
                state.sports.push(sport);
            } else {
                state.sports = state.sports.filter(function(s) { return s !== sport; });
            }
            document.getElementById('next-2').disabled = state.sports.length === 0;
        }

        // TEK SEÇİMLİ PILL
        function selectPill(btn, type, val) {
            btn.closest('.option-pills').querySelectorAll('.pill').forEach(function(p) { p.classList.remove('selected'); });
            btn.classList.add('selected');
            state[type] = val;
            checkStep3();
        }

        // ÇOK SEÇİMLİ EKİPMAN
        function toggleEquip(btn, val) {
            btn.classList.toggle('selected');
            if (btn.classList.contains('selected')) {
                state.equip.push(val);
            } else {
                state.equip = state.equip.filter(function(e) { return e !== val; });
            }
            checkStep3();
        }

        function checkStep3() {
            document.getElementById('next-3').disabled = !(state.level && state.goal);
        }

        // ÖZET
        function buildSummary() {
            var badges = document.getElementById('summaryBadges');
            badges.innerHTML = [
                { label: '📅 ' + state.days + ' gün/hafta', cls: 'badge-orange' },
                { label: '⏱ ' + state.duration + ' dk/seans', cls: 'badge-blue' },
                { label: '🏅 ' + state.sports.join(', '), cls: 'badge-purple' },
                { label: '📊 ' + state.level, cls: 'badge-green' },
                { label: '🎯 ' + state.goal, cls: 'badge-orange' },
                { label: '🏟 ' + (state.equip.length > 0 ? state.equip.join(', ') : 'Belirtilmedi'), cls: 'badge-blue' }
            ].map(function(b) {
                return '<span class="badge ' + b.cls + '">' + b.label + '</span>';
            }).join('');
        }

        // PROGRAM OLUŞTURMA
        function generateProgram() {
            document.querySelector('#step-4 .modal-actions').style.display = 'none';
            var result = document.getElementById('programResult');
            result.classList.add('active');
            document.getElementById('loadingDots').style.display = 'block';
            document.getElementById('programOutput').style.display = 'none';

            setTimeout(function() {
                var program = buildWeeklyProgram();
                renderProgram(program);
                document.getElementById('loadingDots').style.display = 'none';
                document.getElementById('programOutput').style.display = 'block';
            }, 1800);
        }

        function buildWeeklyProgram() {
            var allDays = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
            var selected = [];
            var step = Math.floor(7 / state.days);
            for (var i = 0; i < state.days; i++) {
                selected.push(allDays[Math.min(i * step, 6)]);
            }

            var sportDB = {
                'Basketbol': {
                    'Başlangıç': ['Top kontrolü: crossover ve between legs (15 dk)', 'Serbest atış: her noktadan 20 şut (20 dk)', '1v1 defans duruşu egzersizleri (15 dk)', 'Soğuma koşusu ve esneme (10 dk)'],
                    'Orta Seviye': ['Ball handling mekiği + zayıf el çalışması (15 dk)', '3 noktadan catch & shoot (20 dk)', 'Pick & roll offense drills (15 dk)', 'HIIT kondisyon seti: 4x (sprint + merdiven) (10 dk)'],
                    'İleri Seviye': ['Off-ball hareket ve cutting drills (15 dk)', '5 spot shooting: her spottan 30 şut (20 dk)', 'Drive & dish karar drilleri (15 dk)', 'Patlayıcı plyometric set (10 dk)'],
                    'Profesyonel': ['Film çalışması + pozisyon odaklı drill (15 dk)', 'Full court press breaker çalışması (20 dk)', 'Bireysel ISO seti (15 dk)', 'Dikey atlama & sprint protokolü (10 dk)']
                },
                'Futbol': {
                    'Başlangıç': ['Top sürme: slalom koniler (15 dk)', 'Duvar pası: her ayak 50 tekrar (15 dk)', 'Şut tekniği: penaltı noktasından 30 şut (15 dk)', 'Hafif tempo koşu + esneme (15 dk)'],
                    'Orta Seviye': ['Çift ayak kısa pas kombinasyonu (15 dk)', '1v1 hücum mekiği (15 dk)', 'Uzak mesafe şut + kafa vuruşu (15 dk)', '3x 30m sprint + dinlenme (15 dk)'],
                    'İleri Seviye': ['Yüksek tempo rondo çalışması (15 dk)', 'Overload pressing drill (15 dk)', 'Çapraz geçiş ve orta + bitiriş (15 dk)', 'Dayanıklılık interval koşusu (15 dk)'],
                    'Profesyonel': ['Taktik pozisyon drilli (15 dk)', 'Dead ball set piece çalışması (15 dk)', 'Yüksek yoğunluklu SSG 3v3 (15 dk)', 'Hız & güç kompleks seti (15 dk)']
                },
                'Fitness': {
                    'Başlangıç': ['Isınma: 10 dk hafif kardiyo', 'Squat 3x12, Push-up 3x10', 'Plank 3x30sn, Lunges 3x10', 'Soğuma & esneme 10 dk'],
                    'Orta Seviye': ['Compound hareketler: Deadlift + Bench 4x8', 'Süperset: Pull-up + Dip 4x6', 'Core devre: 3 tur (abs, oblique, lower back)', 'Finisher: 10 dk AMRAP'],
                    'İleri Seviye': ['Push/Pull split: ağır compound set', 'Olimpik kaldırışlar: hang clean 4x5', 'Plyometric tabata (8 tur)', 'Mobility & rotator cuff çalışması'],
                    'Profesyonel': ['Periyodizasyon: yoğunluk bloğu', 'Maksimum kuvvet: 5x3 @ %90', 'Kontrastlı treni (ağır + patlayıcı)', 'Aktif toparlanma protokolü']
                },
                'Koşu': {
                    'Başlangıç': ['5 dk yürüyüş ısınma', 'Koşu/yürüyüş aralıkları: 20 dk (1 dk koş, 2 dk yürü)', 'Soğuma yürüyüşü 5 dk', 'Baldır & uyluk esneme 10 dk'],
                    'Orta Seviye': ['10 dk kolay tempo koşu ısınma', 'Tempo run: 20 dk eşik hızında', '4x200m sprint + dinlenme', 'Soğuma koşusu & esneme'],
                    'İleri Seviye': ['15 dk kolay jogging', 'Yokuş intervalları: 8x (30sn çıkış + geri yürüyüş)', 'Fartlek 15 dk', 'Dinamik esneme & foam roller'],
                    'Profesyonel': ['30 dk aerobik baz koşusu', 'VO2max interval: 5x3 dk @ %95 + 3 dk dinlenme', 'Stride drills: 6x80m', 'Toparlanma protokolü']
                }
            };

            var restLabel = 'Dinlenme & Aktif Toparlanma';
            var restItems = ['Hafif yürüyüş veya bisiklet (20-30 dk)', 'Foam roller: bacak + sırt (15 dk)', 'Statik esneme serisi (10 dk)', 'Bol su & protein alımına dikkat'];

            var levelKey = state.level;
            var program = [];

            for (var i = 0; i < 7; i++) {
                var dayName = allDays[i];
                var isWorkout = selected.indexOf(dayName) !== -1;

                if (isWorkout) {
                    var sportIdx = Math.floor(i * state.sports.length / state.days) % state.sports.length;
                    var sport = state.sports[sportIdx] || state.sports[0];
                    var exercises = (sportDB[sport] && sportDB[sport][levelKey])
                        ? sportDB[sport][levelKey]
                        : ['Isınma: 10 dk dinamik esneme', 'Ana çalışma: ' + sport + ' teknik drilleri (' + Math.floor(state.duration * 0.6) + ' dk)', 'Kondisyon: interval koşu (' + Math.floor(state.duration * 0.25) + ' dk)', 'Soğuma & esneme (' + Math.floor(state.duration * 0.15) + ' dk)'];

                    program.push({ day: dayName, type: sport, items: exercises, isRest: false });
                } else {
                    program.push({ day: dayName, type: restLabel, items: restItems, isRest: true });
                }
            }

            return program;
        }

        function renderProgram(program) {
            var container = document.getElementById('programDays');
            container.innerHTML = program.map(function(p) {
                return '<div class="program-day" style="' + (p.isRest ? 'border-left-color:#2ecc71' : '') + '">' +
                    '<h4>' + p.day + ' — ' + p.type + '</h4>' +
                    '<ul>' + p.items.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
                    '</div>';
            }).join('');
        }

        // SIFIRLA
        function resetModal() {
            state = { days: null, duration: 60, sports: [], level: null, goal: null, equip: [] };
            document.querySelectorAll('.day-btn, .sport-card, .pill').forEach(function(el) { el.classList.remove('selected'); });
            document.getElementById('durationSlider').value = 60;
            document.getElementById('durationVal').textContent = '60 dakika';
            document.querySelector('#step-4 .modal-actions').style.display = 'flex';
            document.getElementById('programResult').classList.remove('active');
            document.getElementById('next-1').disabled = true;
            document.getElementById('next-2').disabled = true;
            document.getElementById('next-3').disabled = true;
            goStep(1);
        }
    // ===== DİYET KİŞİSELLEŞTİRME =====
    var dState = { goal: null, act: null };

    function dSelect(btn, key, val) {
        btn.closest('div').querySelectorAll('.dpill').forEach(function(b) { b.classList.remove('dsel'); });
        btn.classList.add('dsel');
        dState[key] = val;
    }

    function calcDiet() {
        var age    = parseInt(document.getElementById('dAge').value);
        var weight = parseInt(document.getElementById('dWeight').value);
        var height = parseInt(document.getElementById('dHeight').value);
        var gender = document.getElementById('dGender').value;
        var err    = document.getElementById('dietErr');

        if (!age || !weight || !height || !gender || !dState.goal || !dState.act) {
            err.style.display = 'block'; return;
        }
        err.style.display = 'none';

        // Mifflin-St Jeor BMR
        var bmr = gender === 'male'
            ? (10 * weight) + (6.25 * height) - (5 * age) + 5
            : (10 * weight) + (6.25 * height) - (5 * age) - 161;

        var tdee = Math.round(bmr * parseFloat(dState.act));
        var goalAdj = { 'kilo-ver': -400, 'koru': 0, 'kas-yap': 350, 'performans': 250 };
        var target = tdee + goalAdj[dState.goal];

        // Makro dağılım
        var proteinRatio = dState.goal === 'kas-yap' ? 0.30 : (dState.goal === 'performans' ? 0.25 : 0.28);
        var fatRatio     = 0.25;
        var carbRatio    = 1 - proteinRatio - fatRatio;

        var protein = Math.round((target * proteinRatio) / 4);
        var fat     = Math.round((target * fatRatio)     / 9);
        var carbs   = Math.round((target * carbRatio)    / 4);

        // İstatistik kartları
        var statsEl = document.getElementById('dietStats');
        statsEl.innerHTML = [
            { val: target + ' kcal', lbl: 'Günlük Kalori' },
            { val: protein + 'g',    lbl: 'Protein' },
            { val: carbs + 'g',      lbl: 'Karbonhidrat' },
            { val: fat + 'g',        lbl: 'Yag' },
            { val: Math.round(weight * 0.033) + 'L', lbl: 'Su' }
        ].map(function(s) {
            return '<div class="stat-card"><div class="stat-val">' + s.val + '</div><div class="stat-lbl">' + s.lbl + '</div></div>';
        }).join('');

        // Ogun planları
        var meals = buildMeals(target, weight, dState.goal);
        var mealsEl = document.getElementById('dietMeals');
        mealsEl.innerHTML = meals.map(function(m) {
            return '<div class="card"><h3>' + m.title + '</h3>' +
                '<p style="color:#94a3b8;font-size:0.8rem;margin-bottom:10px;">' + m.kcal + ' kcal</p>' +
                '<ul style="list-style:none;">' +
                m.items.map(function(i) { return '<li style="padding:4px 0;border-bottom:1px solid #334155;font-size:0.88rem;">▸ ' + i + '</li>'; }).join('') +
                '</ul></div>';
        }).join('');

        // Sporcu notları
        var goal = dState.goal;
        var notesEl = document.getElementById('dietNotes');
        if (notesEl) {
            var tips = {
                'kilo-ver': ['🔥 Kalori açığı max 500 kcal/gün — daha fazlası kas kaybına yol açar',
                              '⏰ Aralıklı oruç (16:8) uygulanabilir, antrenman zamanını pencere içine al',
                              '🥦 Her öğünde sebze ekle — lif tokluk sağlar ve sindirimi destekler',
                              '💧 Su tüketimi kritik: öğün öncesi 1 bardak su iştahı azaltır'],
                'koru': ['⚖️ Günlük kaloriyi mümkün olduğunca sabit tut, haftalık ortalamayı takip et',
                          '📊 Her 2 haftada ölçüm al — kilo değişmediğinde kas-yağ oranı değişiyor olabilir',
                          '🔄 Karbonhidrat döngüsü: antrenman günleri +200 kcal, dinlenme günleri -100 kcal'],
                'kas-yap': ['📈 Kalori fazlası 250-350 kcal/gün tutulmalı — fazlası yağlanmaya yol açar',
                             '💉 Antrenman sonrası 30dk içinde protein + karbonhidrat tüket (anabolik pencere)',
                             '😴 Uyku en az 8 saat — büyüme hormonu derin uyku sırasında salgılanır',
                             '⚖️ Her öğünde protein hedefi: ağırlık × 0.4-0.5g'],
                'performans': ['⚡ Maç/yarış öncesi gece karbonhidrat yükle (pasta, pirinç, ekmek)',
                                '🏃 Antrenman sırasında her 20-30 dakikada 100-150 kcal karbonhidrat',
                                '🫐 Antioksidan gıdalar (yaban mersini, kiraz) toparlanmayı hızlandırır',
                                '☕ Kafein: 3-6mg/kg, antrenman 45-60dk öncesi (maksimum etki)']
            };
            var goalTips = tips[goal] || tips['koru'];
            notesEl.innerHTML = '<h3 style="color:#ff4d05;margin-bottom:12px;">💡 Beslenme İpuçları</h3>' +
                '<ul style="list-style:none;">' +
                goalTips.map(function(t) {
                    return '<li style="padding:7px 0;border-bottom:1px solid #1e293b;font-size:0.87rem;color:#cbd5e1;">' + t + '</li>';
                }).join('') + '</ul>';
        }

        document.getElementById('dietForm').style.display = 'none';
        document.getElementById('dietResult').style.display = 'block';
        document.getElementById('dietResult').scrollIntoView({ behavior: 'smooth' });
    }

    function buildMeals(total, weight, goal) {
        var prot = Math.round(weight * (goal === 'kas-yap' ? 2.2 : 1.8));
        var dist = [0.25, 0.30, 0.10, 0.25, 0.10];
        var names = ['Sabah Kahvaltisi', 'Ogle Yemegi', 'Ara Ogun', 'Aksam Yemegi', 'Gece Sonrasi'];

        var items = {
            'Sabah Kahvaltisi': [
                '3 yumurta beyazi + 1 sari',
                Math.round(50 + (weight-60)*0.3) + 'gr yulaf ezme',
                '1 muz veya 150gr cilek',
                '5 adet badem/ceviz',
                '1 bardak sut veya bitki cayi'
            ],
            'Ogle Yemegi': [
                Math.round(prot * 0.35) + 'gr tavuk gogsu / ton balik',
                Math.round(80 + (weight-60)*0.5) + 'gr esmer pirinc/bulgur',
                'Bol yesillikli salata (zeytinyagi)',
                '1 dilim tam bugday ekmegi'
            ],
            'Ara Ogun': goal === 'kilo-ver'
                ? ['1 elma + 10 badem', '200gr yogurt (az yagli)']
                : ['1 muz + protein shake', '2 tam bugday galeta + lor peyniri'],
            'Aksam Yemegi': [
                Math.round(prot * 0.30) + 'gr salmon / izgara et',
                '200gr buharda sebze (brokoli, kabak)',
                '1 tatli kasigi zeytinyagi',
                '200gr lor peyniri veya cacik'
            ],
            'Gece Sonrasi': goal === 'kas-yap'
                ? ['200gr az yagli sut', '1 kase sut bazli protein', '5 adet badem']
                : ['1 bardak papatya cayi', '150gr yogurt', '1 cay kasigi bal']
        };

        return names.map(function(name, i) {
            return {
                title: name,
                kcal: Math.round(total * dist[i]),
                items: items[name]
            };
        });
    }


    // SPOR PLAN SEKMELERİ
    function showSportPlan(btn, sport, level) {
        // Aynı spor grubundaki tüm butonları sıfırla
        btn.closest('.sport-tab-btns').querySelectorAll('.stab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // Aynı spor dalına ait planları bul ve gizle
        var prefix = sport + '-';
        document.querySelectorAll('.sport-plan').forEach(function(el) {
            if (el.id.startsWith(prefix)) el.style.display = 'none';
        });
        // Seçilen planı göster
        var target = document.getElementById(sport + '-' + level);
        if (target) target.style.display = 'block';

        // Spor dalına göre PDF butonlarını güncelle
        var pdfConfigs = {
            'bball': {
                ids: ['bball-pdf-baslangic','bball-pdf-ort','bball-pdf-ilr','bball-pdf-pro'],
                map: { 'bslt': 'bball-pdf-baslangic', 'bort': 'bball-pdf-ort', 'bilr': 'bball-pdf-ilr', 'bpro': 'bball-pdf-pro' }
            },
            'fit': {
                ids: ['fit-pdf-baslangic','fit-pdf-ort','fit-pdf-ilr','fit-pdf-pro'],
                map: { 'fbslt2': 'fit-pdf-baslangic', 'fort2': 'fit-pdf-ort', 'filr2': 'fit-pdf-ilr', 'fpro2': 'fit-pdf-pro' }
            },
            'foot': {
                ids: ['foot-pdf-baslangic','foot-pdf-ort','foot-pdf-ilr','foot-pdf-pro'],
                map: { 'fbslt': 'foot-pdf-baslangic', 'fort': 'foot-pdf-ort', 'filr': 'foot-pdf-ilr', 'fpro': 'foot-pdf-pro' }
            },
            'run': {
                ids: ['run-pdf-baslangic','run-pdf-ort','run-pdf-ilr','run-pdf-pro'],
                map: { 'rbslt': 'run-pdf-baslangic', 'rort': 'run-pdf-ort', 'rilr': 'run-pdf-ilr', 'rpro': 'run-pdf-pro' }
            },
            'voley': {
                ids: ['vol-pdf-baslangic','vol-pdf-ort','vol-pdf-ilr','vol-pdf-pro'],
                map: { 'vbslt': 'vol-pdf-baslangic', 'vort': 'vol-pdf-ort', 'vilr': 'vol-pdf-ilr', 'vpro': 'vol-pdf-pro' }
            }
        };
        if (pdfConfigs[sport]) {
            var cfg = pdfConfigs[sport];
            cfg.ids.forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            var activeBtn = document.getElementById(cfg.map[level]);
            if (activeBtn) activeBtn.style.display = 'inline-flex';
        }
    }

    // DİYET SEKMELERİ
    function showDietTab(tab, btn) {
        document.querySelectorAll('.diet-tab').forEach(function(b) { b.classList.remove('active'); });
        var aktif = btn || (window.event && window.event.target);
        if (aktif && aktif.classList) aktif.classList.add('active');

        var tabs = ['ogunler', 'takviye', 'tarifler'];
        tabs.forEach(function(t) {
            var el = document.getElementById('diet-tab-' + t);
            if (el) el.style.display = (t === tab) ? 'block' : 'none';
        });
    }

    // ÖĞÜN PLAN SEKMELERİ
    function showMealPlan(planId, btn) {
        document.querySelectorAll('.meal-tab').forEach(function(b) { b.classList.remove('active'); });
        var aktif = btn || (window.event && window.event.target);
        if (aktif && aktif.classList) aktif.classList.add('active');

        document.querySelectorAll('.meal-plan-content').forEach(function(el) {
            el.style.display = 'none';
        });
        var target = document.getElementById(planId);
        if (target) target.style.display = 'block';
    }
    // ===== BMI & VÜCUT YAĞ ORANI =====
    function toggleHipField() {
        var g = document.getElementById('bfGender').value;
        var wrap = document.getElementById('hipFieldWrap');
        var wh = document.getElementById('waistHint');
        if (g === 'female') { wrap.style.display = 'block'; wh.textContent = 'Kadın: belin en ince yerinden.'; }
        else { wrap.style.display = 'none'; wh.textContent = 'Erkek: göbek deliği hizasından.'; }
    }

    function bmiCat(b) {
        if (b < 18.5) return { l: 'Zayıf', c: '#60a5fa' };
        if (b < 25)   return { l: 'Normal', c: '#2ecc71' };
        if (b < 30)   return { l: 'Fazla Kilolu', c: '#facc15' };
        if (b < 35)   return { l: 'Obez (Sınıf 1)', c: '#f97316' };
        return { l: 'Obez (Sınıf 2+)', c: '#ef4444' };
    }
    function bfCat(bf, gender) {
        var t = (gender === 'female')
            ? [{ m: 13, l: 'Esansiyel', c: '#60a5fa' }, { m: 20, l: 'Atletik', c: '#2ecc71' }, { m: 24, l: 'Fit', c: '#22c55e' }, { m: 31, l: 'Ortalama', c: '#facc15' }, { m: 999, l: 'Yüksek', c: '#ef4444' }]
            : [{ m: 5,  l: 'Esansiyel', c: '#60a5fa' }, { m: 13, l: 'Atletik', c: '#2ecc71' }, { m: 17, l: 'Fit', c: '#22c55e' }, { m: 24, l: 'Ortalama', c: '#facc15' }, { m: 999, l: 'Yüksek', c: '#ef4444' }];
        for (var i = 0; i < t.length; i++) { if (bf <= t[i].m) return t[i]; }
        return t[t.length - 1];
    }

    function calcBMIBF() {
        var g = document.getElementById('bfGender').value;
        var h = parseFloat(document.getElementById('bfHeight').value);
        var w = parseFloat(document.getElementById('bfWeight').value);
        var neck = parseFloat(document.getElementById('bfNeck').value);
        var waist = parseFloat(document.getElementById('bfWaist').value);
        var hip = parseFloat(document.getElementById('bfHip').value);
        var err = document.getElementById('bfErr');
        err.style.display = 'none';

        if (!h || !w || h < 100 || w < 25) {
            err.textContent = 'Lütfen geçerli boy ve kilo gir.';
            err.style.display = 'block';
            return;
        }

        var hm = h / 100;
        var bmi = w / (hm * hm);
        var bc = bmiCat(bmi);
        var hwMin = 18.5 * hm * hm, hwMax = 24.9 * hm * hm;
        var bmiPos = Math.max(2, Math.min(98, (bmi - 15) / (35 - 15) * 100));

        var html = '';
        html += '<div style="background:#1e293b;border:1px solid #334155;border-radius:18px;padding:24px;margin-bottom:18px;">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:6px;"><h3 style="font-family:\'Space Grotesk\',Inter,sans-serif;color:#fff;font-size:1.1rem;">Vücut Kitle İndeksi (BMI)</h3><span class="result-cat" style="background:' + bc.c + '22;color:' + bc.c + ';border:1px solid ' + bc.c + '55;">' + bmi.toFixed(1) + ' · ' + bc.l + '</span></div>';
        html += '<div class="meter"><div class="meter-marker" style="left:' + bmiPos + '%;"></div></div>';
        html += '<div class="meter-scale"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>35+</span></div>';
        html += '<p style="font-size:0.83rem;color:#94a3b8;margin-top:13px;">Boyuna göre sağlıklı kilo aralığı: <strong style="color:#2ecc71;">' + hwMin.toFixed(1) + '–' + hwMax.toFixed(1) + ' kg</strong></p>';
        html += '</div>';

        // US Navy vücut yağ oranı
        var bf = null;
        if (g && neck && waist) {
            var val = null;
            if (g === 'male') {
                if (waist - neck > 0) val = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
            } else if (hip) {
                if (waist + hip - neck > 0) val = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450;
            }
            if (val !== null && val > 2 && val < 70) bf = Math.round(val * 10) / 10;
        }

        if (bf !== null) {
            var fc = bfCat(bf, g);
            var lo = (g === 'female') ? 10 : 4, hi = (g === 'female') ? 45 : 40;
            var bfPos = Math.max(2, Math.min(98, (bf - lo) / (hi - lo) * 100));
            var fatMass = Math.round(w * bf / 100 * 10) / 10;
            var leanMass = Math.round((w - fatMass) * 10) / 10;
            html += '<div style="background:#1e293b;border:1px solid #334155;border-radius:18px;padding:24px;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:6px;"><h3 style="font-family:\'Space Grotesk\',Inter,sans-serif;color:#fff;font-size:1.1rem;">Vücut Yağ Oranı</h3><span class="result-cat" style="background:' + fc.c + '22;color:' + fc.c + ';border:1px solid ' + fc.c + '55;">%' + bf.toFixed(1) + ' · ' + fc.l + '</span></div>';
            html += '<div class="meter" style="background:linear-gradient(90deg,#60a5fa,#2ecc71 30%,#facc15 65%,#ef4444);"><div class="meter-marker" style="left:' + bfPos + '%;"></div></div>';
            html += '<div class="meter-scale"><span>%' + lo + '</span><span>Atletik</span><span>Fit</span><span>Ortalama</span><span>%' + hi + '+</span></div>';
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;"><div class="stat-card"><div class="stat-val" style="color:#f97316;">' + fatMass + ' kg</div><div class="stat-lbl">Yağ Kütlesi</div></div><div class="stat-card"><div class="stat-val" style="color:#2ecc71;">' + leanMass + ' kg</div><div class="stat-lbl">Yağsız Kütle</div></div></div>';
            html += '<p style="font-size:0.74rem;color:#5d6b82;margin-top:12px;">US Navy çevre ölçümü yöntemi · yaklaşık ±%3–4 doğruluk.</p>';
            html += '</div>';
        } else {
            var msg = (!g) ? 'Yağ oranı için cinsiyet seç ve mezura ölçümlerini gir.'
                : (g === 'female' && !hip ? 'Kadınlar için kalça çevresi ölçümü de gerekli.'
                : 'Yağ oranı için boyun ve bel çevresi ölçümlerini gir.');
            html += '<div style="background:rgba(15,23,42,0.6);border:1px dashed #475569;border-radius:18px;padding:20px;text-align:center;color:#94a3b8;font-size:0.88rem;">📏 ' + msg + '</div>';
        }

        var box = document.getElementById('bfResult');
        box.innerHTML = html;
        box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ===== PRATİK TARİF FİLTRESİ =====
    function filterRecipes(cat, btn) {
        document.querySelectorAll('.rfilter').forEach(function (b) { b.classList.remove('active'); });
        var aktif = btn || (window.event && window.event.target);
        if (aktif && aktif.classList) aktif.classList.add('active');
        document.querySelectorAll('#recipeGrid .recipe-card').forEach(function (c) {
            var cats = c.getAttribute('data-cat') || '';
            var show = (cat === 'hepsi') || (cats.indexOf(cat) > -1);
            c.style.display = show ? 'flex' : 'none';
        });
    }

    // ===== HESAPLAYICI HUB: alt sekme geçişi =====
    function showCalc(name, btn) {
        document.querySelectorAll('.calc-pick').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        document.querySelectorAll('#calcPanels .calc-panel').forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('data-calc') === name);
        });
    }

    // ===================== MAÇ PERFORMANSI =====================
    var PERF_KEY = 'baskeportal_performans_v1';

    function perfYukle() {
        try {
            var arr = JSON.parse(localStorage.getItem(PERF_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    }
    function perfKaydetStore(arr) {
        try { localStorage.setItem(PERF_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function perfNum(id) {
        var v = parseInt(document.getElementById(id).value, 10);
        return (isNaN(v) || v < 0) ? 0 : v;
    }
    function perfEsc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function perfVer(s) {
        return (s.sayi + s.ribaund + s.asist + s.calma + s.blok) - (s.kayip + s.faul);
    }
    function perfDerece(ver) {
        return Math.max(0, Math.min(100, Math.round(50 + ver * 1.8)));
    }
    function perfEtiket(d) {
        if (d >= 80) return { t: 'Mükemmel · MVP', c: '#f59e0b' };
        if (d >= 60) return { t: 'Çok İyi',        c: '#22c55e' };
        if (d >= 40) return { t: 'İyi',            c: '#38bdf8' };
        if (d >= 20) return { t: 'Orta',           c: '#a78bfa' };
        return { t: 'Gelişime Açık', c: '#94a3b8' };
    }
    function perfRozet(s) {
        // 10+ olan kategori sayısı: Sayı, Ribaund, Asist, Top Çalma, Blok
        var n = [s.sayi, s.ribaund, s.asist, s.calma, s.blok].filter(function (x) { return x >= 10; }).length;
        if (n >= 3) return 'Triple-Double';
        if (n === 2) return 'Double-Double';
        return '';
    }

    function perfOku() {
        return {
            sayi: perfNum('pfSayi'), ribaund: perfNum('pfRibaund'), asist: perfNum('pfAsist'),
            calma: perfNum('pfCalma'), blok: perfNum('pfBlok'), kayip: perfNum('pfKayip'), faul: perfNum('pfFaul'),
            rakip: (document.getElementById('pfRakip').value || '').trim(),
            lig: (document.getElementById('pfLig').value || '').trim(),
            tarih: document.getElementById('pfTarih').value || ''
        };
    }

    function perfMini(label, val) {
        return '<div class="stat-card"><div class="stat-val" style="font-size:1.35rem;">' + val + '</div><div class="stat-lbl">' + label + '</div></div>';
    }

    function perfOzetMetin(s, ver, d) {
        var line = '🏀 Maç Performansım: ' + s.sayi + ' sayı · ' + s.ribaund + ' rib · ' + s.asist + ' ast · ' +
            s.calma + ' çalma · ' + s.blok + ' blok · ' + s.kayip + ' kayıp · ' + s.faul + ' faul';
        line += '\n📊 Verimlilik: ' + ver + ' · Derece: ' + d + '/100';
        if (s.rakip) line += '\n🆚 ' + s.rakip;
        line += '\n— IST-BASKEPORTAL';
        return line;
    }

    function perfHesapla() {
        var err = document.getElementById('pfErr');
        err.style.display = 'none';
        var s = perfOku();
        var toplam = s.sayi + s.ribaund + s.asist + s.calma + s.blok + s.kayip + s.faul;
        if (toplam === 0) {
            err.textContent = 'Lütfen en az bir istatistik gir.';
            err.style.display = 'block';
            return null;
        }
        var ver = perfVer(s);
        var d = perfDerece(ver);
        var et = perfEtiket(d);
        var rozet = perfRozet(s);
        window._perfSonOzet = perfOzetMetin(s, ver, d);

        var html = '<div class="calc-result-card">' +
            '<div class="perf-grade-wrap">' +
                '<div style="text-align:center;"><div class="perf-ver" style="color:' + (ver >= 0 ? '#ff7849' : '#94a3b8') + ';">' + ver + '</div><div class="stat-lbl">Verimlilik</div></div>' +
                '<div style="text-align:center;"><div class="perf-grade-num" style="color:' + et.c + ';">' + d + '</div><div class="stat-lbl">Derece / 100</div></div>' +
                '<div style="text-align:center;min-width:120px;"><div class="perf-grade-lbl" style="color:' + et.c + ';">' + et.t + '</div>' +
                    (rozet ? '<div style="margin-top:10px;"><span class="perf-badge">⭐ ' + rozet + '</span></div>' : '') + '</div>' +
            '</div>' +
            '<div class="perf-avg-grid">' +
                perfMini('Sayı', s.sayi) + perfMini('Ribaund', s.ribaund) + perfMini('Asist', s.asist) +
                perfMini('Çalma', s.calma) + perfMini('Blok', s.blok) + perfMini('Kayıp', s.kayip) + perfMini('Faul', s.faul) +
            '</div>' +
            '<div class="perf-actions">' +
                '<button class="perf-btn2" onclick="perfKopyala()">📋 Özeti Kopyala</button>' +
                '<button class="perf-btn2" onclick="perfKaydet()">💾 Bu Maçı Kaydet</button>' +
            '</div>' +
            '</div>';
        var box = document.getElementById('perfResult');
        box.innerHTML = html; box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return s;
    }

    function perfKopyala() {
        var txt = window._perfSonOzet || '';
        if (!txt) return;
        function ok() {
            var b = document.querySelector('#perfResult .perf-btn2');
            if (b) { var o = b.textContent; b.textContent = '✓ Kopyalandı'; setTimeout(function () { b.textContent = o; }, 1600); }
        }
        function fallback() {
            try {
                var ta = document.createElement('textarea');
                ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.focus(); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
            } catch (e) {}
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).then(ok, function () { fallback(); ok(); });
        } else { fallback(); ok(); }
    }

    function perfKaydet() {
        var s = perfHesapla();
        if (!s) return;
        var ver = perfVer(s);
        var rec = {
            id: Date.now(),
            tarih: s.tarih || new Date().toISOString().slice(0, 10),
            rakip: s.rakip, lig: s.lig,
            sayi: s.sayi, ribaund: s.ribaund, asist: s.asist, calma: s.calma,
            kayip: s.kayip, blok: s.blok, faul: s.faul,
            ver: ver, derece: perfDerece(ver)
        };
        var arr = perfYukle();
        arr.push(rec);
        perfKaydetStore(arr);
        perfRenderGecmis();
        ['pfSayi', 'pfRibaund', 'pfAsist', 'pfCalma', 'pfBlok', 'pfKayip', 'pfFaul'].forEach(function (id) {
            document.getElementById(id).value = '';
        });
        var g = document.getElementById('perfGecmis');
        if (g) g.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function perfSil(id) {
        perfKaydetStore(perfYukle().filter(function (r) { return r.id !== id; }));
        perfRenderGecmis();
    }
    function perfTemizle() {
        if (!confirm('Tüm kayıtlı maçlar silinsin mi? Bu işlem geri alınamaz.')) return;
        perfKaydetStore([]);
        perfRenderGecmis();
    }

    function perfRenderGecmis() {
        var box = document.getElementById('perfGecmis');
        if (!box) return;
        var arr = perfYukle();
        if (!arr.length) {
            box.innerHTML = '<div class="calc-result-card" style="text-align:center;color:#94a3b8;">' +
                '<p style="margin:0;font-size:0.9rem;">Henüz kayıtlı maç yok. Yukarıdan istatistik girip <strong style="color:#cbd5e1;">“Maçı Kaydet”</strong> ile gelişimini takip etmeye başla.</p></div>';
            return;
        }
        var n = arr.length;
        function avg(k) { return arr.reduce(function (t, r) { return t + (r[k] || 0); }, 0) / n; }
        var bestVer = Math.max.apply(null, arr.map(function (r) { return r.ver; }));

        // Grafik: tarihe göre eskiden yeniye, son 12 maç
        var byDate = arr.slice().sort(function (a, b) {
            return a.tarih < b.tarih ? -1 : a.tarih > b.tarih ? 1 : a.id - b.id;
        });
        var sonlar = byDate.slice(-12);
        var maxAbs = Math.max.apply(null, sonlar.map(function (r) { return Math.abs(r.ver); }));
        if (!maxAbs) maxAbs = 1;
        var bars = sonlar.map(function (r) {
            var h = Math.max(6, Math.round(Math.abs(r.ver) / maxAbs * 100));
            return '<div class="perf-bar' + (r.ver < 0 ? ' neg' : '') + '" style="height:' + h + '%;" title="' +
                perfEsc(r.rakip || r.tarih) + ': ' + r.ver + '"><span class="perf-bar-val">' + r.ver + '</span></div>';
        }).join('');

        // Liste: yeniden eskiye
        var rows = arr.slice().sort(function (a, b) { return b.id - a.id; }).map(function (r) {
            var rozet = perfRozet(r);
            var best = (r.ver === bestVer);
            return '<div class="perf-hist-item' + (best ? ' best' : '') + '">' +
                '<div class="perf-hist-main">' +
                    '<div class="perf-hist-top">' + (r.rakip ? perfEsc(r.rakip) : 'Maç') +
                        (best ? ' <span class="perf-badge" style="padding:3px 9px;font-size:0.68rem;">🔥 En İyi</span>' : '') +
                        (rozet ? ' <span style="color:#f59e0b;font-size:0.7rem;font-weight:800;">' + rozet + '</span>' : '') + '</div>' +
                    '<div class="perf-hist-sub">' + perfEsc(r.tarih) + (r.lig ? ' · ' + perfEsc(r.lig) : '') +
                        ' · ' + r.sayi + ' sayı · ' + r.ribaund + ' rib · ' + r.asist + ' ast · ' + r.calma + ' çal · ' + r.blok + ' blok</div>' +
                '</div>' +
                '<div class="perf-hist-ver" style="color:' + (r.ver >= 0 ? '#ff7849' : '#94a3b8') + ';">' + r.ver + '</div>' +
                '<button class="perf-del" onclick="perfSil(' + r.id + ')" title="Sil" aria-label="Sil">🗑</button>' +
            '</div>';
        }).join('');

        box.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
                '<h3 style="font-family:var(--font-display);color:#fff;font-size:1.15rem;margin:0;">📅 Kayıtlı Maçlar (' + n + ')</h3>' +
                '<button class="perf-btn2" onclick="perfTemizle()">Tümünü Temizle</button>' +
            '</div>' +
            '<div class="calc-result-card" style="margin-bottom:16px;">' +
                '<div class="stat-lbl" style="margin-bottom:10px;">SEZON ORTALAMASI · ' + n + ' maç</div>' +
                '<div class="perf-avg-grid">' +
                    perfMini('Sayı', avg('sayi').toFixed(1)) + perfMini('Ribaund', avg('ribaund').toFixed(1)) +
                    perfMini('Asist', avg('asist').toFixed(1)) + perfMini('Çalma', avg('calma').toFixed(1)) +
                    perfMini('Blok', avg('blok').toFixed(1)) + perfMini('Verim', avg('ver').toFixed(1)) +
                '</div>' +
                (sonlar.length > 1 ? '<div class="stat-lbl" style="margin:18px 0 0;">SON ' + sonlar.length + ' MAÇ · VERİMLİLİK</div><div class="perf-bars">' + bars + '</div>' : '') +
            '</div>' +
            rows;
    }

    function perfInit() {
        var d = document.getElementById('pfTarih');
        if (d && !d.value) { d.value = new Date().toISOString().slice(0, 10); }
        perfRenderGecmis();
    }

    // ===== SU İHTİYACI =====
    function calcWater() {
        var w = parseFloat(document.getElementById('wWeight').value);
        var ex = parseFloat(document.getElementById('wEx').value) || 0;
        var err = document.getElementById('wErr');
        err.style.display = 'none';
        if (!w || w < 25) { err.textContent = 'Lütfen geçerli kilo gir.'; err.style.display = 'block'; return; }
        var baseMl = w * 35;                 // 35 ml / kg
        var exMl = ex * 12;                  // ~360 ml / 30 dk
        var total = Math.round(baseMl + exMl);
        var liters = (total / 1000).toFixed(1);
        var glasses = Math.round(total / 250);
        var html = '<div class="calc-result-card">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div class="stat-card"><div class="stat-val" style="color:#38bdf8;">' + liters + ' L</div><div class="stat-lbl">Günlük Su</div></div>' +
            '<div class="stat-card"><div class="stat-val" style="color:#38bdf8;">' + glasses + '</div><div class="stat-lbl">Bardak (~250ml)</div></div>' +
            '</div>' +
            '<p style="font-size:0.84rem;color:#94a3b8;margin-top:16px;text-align:center;">Temel: <strong style="color:#cbd5e1;">' + Math.round(baseMl) + ' ml</strong>' +
            (ex > 0 ? ' &nbsp;+&nbsp; Antrenman: <strong style="color:#cbd5e1;">' + Math.round(exMl) + ' ml</strong>' : '') + '</p>' +
            '</div>';
        var box = document.getElementById('wResult');
        box.innerHTML = html; box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ===== KALP ATIŞI BÖLGELERİ =====
    function calcHR() {
        var age = parseFloat(document.getElementById('hrAge').value);
        var rest = parseFloat(document.getElementById('hrRest').value);
        var err = document.getElementById('hrErr');
        err.style.display = 'none';
        if (!age || age < 10 || age > 90) { err.textContent = 'Lütfen geçerli yaş gir.'; err.style.display = 'block'; return; }
        var maxHR = Math.round(211 - 0.64 * age);
        var useKarvonen = rest && rest >= 30 && rest <= 120;
        var zones = [
            { n: 'Bölge 1 · Isınma',     s: 'Çok hafif · toparlanma',   lo: 0.50, hi: 0.60, c: '#60a5fa' },
            { n: 'Bölge 2 · Yağ Yakım',  s: 'Hafif · dayanıklılık',     lo: 0.60, hi: 0.70, c: '#22c55e' },
            { n: 'Bölge 3 · Aerobik',    s: 'Orta · kardiyo gelişimi',  lo: 0.70, hi: 0.80, c: '#facc15' },
            { n: 'Bölge 4 · Anaerobik',  s: 'Zor · performans',         lo: 0.80, hi: 0.90, c: '#f97316' },
            { n: 'Bölge 5 · Maksimum',   s: 'Çok zor · sprint',         lo: 0.90, hi: 1.00, c: '#ef4444' }
        ];
        function bpm(p) {
            return useKarvonen ? Math.round((maxHR - rest) * p + rest) : Math.round(maxHR * p);
        }
        var rows = zones.map(function (z) {
            return '<div class="zrow"><span class="zdot" style="background:' + z.c + ';"></span>' +
                '<span><span class="zname">' + z.n + '</span><br><span class="zsub">' + z.s + '</span></span>' +
                '<span class="zbpm">' + bpm(z.lo) + '–' + bpm(z.hi) + ' bpm</span></div>';
        }).join('');
        var html = '<div class="calc-result-card">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
            '<h3 style="font-family:\'Space Grotesk\',Inter,sans-serif;color:#fff;font-size:1.1rem;">Maks. Kalp Atışı</h3>' +
            '<span class="result-cat" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.35);">' + maxHR + ' bpm</span></div>' +
            rows +
            '<p style="font-size:0.74rem;color:#5d6b82;margin-top:12px;">' + (useKarvonen ? 'Karvonen yöntemi (dinlenme nabzı dahil) — daha kişisel.' : 'Dinlenme nabzı girersen Karvonen yöntemiyle daha kişisel sonuç alırsın.') + '</p>' +
            '</div>';
        var box = document.getElementById('hrResult');
        box.innerHTML = html; box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ===== 1RM (MAKS. KUVVET) =====
    function calc1RM() {
        var w = parseFloat(document.getElementById('rmW').value);
        var r = parseFloat(document.getElementById('rmR').value);
        var err = document.getElementById('rmErr');
        err.style.display = 'none';
        if (!w || w < 1 || !r || r < 1) { err.textContent = 'Lütfen geçerli ağırlık ve tekrar gir.'; err.style.display = 'block'; return; }
        if (r > 12) { err.textContent = 'Daha doğru sonuç için 12 veya daha az tekrar gir.'; err.style.display = 'block'; return; }
        var epley = w * (1 + r / 30);
        var brzycki = r < 37 ? w * 36 / (37 - r) : epley;
        var oneRM = Math.round((epley + brzycki) / 2 * 10) / 10;
        var pcts = [
            { p: 100, reps: '1 tekrar' }, { p: 95, reps: '2 tekrar' }, { p: 90, reps: '4 tekrar' },
            { p: 85, reps: '6 tekrar' }, { p: 80, reps: '8 tekrar' }, { p: 75, reps: '10 tekrar' },
            { p: 70, reps: '12 tekrar' }, { p: 65, reps: '15 tekrar' }
        ];
        var rows = pcts.map(function (x) {
            return '<div class="rmrow"><span class="rm-pct">%' + x.p + '</span><span class="rm-kg">' + (Math.round(oneRM * x.p / 100 * 10) / 10) + ' kg</span><span class="rm-rep">' + x.reps + '</span></div>';
        }).join('');
        var html = '<div class="calc-result-card">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px;">' +
            '<h3 style="font-family:\'Space Grotesk\',Inter,sans-serif;color:#fff;font-size:1.1rem;">Tahmini 1RM</h3>' +
            '<span class="result-cat" style="background:rgba(255,90,24,0.15);color:#ff8a45;border:1px solid rgba(255,90,24,0.35);">' + oneRM + ' kg</span></div>' +
            '<p style="font-size:0.8rem;color:#94a3b8;margin-bottom:14px;">Antrenman yüzdesine göre kaldırman gereken ağırlıklar:</p>' +
            rows +
            '<p style="font-size:0.74rem;color:#5d6b82;margin-top:12px;">Epley &amp; Brzycki formüllerinin ortalaması.</p>' +
            '</div>';
        var box = document.getElementById('rmResult');
        box.innerHTML = html; box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetDiet() {
        dState = { goal: null, act: null };
        document.querySelectorAll('.dpill').forEach(function(b) { b.classList.remove('dsel'); });
        ['dAge','dWeight','dHeight'].forEach(function(id) { document.getElementById(id).value = ''; });
        document.getElementById('dGender').value = '';
        document.getElementById('dietResult').style.display = 'none';
        document.getElementById('dietForm').style.display = 'block';
        document.getElementById('dietForm').scrollIntoView({ behavior: 'smooth' });
    }
