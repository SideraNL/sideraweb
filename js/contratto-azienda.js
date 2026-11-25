// contratto-azienda.js — finestra di scelta dell'azienda di appartenenza (Pubblica/Privata,
// strutture DBAO, ricerca Indice PA) e riquadro riassuntivo dello Step 3 (v411.2).
// Scorporato da contratto-form.js per il budget R09 (2700 righe). Caricato SUBITO DOPO
// contratto-form.js e prima di contratto-ente.js: usa $, showFormMsg; cmState e
// cmDbaoCache servono a populate()/submitForm(), che girano solo dopo la fetch del prefill,
// quindi a script gia' caricati.

// ════════════════════════════════════════════════════════════════════════════
// v127.2 — Modale bivio Pubblica/Privata + flow strutture DBAO (Fase 3 + 4)
// ════════════════════════════════════════════════════════════════════════════

// Stato del modale + dati DBAO embeddati nello snapshot di prefill
const cmState = {
  type: null,           // 'pubblica' | 'privata' | null
  citta: null,          // città azienda (solo Pubblica)
  prov: null,           // provincia derivata da città
  struttura: null,      // record DBAO selezionato (solo Pubblica)
  altro_nome: null,     // nome ente per "Altro" (Pubblica + non in DBAO)
  altro_tipo: null,
  ipa: null,            // ente scelto dall'Indice PA {cod,nome,comune,prov,pec,tipologia}
  ipa_tutti: false,     // ricerca estesa oltre sanità/università
  pec: null,            // PEC inserita o da DBAO (modificata)
  pec_attuale: null,    // PEC originale in DBAO al momento della selezione
  privata_nome: null,   // nome free text (Privata)
};
let cmDbaoCache = [];   // snapshot DBAO da prefill (Fase 4)

function _cm(id) { return document.getElementById(id); }

function openCompanyModal() {
  // Apre sempre dal bivio (R7: "Modifica" riapre da Step 1).
  const pb = _cm('cm-ipa-presidio'); if (pb) pb.style.display = 'none';   // v400.1
  cmShowStep('cm-step-bivio');
  _cm('cm-overlay').style.display = 'flex';
}
function closeCompanyModal() {
  _cm('cm-overlay').style.display = 'none';
  // v127.9 — dopo aver scelto l'Azienda, chiediamo l'ambito ECM (solo italiani)
  setTimeout(tryAutoOpenEcmModal, 200);
}
function cmShowStep(stepId) {
  document.querySelectorAll('.cm-step').forEach(el => el.classList.remove('active'));
  const target = _cm(stepId);
  if (target) target.classList.add('active');
  // Aggiorna titolo header
  const titles = {
    'cm-step-bivio':     'La sua azienda',
    'cm-step-privata':   'Azienda privata / altro',
    'cm-step-ipa':       'Il suo ente pubblico',
    'cm-step-citta':     'Città dell’azienda pubblica',
    'cm-step-strutture': 'Selezione struttura',
    'cm-step-conferma':  'Conferma struttura + PEC',
    'cm-step-altro':     'Struttura non in elenco',
  };
  const t = _cm('cm-title');
  if (t) t.textContent = titles[stepId] || 'La sua azienda';
}

function cmGoBivio()     { cmShowStep('cm-step-bivio'); }
function cmGoCitta()     { cmShowStep('cm-step-citta'); }
function cmGoStrutture() { cmShowStep('cm-step-strutture'); }

function cmChooseType(type) {
  cmState.type = type;
  if (type === 'privata') {
    // Pre-fill se già scelto in passato
    const nome = cmState.privata_nome || _cm('f-ente').value || '';
    _cm('cm-priv-nome').value = nome;
    cmShowStep('cm-step-privata');
    setTimeout(() => _cm('cm-priv-nome').focus(), 50);
  } else {
    // Pubblica: si parte dalla ricerca nell'Indice PA (v296.1). Il vecchio
    // percorso città → strutture resta raggiungibile se la ricerca non trova
    // nulla, così nessuno resta bloccato.
    _cm('cm-ipa-q').value = (cmState.ipa && cmState.ipa.nome)
      || _cmSoloDenominazione(_cm('f-ente').value) || '';
    _cm('cm-ipa-prov').value = cmState.prov || _cm('f-azienda-prov').value || '';
    cmState.ipa_tutti = false;
    _cm('cm-ipa-estendi').style.display = '';
    cmShowStep('cm-step-ipa');
    setTimeout(() => { _cm('cm-ipa-q').focus(); cmIpaSearch(); }, 50);
  }
}

