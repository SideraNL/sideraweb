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
   «dipendente pubblico» al 5.1 (caso Schiavoni 1361-5). L'elenco arriva dal
   prefill (`enti_privati`, da config.py via ente_privato() di MedFIND): un ID
   DBAO noto o un nome che lo rivela, salvo che il nome contenga anche un ente
   pubblico.
   v398.2 — Non si conferma piu': le due risposte devono coincidere (ente
   pubblico + dipendente pubblico, oppure ente privato + non dipendente). Si
   torna al 3.1 o si corregge il 5.1; dal terzo Avanti bloccato compare
   «Segnala a Sidera», che avvisa Sidera con un'email (contratto_segnala.php). */
let _ENTI_PRIVATI = null;
let _a3PrivConf = '';      // 'no' se ha corretto il 5.1 dall'avviso
let _a3PrivConfEnte = '';  // ente a cui si riferisce la correzione
let _a3PrivTentativi = 0;  // Avanti bloccati dall'incoerenza
let _a3PrivSegnalata = false;
const A3_PRIV_TENTATIVI = 3;

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
  // Il 3.2 «professore di ateneo statale» ha il suo controllo (univCoerenza)
  // e nasconde il 5.1: qui solo la risposta data al 5.1.
  return A3.dip === 'si' && !a3ModoUniversitario() && _entePrivatoForm();
}

// Chiamata da a3Calcola: mostra il riquadro e, dal terzo tentativo, la segnalazione.
function a3PrivatoAggiorna() {
  const dov = _a3PrivatoDovuta();
  const bx = $('a3-priv-conferma');
  if (bx) bx.style.display = dov ? '' : 'none';
  if (!dov) return;
  if ($('a3-priv-ente')) $('a3-priv-ente').textContent = (($('f-ente') || {}).value || '').trim();
  const sg = $('a3-priv-segnala');
  if (sg) sg.style.display = (_a3PrivTentativi >= A3_PRIV_TENTATIVI) ? '' : 'none';
}

function a3PrivatoRisposta(v) {
  if (v !== 'no') return;
  _a3PrivConf = v;
  _a3PrivConfEnte = (($('f-ente') || {}).value || '').trim();
  // Corregge il 5.1: da qui il form prosegue come per un dipendente privato.
  document.querySelectorAll('input[name="a3-dip"]').forEach(r => { r.checked = (r.value === 'no'); });
  a3Calcola();
  const q2 = $('a3-q2');
  if (q2) q2.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Torna al passo 3 e indica la card dell'azienda. Non apre il modale da solo:
// entrando nel passo 3 renderStep puo' gia' aprirne uno (ECM, tipologia).
function a3PrivatoCambiaEnte() {
  const i = getCurrentSteps().indexOf('3');
  if (i < 0) return;
  CURRENT_STEP_INDEX = i;
  renderStep();
  showFormMsg('Clicchi sulla card dell’azienda (punto 3.1) per indicare l’ente di cui è dipendente.', 'info');
  setTimeout(() => {
    const card = $('azienda-summary');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.style.outline = '3px solid #f59e0b';
    card.style.outlineOffset = '3px';
    setTimeout(() => { card.style.outline = ''; }, 4000);
  }, 400);
}

function _a3PrivatoRispostaTesto() {
  const r = document.querySelector('input[name="a3-dip"]:checked');
  const lb = r && r.closest('label');
  return lb ? lb.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
}

async function a3PrivatoSegnala() {
  const btn = $('a3-priv-segnala-btn');
  const out = $('a3-priv-segnala-esito');
  const esito = (msg, ok) => { if (out) { out.textContent = msg; out.style.color = ok ? '#15803d' : '#b91c1c'; } };
  if (_a3PrivSegnalata) { esito('Segnalazione già inviata: Sidera La ricontatterà.', true); return; }
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    esito('Prova in locale: nessuna email inviata.', true);
    return;
  }
  if (btn) btn.disabled = true;
  try {
    const r = await fetch(HOSTINGER_URL + '/contratto_segnala.php', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: TOKEN,
        ente: (($('f-ente') || {}).value || '').trim(),
        risposta: _a3PrivatoRispostaTesto(),
        tentativi: _a3PrivTentativi,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!d.ok) throw new Error(d.error || 'invio non riuscito');
    _a3PrivSegnalata = true;
    esito('Segnalazione inviata: Sidera La ricontatterà. Può chiudere la pagina e riprendere dallo stesso link.', true);
  } catch (e) {
    if (btn) btn.disabled = false;
    esito('Non è stato possibile inviare la segnalazione (' + e.message + '). Scriva a sidera@sideraweb.com.', false);
  }
}

// Validazione del passo: true = blocca.
function a3PrivatoBloccante() {
  a3PrivatoAggiorna();  // l'ente puo' essere cambiato al 3.1 dopo il 5.1
  if (!_a3PrivatoDovuta()) return false;
  _a3PrivTentativi++;
  a3PrivatoAggiorna();
  showFormMsg('L’ente indicato al punto 3.1 è di diritto privato: cambi l’ente o corregga la risposta al punto 5.1.', 'error');
  const bx = $('a3-priv-conferma');
  if (bx) bx.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return true;
}

// Per il submit (art3.privato_conferma): 'no' se ha corretto il 5.1
// dall'avviso, '' altrimenti. Con l'ente privato non si arriva piu' al submit
// da dipendente pubblico, quindi 'si' non esiste piu' (v398.2).
function a3PrivatoValore() {
  return (_a3PrivConf === 'no' && A3.dip === 'no' && _a3PrivConfEnte === (($('f-ente') || {}).value || '').trim()) ? 'no' : '';
}

/* v400.1 — Ente pubblico in archivio senza PEC (Nicola 03/11/2026). Quasi sempre
   e' un presidio ospedaliero, che non e' un ente a se': il datore di lavoro e'
   l'azienda sanitaria da cui dipende, e la PEC per l'informativa e' la sua.
   Lo chiediamo al relatore, scegliendo dall'Indice PA che porta anche la PEC.
   Mappare i presidi in blocco per provincia dava errori (privati agganciati a
   un'ASL, Thiene sull'ULSS sbagliata): lo sa meglio lui. */
function cmPubblicaSenzaPec() {
  if ((($('f-company-type') || {}).value || '').toLowerCase() !== 'pubblica') return false;
  if ((($('f-pec') || {}).value || '').trim()) return false;
  const nome = _cmSoloDenominazione((($('f-ente') || {}).value || '').trim());
  const box = $('cm-ipa-presidio');
  if (box) {
    box.innerHTML = 'Nei nostri archivi risulta <b>' + _cfEsc(nome || 'una struttura') + '</b>, '
      + 'senza l’indicazione dell’ente da cui dipende. Se è un ospedale di un’ASL/ASST/ULSS '
      + 'o di un’azienda ospedaliera, cerchi qui sotto <b>l’azienda</b> che Le paga lo stipendio: '
      + 'a lei invieremo le comunicazioni previste per i dipendenti pubblici. '
      + 'Se invece non è dipendente pubblico, torni indietro e scelga «Privata / altro».';
    box.style.display = '';
  }
  cmState.type = 'pubblica';
  $('cm-ipa-q').value = '';
  $('cm-ipa-prov').value = cmState.prov || (($('f-azienda-prov') || {}).value || '');
  cmState.ipa_tutti = false;
  $('cm-ipa-estendi').style.display = '';
  cmShowStep('cm-step-ipa');
  $('cm-overlay').style.display = 'flex';
  setTimeout(() => { $('cm-ipa-q').focus(); cmIpaSearch(); }, 50);
  return true;
}
