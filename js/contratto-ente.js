// contratto-ente.js — coerenza fra ente dichiarato e posizione di dipendente
// pubblico (v386.3). Scorporato da contratto-form.js (budget R09 2700 righe).
// Caricato DOPO contratto-form.js: usa $, A3, a3ModoUniversitario, openCompanyModal.
// Le funzioni sono chiamate solo a form avviato, quindi l'ordine di definizione
// rispetto a contratto-form.js non conta.

/* v386.3 — Coerenza fra «azienda privata» e un ente che pare pubblico
   (caso Carra' 1355-5: professore di ateneo statale, azienda scritta a mano
   come privata, Opzione A forzata, InfPre/InfPost mai partite). Gemello
   lato MedFIND: blueprints/contratti_coerenza_ente.py (_RE_PUBBLICO). */
const _RE_ENTE_PUBBLICO = /^(UNIVERSIT[AÀ']|POLITECNICO|SCUOLA (NORMALE|SUPERIORE)|A\.?S\.?L\b|ASST\b|ATS\b|AUSL\b|A\.?U\.?S\.?L\b|ULSS\b|ASP\b|ASUFC|ASUGI|ASFO|ESTAR\b|AZIENDA (SANITARIA|OSPEDALIER|SOCIO|USL|U\.?S\.?L|ULSS|UNIT|ZERO|REGIONALE)|AZIENDA OSPEDALIERO|OSPEDALE|PRESIDIO OSPEDALIERO|IRCCS|I\.R\.C\.C\.S|POLICLINICO|MINISTERO|REGIONE|COMUNE DI|PROVINCIA (DI|AUTONOMA)|ISTITUTO SUPERIORE DI SANIT|CONSIGLIO NAZIONALE DELLE RICERCHE|CNR\b|INAIL|INPS|AGENZIA)/i;

// Termini che non lasciano dubbi anche in mezzo al nome («Dipartimento di
// Fisica - Università degli Studi di Pisa»). Gli altri restano ancorati
// all'inizio: «Casa di cura X convenzionata ASL» non e' un'ASL.
const _RE_ENTE_PUBBLICO_OVUNQUE = /(UNIVERSIT[AÀ'] DEGLI STUDI|\bASST\b|AZIENDA SOCIO.SANITARIA|AZIENDA OSPEDALIER|AZIENDA SANITARIA|AZIENDA U\.?S\.?L)/i;

function _privataMaPubblica() {
  const ctype = (($('f-company-type') || {}).value || '').toLowerCase();
  if (ctype !== 'privata') return '';
  const ente = (($('f-ente') || {}).value || '').trim();
  if (!ente) return '';
  // v398.1 — «Policlinico Gemelli IRCCS» sembra pubblico dal nome ma non lo e'.
  if ((_RE_ENTE_PUBBLICO.test(ente) || _RE_ENTE_PUBBLICO_OVUNQUE.test(ente)) && !_entePrivatoForm()) return 'nome';
  if (a3ModoUniversitario()) return 'univ';
  const dip = (($('f-dip-pubblico') || {}).value || '').trim();
  if (dip === '1' || dip === '3') return 'anagrafica';
  return '';
}

function rapportoEnteCheck() {
  const row = $('rapporto-ente-row');
  const motivo = _privataMaPubblica();
  if (!row) return !!motivo;
  row.style.display = motivo ? '' : 'none';
  if (motivo) {
    $('rapporto-ente-nome').textContent = (($('f-ente') || {}).value || '').trim();
    $('rapporto-ente-perche').innerHTML = {
      nome: 'L’ha indicata come azienda <b>privata</b>, ma dal nome sembra una pubblica amministrazione.',
      univ: 'L’ha indicata come azienda <b>privata</b>, ma al punto 3.2 ha dichiarato di essere professore o ricercatore di un’università statale.',
      anagrafica: 'L’ha indicata come azienda <b>privata</b>, ma nei nostri archivi risulta dipendente pubblico.',
    }[motivo] + ' Da questo dipendono le comunicazioni che la legge ci chiede di fare al Suo ente.';
  }
  onRapportoEnteChange();
  return !!motivo;
}

function onRapportoEnteChange() {
  const rr = document.querySelector('input[name="f-rapporto-ente"]:checked');
  const av = $('rapporto-ente-avviso');
  if (av) av.style.display = (rr && rr.value.startsWith('dipendente') && _privataMaPubblica()) ? '' : 'none';
}

function _a3RappConfermaDovuta() {
  const ctype = (($('f-company-type') || {}).value || '').toLowerCase();
  // v398.1 — un ente privato scelto fra le «pubbliche» (es. Gemelli da IPA) non
  // e' una pubblica amministrazione: niente richiesta di conferma.
  return ctype === 'pubblica' && A3.dip === 'no' && A3.vinc === 'nessuno' && !_entePrivatoForm();
}

/* Quello che MedFIND legge per non segnalare il contratto: 'non_dipendente'
   o 'privato' chiudono il caso, vuoto lo lascia da guardare. */
function rapportoEnteValore() {
  if (_privataMaPubblica()) {
    const rr = document.querySelector('input[name="f-rapporto-ente"]:checked');
    return rr ? rr.value : '';
  }
  if (_a3RappConfermaDovuta() && ($('f-rapp-conferma') || {}).checked) return 'non_dipendente';
  return '';
}

/* v398.1 — Ente di diritto privato (Gemelli, Cattolica, Humanitas…) e risposta
   «dipendente pubblico a tempo pieno» al 5.1: il relatore conferma o corregge
   (caso Schiavoni 1361-5). L'elenco arriva dal prefill (`enti_privati`, da
   config.py via ente_privato() di MedFIND): un ID DBAO noto o un nome che lo
   rivela, salvo che il nome contenga anche un ente pubblico. */
let _ENTI_PRIVATI = null;
let _a3PrivConf = '';      // 'si' | 'no' | ''
let _a3PrivConfEnte = '';  // ente a cui si riferisce la risposta

function entiPrivatiInit(d) {
  if (!d || !Array.isArray(d.ids)) return;
  try {
    _ENTI_PRIVATI = {
      ids: new Set(d.ids.map(Number)),
      re: d.privati ? new RegExp(d.privati, 'i') : null,
      rePub: d.pubblici_nel_nome ? new RegExp(d.pubblici_nel_nome, 'i') : null,
    };
  } catch (e) { _ENTI_PRIVATI = null; }
}

function _entePrivatoForm() {
  if (!_ENTI_PRIVATI) return false;
  const nome = (($('f-ente') || {}).value || '').trim();
  if (nome && _ENTI_PRIVATI.rePub && _ENTI_PRIVATI.rePub.test(nome)) return false;
  const id = Number((($('f-dbao-id') || {}).value || '').trim());
  if (id && _ENTI_PRIVATI.ids.has(id)) return true;
  return !!nome && !!_ENTI_PRIVATI.re && _ENTI_PRIVATI.re.test(nome);
}

function _a3PrivatoDovuta() {
  return A3.reg_raw === 'pieno' && _entePrivatoForm();
}

function _a3PrivConfValida() {
  return _a3PrivConf === 'si' && _a3PrivConfEnte === (($('f-ente') || {}).value || '').trim();
}

// Chiamata da a3Calcola: mostra il riquadro e lo stato dei due bottoni.
function a3PrivatoAggiorna() {
  const dov = _a3PrivatoDovuta();
  const bx = $('a3-priv-conferma');
  if (bx) bx.style.display = dov ? '' : 'none';
  // Un «Sì» vale per la risposta a cui e' stato dato: se il 5.1 cambia, si
  // richiede di nuovo.
  if (!dov && _a3PrivConf === 'si') _a3PrivConf = '';
  if (!dov) return;
  if ($('a3-priv-ente')) $('a3-priv-ente').textContent = (($('f-ente') || {}).value || '').trim();
  const si = $('a3-priv-si');
  if (si) {
    const on = _a3PrivConfValida();
    si.style.background = on ? '#1a56db' : '#fff';
    si.style.color = on ? '#fff' : '#1a56db';
    si.textContent = on ? '✓ Sì, confermo' : 'Sì, confermo';
  }
}

function a3PrivatoRisposta(v) {
  _a3PrivConf = v;
  _a3PrivConfEnte = (($('f-ente') || {}).value || '').trim();
  if (v === 'no') {
    // Corregge il 5.1: da qui il form prosegue come per un dipendente privato.
    document.querySelectorAll('input[name="a3-dip"]').forEach(r => { r.checked = (r.value === 'no'); });
    a3Calcola();
    const q2 = $('a3-q2');
    if (q2) q2.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  a3PrivatoAggiorna();
}

// Validazione del passo: true = blocca.
function a3PrivatoBloccante() {
  a3PrivatoAggiorna();  // l'ente puo' essere cambiato al 3.1 dopo il 5.1
  if (!_a3PrivatoDovuta() || _a3PrivConfValida()) return false;
  showFormMsg('Il Suo ente risulta di diritto privato: confermi o corregga la risposta al punto 5.1.', 'error');
  const bx = $('a3-priv-conferma');
  if (bx) bx.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return true;
}

// Per il submit (art3.privato_conferma): 'si' se ha confermato con l'avviso
// a schermo, 'no' se l'ha corretto, '' se l'avviso non e' mai comparso.
function a3PrivatoValore() {
  if (_a3PrivatoDovuta()) return _a3PrivConfValida() ? 'si' : '';
  return (_a3PrivConf === 'no' && A3.dip === 'no' && _a3PrivConfEnte === (($('f-ente') || {}).value || '').trim()) ? 'no' : '';
}
