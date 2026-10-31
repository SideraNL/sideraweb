// Sidera — funzioni comuni del sito (grafica 31/10/2026, MedFIND v396.5).
(function () {
  // Menu su telefono: il bottone apre e chiude l'elenco delle pagine.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.nav-toggle');
    if (!b) return;
    var nav = b.closest('.nav');
    var open = nav.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Colori «madre» delle aree terapeutiche: gli stessi dei temi BROCHURE di MedFIND
  // (blueprints/brochure.py, _BR_AREA_COLORS). Il badge usa il colore madre (verde
  // acqua e arancio scuriti per leggere il bianco), la scheda una tinta tenue.
  var AREE = {
    ONCOLOGIA:         { madre: '#C2185B', tinta: '#FCE8EF', bordo: '#F3C2D4' },
    PSICHIATRIA:       { madre: '#1565C0', tinta: '#E6EFFA', bordo: '#BDD3EF' },
    GASTROENTEROLOGIA: { madre: '#BF4800', tinta: '#FDEEE4', bordo: '#F5CFB5' },
    PNEUMOLOGIA:       { madre: '#00796B', tinta: '#E2F3F0', bordo: '#B5DDD6' }
  };
  var ALTRO = { madre: '#1D3557', tinta: '#E9EDF3', bordo: '#C9D2DF' };

  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
              'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var MESI3 = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  var GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  window.Sidera = {
    area: function (a) { return AREE[String(a || '').toUpperCase()] || ALTRO; },
    areaNome: function (a) {
      a = String(a || '').trim().toLowerCase();
      return a ? a.charAt(0).toUpperCase() + a.slice(1) : '';
    },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    // "20/10/2026" -> Date a mezzanotte locale (null se non valida)
    data: function (s) {
      var p = String(s || '').split('/');
      if (p.length < 3) return null;
      var y = Number(p[2]); if (y < 100) y += 2000;
      var d = new Date(y, Number(p[1]) - 1, Number(p[0]));
      return isNaN(d.getTime()) ? null : d;
    },
    giornoLungo: function (d) {
      return GIORNI[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear();
    },
    giornoBreve: function (d) { return d.getDate() + ' ' + MESI3[d.getMonth()] + ' ' + d.getFullYear(); },
    // "da 18 a 19 nov 2026" in forma compatta per le schede
    intervallo: function (a, b) {
      if (!b || b.getTime() === a.getTime()) return Sidera.giornoBreve(a);
      if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear())
        return a.getDate() + '-' + b.getDate() + ' ' + MESI3[a.getMonth()] + ' ' + a.getFullYear();
      return Sidera.giornoBreve(a) + ' – ' + Sidera.giornoBreve(b);
    },
    // Solo indirizzi web veri negli href: niente javascript: o data:
    url: function (u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? Sidera.esc(u) : ''; },
    // Giorno n dopo d (calendario, non 24 ore: col cambio d'ora 24 ore non sono un giorno)
    piuGiorni: function (d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); },
    webinar: function (luogo) { return String(luogo || '').toUpperCase().indexOf('WEBINAR') >= 0; },
    crediti: function (c) { return String(c || '').replace('.', ','); },
    // Nomi in DESKOFFER sono MAIUSCOLI: «DE PINTO DANIELE» -> «De Pinto Daniele»
    nomi: function (s) {
      return String(s || '').toLowerCase().replace(/(^|[\s'’-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
  };
})();