/* ── Ricerca ente nell'Indice PA (v296.1) ──────────────────────────────────
   La PEC non si digita: si sceglie l'ente e l'indirizzo viene dal registro
   AgID, dove è il domicilio digitale eletto dall'ente stesso.            */
let _cmIpaTimer = null, _cmIpaSeq = 0;

/* v298.6 — Il campo Azienda arriva da DBDOC con nome e indirizzo attaccati
   ("ASST LECCO-VIA DELL'EREMO, 9/11-23900 LECCO LC"). Metterlo tale e quale
   nella casella di ricerca dava "Nessun ente trovato" su un ente che esiste.
   Il server ora regge comunque la stringa intera; qui si toglie la coda
   d'indirizzo perché la casella resti leggibile e modificabile. */
function _cmSoloDenominazione(s) {
  let t = String(s || '').trim();
  t = t.replace(/\s*[-,;]?\s*\b(VIA|V\.?LE|VIALE|P\.?LE|PIAZZALE|PIAZZA|P\.?ZA|CORSO|C\.?SO|LARGO|L\.?GO|VICOLO|STRADA|CONTRADA|LOC\.?|LOCALITA|FRAZ\.?|FRAZIONE)\b[\s.].*$/i, '');
  t = t.replace(/\s*[-,;]?\s*\b\d{5}\b.*$/, '');       // CAP e ciò che segue
  return t.replace(/[\s,;:.\-]+$/, '').trim();
}

function cmIpaSearchDebounced() {
  clearTimeout(_cmIpaTimer);
  _cmIpaTimer = setTimeout(cmIpaSearch, 260);
}

function cmIpaKey(ev) {
  if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(_cmIpaTimer); cmIpaSearch(); }
}

function cmIpaTuttaPa() {
  cmState.ipa_tutti = true;
  _cm('cm-ipa-estendi').style.display = 'none';
  cmIpaSearch();
}

/* ── Archivio IPA nel browser (v314.6) ─────────────────────────────────────
   `/api/ipa/search` risponde solo su MedFIND in locale. Il form pero' gira su
   sideraweb.com (GitHub Pages), dove quella chiamata dava 404: la ricerca non
   partiva proprio, e il relatore dipendente pubblico restava bloccato con
   "Nessun ente trovato" su enti che nel registro ci sono (segnalazione del
   19/08/2026, contratto 1349-2).

   Ora dal sito si cerca in locale nel browser, sull'archivio pubblicato da
   `scripts/gen_ipa_web.py`: ipa_core.json (~570 enti: sanita', universita',
   ricerca, ministeri, regioni) e, solo se il relatore estende la ricerca a
   tutta la PA, ipa_tutti.json. Il blob di ricerca `s` di ogni ente e' gia'
   calcolato lato server, sigle d'uso corrente comprese: qui si filtra e si
   ordina, con lo stesso punteggio di utils/ipa_enti.cerca_dettaglio.        */

const IPA_IN_LOCALE = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const _ipaArchivi = {};

async function _ipaArchivio(tutti) {
  const nome = tutti ? 'ipa_tutti.json' : 'ipa_core.json';
  if (_ipaArchivi[nome]) return _ipaArchivi[nome];
  const r = await fetch(nome, {cache: 'force-cache'});
  if (!r.ok) throw new Error('archivio ' + nome + ' non disponibile');
  const d = await r.json();
  d._prov = new Set((d.enti || []).map(e => e.p).filter(Boolean));
  _ipaArchivi[nome] = d;
  return d;
}

function _ipaNorm(s) {
  return String(s == null ? '' : s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}

// Parole d'indirizzo e connettivi: non distinguono un ente dall'altro e in un
// AND stretto azzererebbero i risultati (il campo Azienda arriva da DBDOC con
// via e numero civico attaccati). Stesso elenco di utils/ipa_enti.py.
const _IPA_RUMORE = new Set(
  ('VIA VIALE VLE PIAZZA PIAZZALE PZA PZZA PIAZZETTA CORSO CSO LARGO LGO VICOLO '
 + 'STRADA STRADALE CONTRADA LOCALITA LOC FRAZIONE FRAZ BORGO SALITA TRAVERSA '
 + 'SNC INT SCALA PALAZZINA EDIFICIO PRESSO CAP NR NUM CIVICO '
 + 'DI DA DE DEL DELLO DELLA DELL DEI DEGLI DELLE IL LO LA GLI LE ED AL ALLO '
 + 'ALLA AI AGLI ALLE IN NEL NELLA SU PER CON TRA FRA').split(' '));

function _ipaPubblico(e) {
  return {cod: e.c, nome: e.n, acronimo: e.a, comune: e.m, prov: e.p,
          regione: e.r, tipologia: e.t, cf: e.f, pec: e.e, core: !!e.k};
}

function _ipaCerca(arch, q, prov, tutti, limit) {
  prov = (prov || '').trim().toUpperCase();
  const grezzi = _ipaNorm(q).split(' ').filter(Boolean);
  const tok = [];
  for (const t of grezzi) {
    if (t.length < 2 || /^\d+$/.test(t) || _IPA_RUMORE.has(t)) continue;
    if (!tok.includes(t)) tok.push(t);
  }
  // Sigla di provincia in coda: filtro solo se la stringa e' chiaramente un
  // indirizzo incollato (c'e' un CAP). Altrimenti "BRESCIA AO" verrebbe letto
  // come "Brescia in provincia di Aosta".
  const haCap = grezzi.some(t => t.length === 5 && /^\d+$/.test(t));
  if (!prov && haCap && tok.length > 1 && arch._prov.has(tok[tok.length - 1])) {
    prov = tok.pop();
  }
  if (!tok.length && !prov) return {enti: [], usate: [], prov: prov, parziale: false};

  let migliori = [], maxMatch = 0;
  for (const e of (arch.enti || [])) {
    if (!tutti && !e.k) continue;
    if (prov && e.p !== prov) continue;
    const blob = e.s || '';
    const parole = blob.split(' ');
    let match = 0, punti = 0;
    for (const t of tok) {
      if (parole.some(p => p.startsWith(t))) {
        match++;
        // Peso per lunghezza: indovinare "BRESCIA" dice molto piu' che
        // indovinare "AO", che compare in centinaia di denominazioni.
        punti += (blob.startsWith(t) ? 2 : 1) * Math.min(t.length, 8);
      }
    }
    if (tok.length && !match) continue;
    if (match < maxMatch) continue;
    if (match > maxMatch) { maxMatch = match; migliori = []; }
    migliori.push([-(punti + (e.k ? 3 : 0)), (e.n || '').length, e]);
  }
  migliori.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  let usate = tok;
  if (migliori.length && maxMatch < tok.length) {
    const parole = (migliori[0][2].s || '').split(' ');
    usate = tok.filter(t => parole.some(p => p.startsWith(t)));
  }
  return {enti: migliori.slice(0, limit).map(x => _ipaPubblico(x[2])),
          usate: usate, prov_usata: prov,
          parziale: !!tok.length && maxMatch < tok.length};
}

async function cmIpaSearch() {
  const q = (_cm('cm-ipa-q').value || '').trim();
  const prov = (_cm('cm-ipa-prov').value || '').trim().toUpperCase();
  const box = _cm('cm-ipa-list');
  if (q.length < 2 && !prov) { box.innerHTML = ''; return; }
  const seq = ++_cmIpaSeq;
  box.innerHTML = '<div style="padding:10px;color:#64748b;font-size:14px">Ricerca in corso…</div>';
  try {
    let d;
    if (IPA_IN_LOCALE) {
      const url = '/api/ipa/search?q=' + encodeURIComponent(q)
                + '&prov=' + encodeURIComponent(prov)
                + (cmState.ipa_tutti ? '&tutti=1' : '');
      const r = await fetch(url);
      d = await r.json();
    } else {
      const arch = await _ipaArchivio(cmState.ipa_tutti);
      d = Object.assign({ok: true}, _ipaCerca(arch, q, prov, cmState.ipa_tutti, 25));
    }
    if (seq !== _cmIpaSeq) return;   // risposta di una digitazione superata
    cmIpaRender(d.ok ? (d.enti || []) : [], d.ok ? d : {});
  } catch (e) {
    // Non lasciare il relatore in un vicolo cieco: se la ricerca non riesce
    // resta il percorso storico citta' -> struttura, che non dipende da nulla
    // di esterno.
    if (seq === _cmIpaSeq) box.innerHTML =
      '<div style="padding:12px;color:#92400e;font-size:14px;background:#fffbeb;'
      + 'border:1px solid #fcd34d;border-radius:6px">Ricerca degli enti non disponibile in questo momento. '
      + '<a href="javascript:void(0)" onclick="cmGoCitta()" style="color:#1a56db">'
      + 'Prosegua indicando la citt&agrave; dell&rsquo;ente</a>.</div>';
  }
}
let _cmIpaUltimi = [];

function cmIpaRender(enti, meta) {
  _cmIpaUltimi = enti;
  const box = _cm('cm-ipa-list');
  // v298.6 — Quando la ricerca ha usato solo una parte di ciò che è scritto
  // nella casella (tipico della stringa incollata da DBDOC, piena di via e
  // numeri civici), dirlo: altrimenti l'elenco sembra arbitrario.
  let testa = '';
  const usate = (meta && meta.usate) || [];
  if (enti.length && meta && meta.parziale && usate.length) {
    const pv = meta.prov_usata ? ' · provincia ' + _cfEsc(meta.prov_usata) : '';
    testa = '<div style="padding:8px 10px;margin-bottom:8px;background:#eff6ff;'
          + 'border-left:3px solid #1a56db;border-radius:5px;font-size:14px;color:#1e40af">'
          + 'Risultati per <b>' + _cfEsc(usate.join(' ')) + '</b>' + pv + '</div>';
  }
  if (!enti.length) {
    box.innerHTML =
      '<div style="padding:12px;color:#92400e;font-size:14px;background:#fffbeb;'
      + 'border:1px solid #fcd34d;border-radius:6px">Nessun ente trovato.'
      + (cmState.ipa_tutti
          ? ' <a href="javascript:void(0)" onclick="cmGoCitta()" style="color:#1a56db">Inserisca i dati manualmente</a>.'
          : ' Provi con meno parole, oppure estenda la ricerca a tutta la PA col pulsante qui sotto.')
      + '</div>';
    return;
  }
  // v372.9 — La città in evidenza, e un avviso quando lo stesso nome compare
  // in più città: è così che si sceglie un omonimo (caso 1346-4, Cortemilia
  // invece di Pescara).
  const conta = {};
  enti.forEach(e => { const k = _ipaNorm(e.nome); conta[k] = (conta[k] || 0) + 1; });
  const omonimi = Object.values(conta).some(n => n > 1);
  if (omonimi) {
    testa += '<div style="padding:8px 10px;margin-bottom:8px;background:#fffbeb;'
           + 'border-left:3px solid #f59e0b;border-radius:5px;font-size:14px;color:#78350f">'
           + 'Ci sono enti con lo stesso nome in città diverse: scelga quello della <b>Sua città</b>.</div>';
  }
  box.innerHTML = testa + enti.map((e, i) =>
    '<div class="cm-strut-item" onclick="cmIpaSelect(' + i + ')">'
    + '<b>' + _cfEsc(e.nome) + '</b>'
    + '<div style="font-size:14px;color:#64748b">'
    + '<b style="color:#1e293b">📍 ' + _cfEsc(e.comune) + ' (' + _cfEsc(e.prov) + ')</b> · ' + _cfEsc(e.tipologia || '')
    + '</div></div>').join('');
}

// _cfEsc sta in contratto-form.js (utility usata anche da residenza ed ente)

function cmIpaSelect(i) {
  const e = _cmIpaUltimi[i];
  if (!e) return;
  cmState.ipa = e;
  cmState.struttura = null;
  _cm('cm-struttura-info').innerHTML =
    '<b>' + _cfEsc(e.nome) + '</b><br>'
    + '<span style="font-size:15px;font-weight:700;color:#1e293b">📍 Sede: '
    + _cfEsc(e.comune) + ' (' + _cfEsc(e.prov) + ')</span>'
    + '<br><span style="color:#64748b;font-size:14px">' + _cfEsc(e.tipologia || '') + '</span>';
  _cmSedeAvviso(e.prov, e.comune);
  _cm('cm-pec-ipa').textContent = e.pec || '';
  _cm('cm-pec-ipa-box').style.display = '';
  _cm('cm-pec-man-box').style.display = 'none';
  cmShowStep('cm-step-conferma');
}

/* v372.9 — Avviso (non blocca) quando la provincia dell'ente non coincide con
   quella di residenza del punto 2.4: si può lavorare fuori provincia, ma è il
   momento giusto per accorgersi di aver scelto un omonimo. */
function _cmSedeAvviso(prov, comune) {
  const box = _cm('cm-sede-avviso');
  if (!box) return;
  const pvr = (($('f-pvr') || {}).value || '').trim().toUpperCase();
  prov = String(prov || '').trim().toUpperCase();
  if (!prov || !pvr || pvr === 'EE' || pvr === prov) { box.style.display = 'none'; return; }
  box.innerHTML = 'L’ente scelto ha sede a <b>' + _cfEsc(comune) + ' (' + _cfEsc(prov) + ')</b>, '
    + 'mentre Lei risiede in provincia di <b>' + _cfEsc(pvr) + '</b>. Se lavora davvero lì prosegua pure; '
    + 'altrimenti torni indietro e scelga l’ente della Sua città: a questa PEC invieremo le comunicazioni '
    + 'previste per i dipendenti pubblici.';
  box.style.display = '';
}

function cmSubmitPrivata() {
  const nome = (_cm('cm-priv-nome').value || '').trim();
  if (!nome) {
    showFormMsg('Indichi il nome dell’azienda.', 'error');
    return;
  }
  cmState.privata_nome = nome;
  // Salva nei hidden field del form principale
  _cm('f-ente').value = nome;
  _cm('f-pec').value = '';
  _cm('f-company-type').value = 'privata';
  _cm('f-azienda-tipo').value = '';
  _cm('f-azienda-citta').value = '';
  _cm('f-azienda-prov').value = '';
  _cm('f-dbao-id').value = '';
  // v386.3 — nuova azienda, nuova risposta al 3.1 bis
  document.querySelectorAll('input[name="f-rapporto-ente"]').forEach(r => { r.checked = false; });
  // Privata → forza Opzione A in Art. 3 (e auto-skip step 5/6/7)
  const radioA = document.querySelector('input[name="opzione"][value="A"]');
  if (radioA) {
    radioA.checked = true;
    if (typeof updateOpzione === 'function') updateOpzione();
  }
  updateAziendaSummary();
  closeCompanyModal();
}

function _cmFindCitta(input) {
  // Match case-insensitive sul campo CITTA di DBAO. Ritorna provincia desunta
  // dal primo match (omonimie ignorate per ora — accetta la prima provincia trovata).
  const target = (input || '').trim().toUpperCase();
  if (!target) return null;
  for (const r of cmDbaoCache) {
    if ((r.CITTA || '').trim().toUpperCase() === target) {
      return { citta: (r.CITTA || '').trim(), prov: (r.Prov || r.PROV || '').trim() };
    }
  }
  return null;
}

function cmCittaNext() {
  const inp = (_cm('cm-pub-citta').value || '').trim();
  if (!inp) {
    showFormMsg('Indichi la città dell’azienda.', 'error');
    return;
  }
  const match = _cmFindCitta(inp);
  if (!match) {
    // v392.7 — niente confirm() del browser: primo clic avvisa, il secondo sulla
    // stessa città prosegue (in alcune app di posta il confirm bloccava il form).
    if (cmState._cittaAvvisata !== inp.toUpperCase()) {
      cmState._cittaAvvisata = inp.toUpperCase();
      showFormMsg('La città indicata non risulta tra quelle in archivio. Se è corretta, ' +
                  'prema di nuovo Avanti: potrà inserire la struttura come "Altro".', 'warning');
      return;
    }
    clearFormMsg();
    cmState.citta = inp;
    cmState.prov = '';
  } else {
    cmState.citta = match.citta;
    cmState.prov = match.prov;
  }
  _populateStrutture();
  cmShowStep('cm-step-strutture');
}

function _populateStrutture() {
  // Popola le 2 sezioni: strutture in città + strutture in provincia (alfabetiche).
  const targetCitta = (cmState.citta || '').toUpperCase();
  const targetProv = (cmState.prov || '').toUpperCase();
  _cm('cm-strut-citta-name').textContent = cmState.citta || '—';
  _cm('cm-strut-prov-name').textContent = cmState.prov || '—';
  const inCitta = [];
  const inProv = [];
  for (const r of cmDbaoCache) {
    const rCitta = (r.CITTA || '').toUpperCase();
    const rProv = (r.Prov || r.PROV || '').toUpperCase();
    if (rCitta === targetCitta) {
      inCitta.push(r);
    } else if (targetProv && rProv === targetProv) {
      inProv.push(r);
    }
  }
  inCitta.sort((a, b) => (a.NOME || '').localeCompare(b.NOME || '', 'it'));
  inProv.sort((a, b) => (a.NOME || '').localeCompare(b.NOME || '', 'it'));
  const renderList = (items, containerId) => {
    const el = _cm(containerId);
    if (!el) return;
    if (items.length === 0) {
      el.innerHTML = '<div class="cm-strut-empty">Nessuna struttura trovata.</div>';
      return;
    }
    let html = '';
    for (const r of items) {
      const id = r.ID;
      const nome = (r.NOME || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
      const tipo = r.TIPO || '';
      html += `<div class="cm-strut-item" onclick="cmSelectStruttura(${id})">` +
              `<span class="nome">${nome}</span>` +
              `<span class="tipo">${tipo}</span></div>`;
    }
    el.innerHTML = html;
  };
  renderList(inCitta, 'cm-strutture-citta-list');
  renderList(inProv, 'cm-strutture-prov-list');
  // Nascondi sezione provincia se vuota
  _cm('cm-strutture-prov-block').style.display =
    (inProv.length === 0 || !targetProv) ? 'none' : 'block';
}

function cmSelectStruttura(id) {
  const rec = cmDbaoCache.find(r => +r.ID === +id);
  if (!rec) return;
  cmState.struttura = rec;
  cmState.ipa = null;                       // percorso storico: PEC digitabile
  _cm('cm-pec-ipa-box').style.display = 'none';
  _cm('cm-pec-man-box').style.display = '';
  cmState.pec_attuale = (rec.PEC || '').trim();
  // Pre-fill PEC se in DBAO; altrimenti vuota da compilare
  _cm('cm-pub-pec').value = cmState.pec_attuale;
  // Render info struttura
  _cm('cm-struttura-info').innerHTML =
    '<b>' + (rec.NOME || '') + '</b><br>' +
    '<span style="color:#64748b;font-size:14px">' +
    (rec.TIPO || '') + ' · ' + (rec.CITTA || '') + ' (' + (rec.Prov || rec.PROV || '') + ')' +
    '</span>';
  _cmSedeAvviso(rec.Prov || rec.PROV, rec.CITTA);
  // Hint PEC dinamico
  const hint = _cm('cm-pec-hint');
  if (hint) {
    if (cmState.pec_attuale) {
      hint.textContent = 'Verifichi la PEC mostrata. Se è cambiata, può modificarla qui — la modifica sarà sottoposta ad approvazione.';
      hint.style.color = '#16a34a';
    } else {
      hint.textContent = 'PEC non in archivio. Inserisca quella corretta del Suo ente — verrà censita.';
      hint.style.color = '#92400e';
    }
  }
  cmShowStep('cm-step-conferma');
  setTimeout(() => _cm('cm-pub-pec').focus(), 50);
  // v324.6 — L'ente viene dal nostro archivio, la cui PEC puo' essere vecchia
  // (l'ente cambia nome o dominio e noi non ce ne accorgiamo). Se lo stesso
  // ente c'e' nell'Indice PA, si passa a quei dati: sono il domicilio digitale
  // che l'ente ha eletto, quindi valgono piu' della nostra copia.
  cmRisolviSuIpa(rec);
}

async function cmRisolviSuIpa(rec) {
  const nome = _cmSoloDenominazione(rec.NOME || '');
  const prov = (rec.Prov || rec.PROV || '').trim().toUpperCase();
  if (nome.length < 3) return;
  let enti = [];
  try {
    if (IPA_IN_LOCALE) {
      const r = await fetch('/api/ipa/search?q=' + encodeURIComponent(nome)
                          + '&prov=' + encodeURIComponent(prov));
      const d = await r.json();
      enti = d.ok ? (d.enti || []) : [];
    } else {
      enti = (_ipaCerca(await _ipaArchivio(false), nome, prov, false, 5) || {}).enti || [];
    }
  } catch (e) { return; }          // IPA non raggiungibile: resta il campo digitabile
  // Un solo ente nella stessa citta': ambiguo non e'. Con piu' risultati non
  // scelgo io — meglio la PEC digitata dal relatore che quella dell'ente sbagliato.
  const cit = _ipaNorm(rec.CITTA || '');
  const q = enti.filter(e => _ipaNorm(e.comune) === cit && e.pec);
  if (q.length !== 1) return;
  if (cmState.struttura !== rec) return;   // il relatore ha gia' cambiato scelta
  cmState.ipa = q[0];
  _cm('cm-struttura-info').innerHTML =
    '<b>' + _cfEsc(q[0].nome) + '</b><br><span style="color:#64748b;font-size:14px">'
    + _cfEsc(q[0].tipologia || '') + ' · ' + _cfEsc(q[0].comune) + ' (' + _cfEsc(q[0].prov) + ')</span>';
  _cmSedeAvviso(q[0].prov, q[0].comune);
  _cm('cm-pec-ipa').textContent = q[0].pec;
  _cm('cm-pec-ipa-box').style.display = '';
  _cm('cm-pec-man-box').style.display = 'none';
}

function cmAltroChoice() {
  // Pre-fill città/prov in read-only
  const lab = (cmState.citta || '—') + ' (' + (cmState.prov || '—') + ')';
  _cm('cm-altro-citta-readonly').textContent = lab;
  _cm('cm-altro-nome').value = cmState.altro_nome || '';
  _cm('cm-altro-tipo').value = cmState.altro_tipo || '';
  _cm('cm-altro-pec').value = '';
  cmShowStep('cm-step-altro');
  setTimeout(() => _cm('cm-altro-nome').focus(), 50);
}

function cmSubmitPubblica() {
  // v296.1 — ente scelto dall'Indice PA: PEC ufficiale, niente da validare.
  if (cmState.ipa) {
    const e = cmState.ipa;
    cmState.pec = e.pec || '';
    _cm('f-ente').value = e.nome || '';
    _cm('f-pec').value = e.pec || '';
    _cm('f-company-type').value = 'pubblica';
    _cm('f-azienda-tipo').value = e.tipologia || '';
    _cm('f-azienda-citta').value = e.comune || '';
    _cm('f-azienda-prov').value = e.prov || '';
    // v324.6 — Se l'ente veniva dal nostro archivio ed e' stato riconosciuto
    // in IPA, l'IDASL va conservato: senza, il submit non riaggancia il record
    // e l'ente finisce in coda come "nuovo da censire" (caso 1355-2 AMATULLI).
    _cm('f-dbao-id').value = (cmState.struttura && cmState.struttura.ID)
                             ? String(cmState.struttura.ID) : '';
    _cm('f-ipa-cod').value = e.cod || '';
    updateAziendaSummary();
    closeCompanyModal();
    return;
  }
  _cm('f-ipa-cod').value = '';
  const pec = (_cm('cm-pub-pec').value || '').trim();
  if (!pec) {
    showFormMsg('La PEC è obbligatoria. Se non la conosce, la cerchi sul cedolino o sul sito dell’ente.', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pec)) {
    showFormMsg('Formato PEC non valido. Esempio: protocollo@pec.ente.it', 'error');
    return;
  }
  const rec = cmState.struttura;
  if (!rec) return;
  cmState.pec = pec;
  // Salva nei hidden del form principale
  _cm('f-ente').value = rec.NOME || '';
  _cm('f-pec').value = pec;
  _cm('f-company-type').value = 'pubblica';
  _cm('f-azienda-tipo').value = rec.TIPO || '';
  _cm('f-azienda-citta').value = rec.CITTA || '';
  _cm('f-azienda-prov').value = (rec.Prov || rec.PROV || '');
  _cm('f-dbao-id').value = String(rec.ID || '');
  updateAziendaSummary();
  closeCompanyModal();
}

function cmSubmitAltro() {
  const nome = (_cm('cm-altro-nome').value || '').trim();
  const tipo = (_cm('cm-altro-tipo').value || '').trim();
  const pec = (_cm('cm-altro-pec').value || '').trim();
  if (!nome) { showFormMsg('Indichi il nome dell’ente.', 'error'); return; }
  if (!tipo) { showFormMsg('Selezioni la tipologia.', 'error'); return; }
  if (!pec)  { showFormMsg('La PEC è obbligatoria.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pec)) {
    showFormMsg('Formato PEC non valido. Esempio: protocollo@pec.ente.it', 'error'); return;
  }
  cmState.altro_nome = nome;
  cmState.altro_tipo = tipo;
  cmState.pec = pec;
  cmState.struttura = null; // reset (Altro = no DBAO match)
  // Salva nei hidden
  _cm('f-ente').value = nome;
  _cm('f-pec').value = pec;
  _cm('f-company-type').value = 'pubblica';   // resta pubblica (Opzione B/C)
  _cm('f-azienda-tipo').value = tipo;
  _cm('f-azienda-citta').value = cmState.citta || '';
  _cm('f-azienda-prov').value = cmState.prov || '';
  _cm('f-dbao-id').value = '';   // niente ID DBAO → backend creerà PENDING_NEW
  updateAziendaSummary();
  closeCompanyModal();
}

function updateAziendaSummary() {
  // v386.3 — a ogni cambio di azienda si rivaluta il 3.1 bis (contratto-ente.js)
  if (typeof rapportoEnteCheck === 'function') setTimeout(rapportoEnteCheck, 0);
  // Aggiorna la card riassunto in Step 3 in base a quanto scelto nel modale.
  // v299.0 — punto unico in cui l'azienda cambia: da qui si rivaluta anche la
  // coerenza con la risposta 3.2.
  setTimeout(univCoerenza, 0);
  const sum = _cm('azienda-summary');
  if (!sum) return;
  const type = (_cm('f-company-type').value || '').toLowerCase();
  const ente = _cm('f-ente').value || '';
  const pec = _cm('f-pec').value || '';
  const tipo = _cm('f-azienda-tipo').value || '';
  const citta = _cm('f-azienda-citta').value || '';
  const prov = _cm('f-azienda-prov').value || '';
  if (!ente) {
    sum.className = 'azienda-summary-empty';
    sum.innerHTML = '<span>Clicca per indicare la sua azienda di appartenenza</span>';
    return;
  }
  sum.className = 'azienda-summary';
  let metaParts = [];
  if (type === 'pubblica') {
    if (tipo) metaParts.push('<b>' + tipo + '</b>');
    if (citta) metaParts.push(citta + (prov ? ' (' + prov + ')' : ''));
  } else if (type === 'privata') {
    metaParts.push('<i>Privata / Altro</i>');
  } else {
    // v128.3 — Tipologia ignota (pre-fill da DBDOC senza dbao_id né company_type)
    sum.className = 'azienda-summary azienda-summary-pending';
    metaParts.push('<i style="color:#92400e">⚠ Tipologia da confermare</i>');
  }
  let html = '<div class="azienda-summary-info">';
  html += '<div class="name">' + ente.replace(/</g, '&lt;') + '</div>';
  if (metaParts.length) html += '<div class="meta">' + metaParts.join(' · ') + '</div>';
  if (pec) html += '<div class="pec">📧 ' + pec.replace(/</g, '&lt;') + '</div>';
  html += '</div>';
  html += '<button class="edit-btn" onclick="event.stopPropagation();openCompanyModal()">✏️ Modifica</button>';
  sum.innerHTML = html;
}
