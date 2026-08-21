// static/js/contratto-form.js — form pubblico Fase 2 (contratto.html)
// v306.9: estratto dal <script> inline di contratto.html (era 3320 righe) per R09.
// Motore multi-step del form relatore: state/nav, IBAN, CF, opzione art.3 AUT,
// CDI/CV semplificato, modale azienda (cm*), modale ECM (em*).

// ── Strada B (Opzione A) — backend GAS Web App ────────────────────────────
// Il form è statico su sideraweb.com (GitHub Pages). Per prefill/submit chiama
// un GAS Web App pubblico che fa da proxy verso un Google Sheet "Contratti".
// MedFIND polla quel Sheet quando è acceso e processa i submit pendenti.
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxUciq4e30VetpXvNSqfv3d0axKCh8G65JMHTx2YTDuXolEUJMTIbwdOWrFX850yhM0/exec';

let TOKEN = '';
let CURRENT_STEP_INDEX = 0;
let CLAUSOLE_LOADED = false;
let CLAUSOLE_INLINE = null;  // Strada B: clausole arrivano dentro al prefill

// v128.0 — Tabelle AGENAS Allegato F+G v1.24 (31 professioni + 121 discipline)
// Embedded statico: cambiano raramente (versioni 1.20→1.24 in molti anni).
// Per aggiornare: rigenera con `python scripts/rebuild_codici_agenas.py` poi sostituisci sotto.
const AGENAS_DATA = {"professioni":[{"cod":1,"nome":"MEDICO CHIRURGO"},{"cod":2,"nome":"ODONTOIATRA"},{"cod":3,"nome":"FARMACISTA"},{"cod":4,"nome":"VETERINARIO"},{"cod":5,"nome":"PSICOLOGO"},{"cod":6,"nome":"BIOLOGO"},{"cod":7,"nome":"CHIMICO"},{"cod":8,"nome":"FISICO"},{"cod":9,"nome":"ASSISTENTE SANITARIO"},{"cod":10,"nome":"DIETISTA"},{"cod":11,"nome":"EDUCATORE PROFESSIONALE"},{"cod":12,"nome":"FISIOTERAPISTA"},{"cod":13,"nome":"IGIENISTA DENTALE"},{"cod":14,"nome":"INFERMIERE"},{"cod":15,"nome":"INFERMIERE PEDIATRICO"},{"cod":16,"nome":"LOGOPEDISTA"},{"cod":17,"nome":"ORTOTTISTA/ASSISTENTE DI OFTALMOLOGIA"},{"cod":18,"nome":"OSTETRICA/O"},{"cod":19,"nome":"PODOLOGO"},{"cod":20,"nome":"TECNICO AUDIOMETRISTA"},{"cod":21,"nome":"TECNICO AUDIOPROTESISTA"},{"cod":22,"nome":"TECNICO DELLA FISIOPATOLOGIA CARDIOCIRCOLATORIA E PERFUSIONE CARDIOVASCOLARE"},{"cod":23,"nome":"TECNICO DELLA PREVENZIONE NELL'AMBIENTE E NEI LUOGHI DI LAVORO"},{"cod":24,"nome":"TECNICO DELLA RIABILITAZIONE PSICHIATRICA"},{"cod":25,"nome":"TECNICO DI NEUROFISIOPATOLOGIA"},{"cod":26,"nome":"TECNICO ORTOPEDICO"},{"cod":27,"nome":"TECNICO SANITARIO DI RADIOLOGIA MEDICA"},{"cod":28,"nome":"TECNICO SANITARIO LABORATORIO BIOMEDICO"},{"cod":29,"nome":"TERAPISTA DELLA NEURO E PSICOMOTRICITA' DELL'ETA' EVOLUTIVA"},{"cod":30,"nome":"TERAPISTA OCCUPAZIONALE"},{"cod":33,"nome":"MASSOFISIOTERAPISTA ISCRITTO ALL'ELENCO SPECIALE EX ART.5 D.M. 9 AGOSTO 2019"}],"discipline_per_prof":{"1":[{"cod":1,"nome":"ALLERGOLOGIA ED IMMUNOLOGIA CLINICA"},{"cod":42,"nome":"ANATOMIA PATOLOGICA"},{"cod":43,"nome":"ANESTESIA E RIANIMAZIONE"},{"cod":2,"nome":"ANGIOLOGIA"},{"cod":111,"nome":"AUDIOLOGIA E FONIATRIA"},{"cod":44,"nome":"BIOCHIMICA CLINICA"},{"cod":29,"nome":"CARDIOCHIRURGIA"},{"cod":3,"nome":"CARDIOLOGIA"},{"cod":30,"nome":"CHIRURGIA GENERALE"},{"cod":31,"nome":"CHIRURGIA MAXILLO-FACCIALE"},{"cod":32,"nome":"CHIRURGIA PEDIATRICA"},{"cod":33,"nome":"CHIRURGIA PLASTICA E RICOSTRUTTIVA"},{"cod":34,"nome":"CHIRURGIA TORACICA"},{"cod":35,"nome":"CHIRURGIA VASCOLARE"},{"cod":59,"nome":"CONTINUITA' ASSISTENZIALE"},{"cod":114,"nome":"CURE PALLIATIVE"},{"cod":4,"nome":"DERMATOLOGIA E VENEREOLOGIA"},{"cod":107,"nome":"DIREZIONE MEDICA DI PRESIDIO OSPEDALIERO"},{"cod":5,"nome":"EMATOLOGIA"},{"cod":6,"nome":"ENDOCRINOLOGIA"},{"cod":115,"nome":"EPIDEMIOLOGIA"},{"cod":45,"nome":"FARMACOLOGIA E TOSSICOLOGIA CLINICA"},{"cod":7,"nome":"GASTROENTEROLOGIA"},{"cod":8,"nome":"GENETICA MEDICA"},{"cod":9,"nome":"GERIATRIA"},{"cod":36,"nome":"GINECOLOGIA E OSTETRICIA"},{"cod":56,"nome":"IGIENE DEGLI ALIMENTI E DELLA NUTRIZIONE"},{"cod":55,"nome":"IGIENE, EPIDEMIOLOGIA E SANITA' PUBBLICA"},{"cod":46,"nome":"LABORATORIO DI GENETICA MEDICA"},{"cod":11,"nome":"MALATTIE DELL'APPARATO RESPIRATORIO"},{"cod":12,"nome":"MALATTIE INFETTIVE"},{"cod":10,"nome":"MALATTIE METABOLICHE E DIABETOLOGIA"},{"cod":17,"nome":"MEDICINA AERONAUTICA E SPAZIALE"},{"cod":13,"nome":"MEDICINA D'EMERGENZA-URGENZA"},{"cod":57,"nome":"MEDICINA DEL LAVORO E SICUREZZA DEGLI AMBIENTI DI LAVORO"},{"cod":18,"nome":"MEDICINA DELLO SPORT"},{"cod":116,"nome":"MEDICINA DI COMUNITA' E DELLE CURE PRIMARIE"},{"cod":14,"nome":"MEDICINA FISICA E RIABILITAZIONE"},{"cod":58,"nome":"MEDICINA GENERALE (MEDICI DI FAMIGLIA)"},{"cod":15,"nome":"MEDICINA INTERNA"},{"cod":48,"nome":"MEDICINA LEGALE"},{"cod":49,"nome":"MEDICINA NUCLEARE"},{"cod":117,"nome":"MEDICINA SUBACQUEA E IPERBARICA"},{"cod":16,"nome":"MEDICINA TERMALE"},{"cod":47,"nome":"MEDICINA TRASFUSIONALE"},{"cod":50,"nome":"MICROBIOLOGIA E VIROLOGIA"},{"cod":19,"nome":"NEFROLOGIA"},{"cod":20,"nome":"NEONATOLOGIA"},{"cod":37,"nome":"NEUROCHIRURGIA"},{"cod":51,"nome":"NEUROFISIOPATOLOGIA"},{"cod":21,"nome":"NEUROLOGIA"},{"cod":22,"nome":"NEUROPSICHIATRIA INFANTILE"},{"cod":52,"nome":"NEURORADIOLOGIA"},{"cod":38,"nome":"OFTALMOLOGIA"},{"cod":23,"nome":"ONCOLOGIA"},{"cod":108,"nome":"ORGANIZZAZIONE DEI SERVIZI SANITARI DI BASE"},{"cod":39,"nome":"ORTOPEDIA E TRAUMATOLOGIA"},{"cod":40,"nome":"OTORINOLARINGOIATRIA"},{"cod":53,"nome":"PATOLOGIA CLINICA (LABORATORIO DI ANALISI CHIMICO-CLINICHE E MICROBIOLOGIA)"},{"cod":24,"nome":"PEDIATRIA"},{"cod":60,"nome":"PEDIATRIA (PEDIATRI DI LIBERA SCELTA)"},{"cod":113,"nome":"PRIVO DI SPECIALIZZAZIONE"},{"cod":25,"nome":"PSICHIATRIA"},{"cod":112,"nome":"PSICOTERAPIA"},{"cod":54,"nome":"RADIODIAGNOSTICA"},{"cod":26,"nome":"RADIOTERAPIA"},{"cod":27,"nome":"REUMATOLOGIA"},{"cod":106,"nome":"SCIENZA DELL'ALIMENTAZIONE E DIETETICA"},{"cod":41,"nome":"UROLOGIA"}],"2":[{"cod":64,"nome":"ODONTOIATRIA"}],"3":[{"cod":118,"nome":"FARMACISTA DI ALTRO SETTORE"},{"cod":66,"nome":"FARMACISTA PUBBLICO DEL SSN"},{"cod":67,"nome":"FARMACISTA TERRITORIALE"}],"4":[{"cod":61,"nome":"IGIENE DEGLI ALLEVAMENTI E DELLE PRODUZIONI ZOOTECNICHE"},{"cod":62,"nome":"IGIENE PROD., TRASF., COMMERCIAL., CONSERV. E TRAS. ALIMENTI DI ORIGINE ANIMALE E DERIVATI"},{"cod":63,"nome":"SANITA' ANIMALE"}],"5":[{"cod":78,"nome":"PSICOLOGIA"},{"cod":77,"nome":"PSICOTERAPIA"}],"6":[{"cod":68,"nome":"BIOLOGO"}],"7":[{"cod":76,"nome":"CHIMICA"}],"8":[{"cod":79,"nome":"FISICA"}],"9":[{"cod":80,"nome":"ASSISTENTE SANITARIO"}],"10":[{"cod":81,"nome":"DIETISTA"},{"cod":119,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"}],"11":[{"cod":83,"nome":"EDUCATORE PROFESSIONALE"},{"cod":120,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"}],"12":[{"cod":82,"nome":"FISIOTERAPISTA"},{"cod":121,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"}],"13":[{"cod":84,"nome":"IGIENISTA DENTALE"},{"cod":122,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"}],"14":[{"cod":85,"nome":"INFERMIERE"}],"15":[{"cod":86,"nome":"INFERMIERE PEDIATRICO"}],"16":[{"cod":123,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":87,"nome":"LOGOPEDISTA"}],"17":[{"cod":124,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":88,"nome":"ORTOTTISTA/ASSISTENTE DI OFTALMOLOGIA"}],"18":[{"cod":89,"nome":"OSTETRICA/O"}],"19":[{"cod":125,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":90,"nome":"PODOLOGO"}],"20":[{"cod":126,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":95,"nome":"TECNICO AUDIOMETRISTA"}],"21":[{"cod":127,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":96,"nome":"TECNICO AUDIOPROTESISTA"}],"22":[{"cod":128,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":92,"nome":"TECNICO DELLA FISIOPATOLOGIA CARDIOCIRCOLATORIA E PERFUSIONE CARDIOVASCOLARE"}],"23":[{"cod":129,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":105,"nome":"TECNICO DELLA PREVENZIONE NELL'AMBIENTE E NEI LUOGHI DI LAVORO"}],"24":[{"cod":130,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":91,"nome":"TECNICO DELLA RIABILITAZIONE PSICHIATRICA"}],"25":[{"cod":131,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":98,"nome":"TECNICO DI NEUROFISIOPATOLOGIA"}],"26":[{"cod":132,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":99,"nome":"TECNICO ORTOPEDICO"}],"27":[{"cod":94,"nome":"TECNICO SANITARIO DI RADIOLOGIA MEDICA"}],"28":[{"cod":133,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":93,"nome":"TECNICO SANITARIO LABORATORIO BIOMEDICO"}],"29":[{"cod":134,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":100,"nome":"TERAPISTA DELLA NEURO E PSICOMOTRICITA' DELL'ETA' EVOLUTIVA"}],"30":[{"cod":135,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO"},{"cod":101,"nome":"TERAPISTA OCCUPAZIONALE"}],"33":[{"cod":136,"nome":"ISCRITTO NELL'ELENCO SPECIALE AD ESAURIMENTO EX ART.5 D.M. 09.08.2019"}]}};

const FIELDS = [
  'cognome','nome','cf','nato_il','nato_a','provincia',
  'indirizzo','cap','citta','cellulare','email',
  'ente','pec','qualifica','specialita',
  'iban','partita_iva',
];

// 110 province italiane + EE = Estero
const PROVINCE_IT = [
  'AG','AL','AN','AO','AP','AQ','AR','AT','AV',
  'BA','BG','BI','BL','BN','BO','BR','BS','BT','BZ',
  'CA','CB','CE','CH','CL','CN','CO','CR','CS','CT','CZ',
  'EN',
  'FC','FE','FG','FI','FM','FR',
  'GE','GO','GR',
  'IM','IS',
  'KR',
  'LC','LE','LI','LO','LT','LU',
  'MB','MC','ME','MI','MN','MO','MS','MT',
  'NA','NO','NU',
  'OR',
  'PA','PC','PD','PE','PG','PI','PN','PO','PR','PT','PU','PV','PZ',
  'RA','RC','RE','RG','RI','RM','RN','RO',
  'SA','SI','SO','SP','SR','SS','SU',
  'TA','TE','TN','TO','TP','TR','TS','TV',
  'UD',
  'VA','VB','VC','VE','VI','VR','VT','VV',
];
const STEP_NAMES = {
  '1': 'Dati anagrafici',
  '2': 'Residenza e contatti',
  '3': 'Attività professionale',
  '4': 'Dati fiscali e bancari',
  '5': 'Autorizzazione (ART. 3)',
  '6': 'ART. 3 BIS — Pagamento e documentazione',
  'cv': 'Curriculum',
  'cdi': 'Conflitto di interesse',
  'final': 'Riepilogo e invio',
};

// v289.9 — Campi del curriculum semplificato. Devono corrispondere a CV_FIELDS
// in blueprints/contratti_cv.py: il backend accetta solo queste chiavi.
const CV_FIELDS = [
  'albo_ordine', 'albo_provincia', 'albo_numero',
  'laurea', 'laurea_universita', 'laurea_data',
  'qualifica', 'sede',   // v316.3 — via 'specializzazioni' (colonna 3-19 ritirata)
  'professione', 'disciplina', 'note_extra',
];
// v290.3 — Il numero di iscrizione all'albo è obbligatorio solo per i medici.
// Le altre professioni sanitarie hanno albi con numerazioni che il relatore non
// ha sempre sottomano, e bloccare la firma su un dato che non ricorda sarebbe
// un ostacolo pagato per niente: nel curriculum ECM il numero pesa per il
// medico, non per gli altri.
const CV_OBBLIGATORI = { laurea: 'Laurea' };
const CV_RX_MEDICO = /MEDIC(O|I)\b|ODONTOIATR/i;

function cvEMedico() {
  const daCv = ($('f-cv-professione') || {}).value || '';
  const daOrdine = ($('f-cv-albo_ordine') || {}).value || '';
  const daStep3 = ($('f-qualifica') || {}).value || '';
  const sel = $('f-prof-select');
  const daSelect = (sel && sel.selectedIndex >= 0 && sel.options[sel.selectedIndex])
    ? sel.options[sel.selectedIndex].text : '';
  return CV_RX_MEDICO.test(`${daCv} ${daOrdine} ${daStep3} ${daSelect}`);
}

function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function showState(which) {
  ['loading-screen','error-screen','success-screen','form-screen'].forEach(id => {
    $(id).style.display = (id === which) ? (which === 'form-screen' ? 'block' : 'block') : 'none';
  });
  if (which === 'success-screen') window.scrollTo(0, 0);
}

function showError(msg) { $('error-msg').textContent = msg; showState('error-screen'); }

function populateProvince() {
  const sel = $('f-provincia');
  if (!sel) return;
  let html = '<option value="">— seleziona —</option>';
  for (const sigla of PROVINCE_IT) html += `<option value="${sigla}">${sigla}</option>`;
  html += '<option value="EE">EE — Estero</option>';
  sel.innerHTML = html;
}

function normalizeDateInput(v) {
  if (!v) return '';
  const s = String(v).trim();
  // v128.4 — ISO format yyyy-mm-dd [HH:MM:SS] (datetime serializzato): converte a dd/mm/yyyy
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (!m) return s;
  let dd = m[1].padStart(2, '0');
  let mm = m[2].padStart(2, '0');
  let yy = m[3];
  if (yy.length === 2) {
    const yi = parseInt(yy, 10);
    yy = (yi <= 30) ? String(2000 + yi) : String(1900 + yi);
  }
  return `${dd}/${mm}/${yy}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// v141.0 — Info box per messaggi di validazione (sostituisce alert() del browser).
// Sceglie automaticamente il contenitore: se il modale "Azienda" è aperto, scrive
// in #cm-msg dentro al modale; altrimenti in #form-msg in cima al form principale.
// ─────────────────────────────────────────────────────────────────────────────
function _renderFormMsg(el, msg, type) {
  if (!el) return;
  const palette = ({
    error:   { bg:'#fef2f2', bd:'#dc2626', fg:'#991b1b', icon:'⚠️' },
    warning: { bg:'#fffbeb', bd:'#f59e0b', fg:'#92400e', icon:'⚠️' },
    info:    { bg:'#eff6ff', bd:'#3b82f6', fg:'#1e3a6e', icon:'ℹ️' },
    success: { bg:'#ecfdf5', bd:'#16a34a', fg:'#065f46', icon:'✓' }
  })[type || 'error'];
  el.style.cssText = 'display:block;margin:0 0 16px;padding:14px 18px;border-radius:8px;'
    + 'font-size:14px;font-weight:500;background:' + palette.bg + ';'
    + 'border:1px solid ' + palette.bd + ';color:' + palette.fg + ';white-space:pre-line';
  el.textContent = palette.icon + '  ' + msg;
  try { el.scrollIntoView({behavior:'smooth', block:'nearest'}); } catch(_) {}
}

function showFormMsg(msg, type) {
  // Se il modale Azienda è aperto, mostra dentro al modale
  const cmOv = document.getElementById('cm-overlay');
  if (cmOv && cmOv.style.display && cmOv.style.display !== 'none') {
    return _renderFormMsg(document.getElementById('cm-msg'), msg, type);
  }
  _renderFormMsg(document.getElementById('form-msg'), msg, type);
}

function clearFormMsg() {
  const a = document.getElementById('form-msg');
  const b = document.getElementById('cm-msg');
  if (a) a.style.display = 'none';
  if (b) b.style.display = 'none';
}

async function init() {
  const params = new URLSearchParams(location.search);
  TOKEN = params.get('t') || '';
  if (!TOKEN) { showError('Link non valido: token mancante.'); return; }

  populateProvince();
  _populateProfDropdown();  // v128.0 — dropdown professioni AGENAS

  // v140.9 — Auto-format data nato_il mentre l'utente digita: "07041973" → "07/04/1973"
  const dataEl = $('f-nato_il');
  if (dataEl) {
    dataEl.addEventListener('input', () => {
      const raw = (dataEl.value || '').replace(/\D/g, '').slice(0, 8); // solo cifre, max 8
      let out = raw;
      if (raw.length > 4)      out = raw.slice(0, 2) + '/' + raw.slice(2, 4) + '/' + raw.slice(4);
      else if (raw.length > 2) out = raw.slice(0, 2) + '/' + raw.slice(2);
      if (out !== dataEl.value) dataEl.value = out;
    });
    dataEl.addEventListener('blur', () => {
      dataEl.value = normalizeDateInput(dataEl.value);
    });
  }

  // v140.8 — Auto-uppercase su tutti i campi testuali (esclude email, telefono, numerici, IBAN già gestito).
  // Delega globale: cattura anche input dinamici (modale azienda, ecc.).
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t || t.tagName !== 'INPUT') return;
    const tp = (t.type || 'text').toLowerCase();
    if (tp === 'email' || tp === 'password' || tp === 'number' || tp === 'tel' || tp === 'checkbox' || tp === 'radio' || tp === 'date') return;
    if (t.dataset && t.dataset.noUpper === '1') return;
    const up = (t.value || '').toUpperCase();
    if (up !== t.value) {
      const s = t.selectionStart, eN = t.selectionEnd;
      t.value = up;
      try { t.setSelectionRange(s, eN); } catch (_) {}
    }
  });

  // v141.1 — Se l'utente modifica il CF dopo aver estratto i dati, sblocca i campi
  // anagrafici (luogo/prov/data) così deve cliccare di nuovo "Estrai dati".
  const cfEl = $('f-cf');
  if (cfEl) cfEl.addEventListener('input', _maybeUnlockOnCfChange);

  // v141.1 — Precarica la tabella codici catastali in background (non bloccante).
  // Verrà comunque caricata al primo click su "Estrai dati", ma così è già pronta.
  _ensureCfCodesLoaded().catch(() => {});

  try {
    // v127.3 — Se aperto da localhost (testing diretto su MedFIND), bypassa GAS
    // e chiama direttamente l'endpoint locale /api/contratti/prefill/<token>
    // (che ritorna anche `dbao` per il modale Pubblica).
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const url = isLocal
      ? ('/api/contratti/prefill/' + encodeURIComponent(TOKEN))
      : (GAS_API_URL + '?action=prefill&t=' + encodeURIComponent(TOKEN));
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) { showError(data.error || 'Errore caricamento dati.'); return; }
    if (data.submitted) { showState('success-screen'); return; }
    // Clausole arrivano già inline nello snapshot (per dipendenti pubblici B/C)
    if (data.clausole) {
      CLAUSOLE_INLINE = data.clausole;
    }
    populate(data);
    showState('form-screen');
    renderStep();
  } catch (e) {
    showError('Errore di rete: ' + e.message);
  }
}

function populate(data) {
  // Evento
  const ev = data.evento || {};
  $('ev-titolo').textContent = ev.titolo || '—';
  let dataTxt = ev.data_inizio || '—';
  if (ev.data_fine && ev.data_fine !== ev.data_inizio) {
    dataTxt = (ev.data_inizio || '—') + ' → ' + ev.data_fine;
  }
  $('ev-data').textContent = dataTxt;
  $('ev-luogo').textContent = ev.luogo || '—';
  $('ev-cod').textContent = ev.codice_ecm || '—';

  // v127.2 — Snapshot DBAO embedded nel prefill (Fase 4). Array di record
  // {ID, TIPO, NOME, INDIRIZZO, CAP, CITTA, Prov, PEC}. Senza dati il modale
  // accetterà solo il branch Privata/"Altro" (free text).
  if (Array.isArray(data.dbao)) {
    cmDbaoCache = data.dbao;
  }
  // v128.1 — Snapshot AGENAS embedded nel prefill (override del fallback statico).
  // Se GAS porta dati AGENAS aggiornati, sostituiscono la costante AGENAS_DATA inline.
  // Fallback: se data.agenas manca o è malformato, usiamo l'embedded (sempre presente).
  if (data.agenas && Array.isArray(data.agenas.professioni) && data.agenas.discipline_per_prof) {
    AGENAS_DATA.professioni = data.agenas.professioni;
    AGENAS_DATA.discipline_per_prof = data.agenas.discipline_per_prof;
    _populateProfDropdown();  // ripopola il dropdown con i dati freschi
  }

  // v289.9 — Curriculum semplificato
  cvPopulate(data.cv || {});

  // Anagrafica
  const a = data.anagrafica || {};
  for (const k of FIELDS) {
    const el = $('f-' + k);
    if (!el) continue;
    let val = a[k] || '';
    if (k === 'nato_il') val = normalizeDateInput(val);
    if (k === 'provincia') val = (val || '').toUpperCase();
    el.value = val;
  }

  if ($('f-dip-pubblico')) $('f-dip-pubblico').value = a.dip_pubblico || '';

  // v127.2 — Pre-fill Azienda dal data se MedFIND conosce già l'ente del relatore.
  // Atteso (Fase 5): data.anagrafica.ente, data.anagrafica.pec, data.anagrafica.dbao_id,
  // data.anagrafica.azienda_tipo, data.anagrafica.azienda_citta, data.anagrafica.azienda_prov,
  // data.anagrafica.company_type ('pubblica'|'privata'). Se assenti, summary parte vuota.
  if (a.ente) {
    $('f-ente').value = a.ente || '';
    $('f-pec').value = a.pec || '';
    $('f-company-type').value = (a.company_type || (a.dbao_id ? 'pubblica' : '')).toLowerCase();
    $('f-azienda-tipo').value = a.azienda_tipo || '';
    $('f-azienda-citta').value = a.azienda_citta || '';
    $('f-azienda-prov').value = a.azienda_prov || '';
    $('f-dbao-id').value = a.dbao_id ? String(a.dbao_id) : '';
    // Sync stato modale per riapertura coerente
    cmState.type = $('f-company-type').value || null;
    if (cmState.type === 'pubblica') {
      cmState.citta = a.azienda_citta || '';
      cmState.prov = a.azienda_prov || '';
      if (a.dbao_id) {
        cmState.struttura = cmDbaoCache.find(r => +r.ID === +a.dbao_id) || null;
        cmState.pec_attuale = cmState.struttura ? (cmState.struttura.PEC || '') : '';
      }
    } else if (cmState.type === 'privata') {
      cmState.privata_nome = a.ente || '';
    }
    updateAziendaSummary();
  }

  // Opzione: nessun default pre-selezionato (v120.3, richiesta utente).
  // Il relatore deve scegliere consapevolmente A, B o C — la validazione step 5
  // blocca il next se nessuno è selezionato. Niente updateOpzione() qui: se
  // serve aggiornare UI (es. step BIS/TER) lo farà l'onchange dei radio.

  // v120.5 — Salva info contratto (importo + straniero) per la logica IBAN
  const contr = data.contratto || {};
  CONTRATTO_INFO.importo = parseFloat(String(contr.importo || '0').replace(',', '.')) || 0;
  CONTRATTO_INFO.straniero = !!contr.straniero;
  // Aggiorna obbligatorietà visiva del campo IBAN e re-valida se già compilato
  updateIbanRequiredMark();
  if ($('f-iban').value) onIbanInput();

  // v141.1 — Per stranieri il bottone "Estrai dati" non ha senso (CF italiano assente).
  // Nascondi bottone + hint; i campi anagrafici restano sempre editabili.
  if (CONTRATTO_INFO.straniero) {
    const btn = document.getElementById('btn-cf-extract');
    if (btn) btn.style.display = 'none';
    const hint = document.getElementById('cf-extract-hint');
    if (hint) hint.textContent = 'Compili manualmente i Suoi dati anagrafici.';
  }
}

// v120.5 — Stato globale per logica IBAN obbligatorio
const CONTRATTO_INFO = { importo: 0, straniero: false };

// ─── IBAN: validazione live e gestione obbligatorietà ────────────────────
// Algoritmo identico a utils/iban_validator.py (Python). Ritorna {ok, code, msg}.

const _IBAN_LENGTHS = {
  AD:24, AE:23, AL:28, AT:20, AZ:28, BA:20, BE:16, BG:22, BH:22, BR:29,
  CH:21, CR:22, CY:28, CZ:24, DE:22, DK:18, DO:28, EE:20, ES:24, FI:18,
  FO:18, FR:27, GB:22, GE:22, GI:23, GL:18, GR:27, GT:28, HR:21, HU:28,
  IE:22, IL:23, IS:26, IT:27, JO:30, KW:30, KZ:20, LB:28, LC:32, LI:21,
  LT:20, LU:20, LV:21, MC:27, MD:24, ME:22, MK:19, MR:27, MT:31, MU:30,
  NL:18, NO:15, PK:24, PL:28, PS:29, PT:25, QA:29, RO:24, RS:22, SA:24,
  SC:31, SE:24, SI:19, SK:24, SM:27, TL:23, TN:24, TR:26, UA:29, VA:22,
  VG:24, XK:20,
};

const _CIN_DISPARI = {
  '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
  'A':1,'B':0,'C':5,'D':7,'E':9,'F':13,'G':15,'H':17,'I':19,'J':21,
  'K':2,'L':4,'M':18,'N':20,'O':11,'P':3,'Q':6,'R':8,'S':12,'T':14,
  'U':16,'V':10,'W':22,'X':25,'Y':24,'Z':23,
};

function _cinPari(ch) {
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  return ch.charCodeAt(0) - 65;  // A=0..Z=25
}

function _cinItaliano(abiCabCc) {
  let total = 0;
  for (let i = 0; i < abiCabCc.length; i++) {
    const ch = abiCabCc[i];
    if ((i + 1) % 2 === 1) total += (_CIN_DISPARI[ch] || 0);
    else                   total += _cinPari(ch);
  }
  return String.fromCharCode(65 + (total % 26));
}

function _checkIso97(iban) {
  // Sposta i primi 4 char in coda, sostituisce A=10..Z=35, mod 97 == 1
  const re = iban.slice(4) + iban.slice(0, 4);
  let big = '';
  for (const ch of re) {
    if (ch >= '0' && ch <= '9') big += ch;
    else big += String(ch.charCodeAt(0) - 55);  // A=10..Z=35
  }
  // BigInt per sicurezza (anche se i mod 97 step-by-step bastano)
  try {
    return BigInt(big) % 97n === 1n;
  } catch (e) {
    // Fallback step-by-step se BigInt non disponibile
    let r = 0;
    for (const d of big) r = (r * 10 + parseInt(d, 10)) % 97;
    return r === 1;
  }
}

function normalizeIban(s) {
  return (s || '').replace(/\s+/g, '').toUpperCase();
}

function validateIban(iban) {
  const s = normalizeIban(iban);
  if (!s) return { ok: false, code: 'empty', msg: 'IBAN vuoto' };
  if (!/^[A-Z0-9]+$/.test(s))
    return { ok: false, code: 'format', msg: 'L\'IBAN contiene caratteri non ammessi (solo lettere A-Z e cifre 0-9)' };
  if (s.length < 4) return { ok: false, code: 'country', msg: 'IBAN troppo corto' };
  const country = s.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(country))
    return { ok: false, code: 'country', msg: 'I primi 2 caratteri devono essere il codice paese (lettere)' };
  const expectedLen = _IBAN_LENGTHS[country];
  if (expectedLen && s.length !== expectedLen)
    return { ok: false, code: 'length', msg: `L'IBAN ${country} deve avere ${expectedLen} caratteri (ricevuti ${s.length})` };
  if (country === 'IT') {
    if (s.length !== 27)
      return { ok: false, code: 'length', msg: `L'IBAN italiano deve avere 27 caratteri (ricevuti ${s.length})` };
    const cinAtteso = s[4];
    if (!/^[A-Z]$/.test(cinAtteso))
      return { ok: false, code: 'format', msg: 'Il 5° carattere (CIN) deve essere una lettera A-Z' };
    const cinCalc = _cinItaliano(s.slice(5));
    if (cinCalc !== cinAtteso)
      return { ok: false, code: 'cin', msg: `CIN errato: il 5° carattere è '${cinAtteso}', dovrebbe essere '${cinCalc}'. Verificare l'IBAN.` };
  }
  if (!_checkIso97(s))
    return { ok: false, code: 'iso97', msg: 'Checksum ISO mod97 non valido. L\'IBAN è formalmente sbagliato — verificare le cifre di controllo (caratteri 3-4).' };
  return { ok: true, code: 'valid', msg: 'IBAN valido' };
}

// v318.5 — Metodo di pagamento: scelta esplicita del relatore (radio
// `metodo_pagamento`, Step 4.1), non più dedotta implicitamente da "IBAN
// vuoto = link" com'era dal v290.6. Caso Latella/Bianconi (21/08/2026):
// entrambi convinti di aver "solo lasciato vuoto" un campo facoltativo,
// mentre in realtà quella era già una scelta di canale di pagamento — e
// nessuno gliel'aveva chiesta in modo esplicito.
function metodoPagamento() {
  const el = document.querySelector('input[name="metodo_pagamento"]:checked');
  return el ? el.value : '';
}

function ibanIsRequired() {
  // Obbligatorio SOLO se il relatore ha scelto esplicitamente "Bonifico
  // bancario". Se sceglie "Link di pagamento" l'IBAN non serve: incassa lui
  // stesso inserendo i propri dati (IBAN, Revolut o carta), che Sidera non
  // vede né conserva. Se non ha ancora scelto, non è "richiesto" nel senso
  // del campo — è la domanda 4.1 stessa a essere obbligatoria (vedi
  // validazione step 4).
  return metodoPagamento() === 'bonifico';
}

// v133.1 — Se l'incarico è gratuito (importo == 0), IBAN e scelta del metodo
// di pagamento non servono: non c'è nulla da accreditare.
function ibanIsHidden() {
  return CONTRATTO_INFO.importo === 0 || metodoPagamento() !== 'bonifico';
}

function pmQuestionIsHidden() {
  return CONTRATTO_INFO.importo === 0;
}

function onMetodoPagamentoChange() {
  updateIbanRequiredMark();
  clearFormMsg();
}

function updateIbanRequiredMark() {
  const pmQ = $('pm-q1');
  if (pmQ) pmQ.style.display = pmQuestionIsHidden() ? 'none' : '';

  // v133.1/v318.5 — Nascondi/mostra l'intera riga IBAN in base a importo E
  // alla scelta del metodo di pagamento.
  const ibanRow = $('iban-row');
  if (ibanRow) ibanRow.style.display = ibanIsHidden() ? 'none' : '';
  const lead = $('step4-lead');
  if (lead) {
    lead.textContent = pmQuestionIsHidden()
      ? 'Indichi la Partita IVA se applicabile.'
      : 'Indichi come preferisce ricevere il compenso e, se applicabile, la Partita IVA.';
  }
  const mark = $('iban-req-mark');
  if (mark) mark.style.display = ibanIsRequired() ? 'inline' : 'none';
  const fb = $('iban-feedback');
  if (fb && !$('f-iban').value) {
    fb.textContent = ibanIsRequired()
      ? '⚠ IBAN obbligatorio: ha scelto il pagamento tramite bonifico'
      : 'Inserisca l\'IBAN per l\'accredito del compenso';
    fb.style.color = ibanIsRequired() ? '#dc2626' : '#94a3b8';
  }
}

function onIbanInput() {
  // Pulisce: uppercase + rimuove spazi mentre digita
  const el = $('f-iban');
  const cur = el.selectionStart;
  const oldLen = el.value.length;
  el.value = el.value.replace(/\s+/g, '').toUpperCase();
  // Mantieni cursore stabile
  el.setSelectionRange(cur - (oldLen - el.value.length), cur - (oldLen - el.value.length));
  showIbanFeedback();
}

function onIbanBlur() {
  showIbanFeedback();
}

function showIbanFeedback() {
  const el = $('f-iban');
  const fb = $('iban-feedback');
  if (!fb) return;
  const v = (el.value || '').trim();
  if (!v) {
    updateIbanRequiredMark();
    return;
  }
  const r = validateIban(v);
  if (r.ok) {
    fb.textContent = '✓ IBAN valido';
    fb.style.color = '#16a34a';
  } else {
    fb.textContent = '✗ ' + r.msg;
    fb.style.color = '#dc2626';
  }
}

function getCurrentSteps() {
  // v127.2 — La scelta Pubblica/Privata fatta nel modale Step 3 determina
  // anche il flusso di Art. 3:
  //   • Privata/Altro → Opzione A forzata, salta del tutto step 5 (Art.3) e
  //                      lo step delle clausole ART. 3 BIS (6).
  //   • Pubblica → step 5 mostra solo B/C (logica esistente di getCurrentSteps);
  //                step 6 attivo solo se B o C scelta.
  // Step CDI sempre presente.
  // v140.7 — Se il contratto è gratuito (importo == 0) salto interamente lo
  // step 4 (Dati fiscali e bancari): niente IBAN, niente P.IVA, perché senza
  // compenso non c'è accredito né necessità di partita IVA.
  const skipStep4 = (CONTRATTO_INFO.importo === 0);
  const step4 = skipStep4 ? [] : ['4'];

  // v289.9 — Step 'cv' sempre presente, subito prima del CDI: a quel punto il
  // relatore ha già dichiarato anagrafica, struttura e professione, e la
  // pagina gli chiede di confermare il curriculum che ne risulta.
  const companyType = (document.getElementById('f-company-type') || {}).value || '';
  if (companyType.toLowerCase() === 'privata') {
    return ['1','2','3', ...step4, 'cv','cdi','final'];
  }
  const sel = document.querySelector('input[name="opzione"]:checked');
  const base = ['1','2','3', ...step4, '5'];
  if (sel && (sel.value === 'B' || sel.value === 'C')) return [...base, '6','cv','cdi','final'];
  return [...base, 'cv', 'cdi', 'final'];
}

function renderStep() {
  const steps = getCurrentSteps();
  const stepKey = steps[CURRENT_STEP_INDEX];

  // v141.0 — pulisci eventuali info-box quando entro in un nuovo step
  clearFormMsg();

  // Mostra solo lo step corrente
  $$('.step').forEach(el => {
    el.style.display = (el.getAttribute('data-step') === stepKey) ? 'block' : 'none';
  });

  // Progress
  const total = steps.length;
  const cur = CURRENT_STEP_INDEX + 1;
  $('step-counter').textContent = `Passo ${cur} di ${total}`;
  $('step-name').textContent = STEP_NAMES[stepKey] || '';
  $('progress-fill').style.width = `${Math.round((cur / total) * 100)}%`;

  // Bottoni nav
  $('btn-back').style.visibility = (CURRENT_STEP_INDEX > 0) ? 'visible' : 'hidden';
  const isLast = (stepKey === 'final');
  $('btn-next').style.display = isLast ? 'none' : 'inline-block';
  $('btn-submit').style.display = isLast ? 'inline-block' : 'none';

  if (stepKey === 'final') renderSummary();
  if (stepKey === 'cv') cvEreditaDaStep3();

  // v127.9 — entrando in Step 3, se Azienda già pre-fillata e ECM non scelto, apri modal ECM
  if (stepKey === '3') {
    updateEcmBadge();
    univPrefill();          // v298.5 — suggerisce il 3.2 solo se DBDOC lo dichiara
    univCoerenza();         // v299.0 — segnala 3.1 e 3.2 in contrasto
    applyEcmModeToStep3();  // v128.0 — sincronizza visibilità dropdown/free text
    const enteAlreadyFilled = ($('f-ente').value || '').trim();
    const ctypeFilled = ($('f-company-type').value || '').trim();
    if (enteAlreadyFilled && !ctypeFilled) {
      // v128.3 — DBDOC ha l'ente ma non la tipologia (mai legato a DBAO).
      // Apri il modal Azienda dal bivio per chiedere conferma Pubblica/Privata.
      setTimeout(openCompanyModal, 200);
    } else if (enteAlreadyFilled) {
      setTimeout(tryAutoOpenEcmModal, 250);
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function goNext() {
  if (!(await validateStep())) return;
  CURRENT_STEP_INDEX++;
  const steps = getCurrentSteps();
  if (CURRENT_STEP_INDEX >= steps.length) CURRENT_STEP_INDEX = steps.length - 1;
  renderStep();
}

function goBack() {
  if (CURRENT_STEP_INDEX > 0) CURRENT_STEP_INDEX--;
  renderStep();
}

// v140.6 — Validazione rigorosa del Codice Fiscale italiano.
// Controlli:
//   1) Pattern 16 caratteri AAAAAA00A00A000A (6 lettere + 2 cifre + 1 lettera +
//      2 cifre + 1 lettera + 3 alfanumerici + 1 lettera checksum)
//   2) Checksum (carattere finale calcolato sui primi 15)
//   3) Coerenza opzionale con Cognome/Nome/Data di nascita (se forniti, warning
//      bloccante solo su mismatch netto; carattere "*" admin per CF anonimi non
//      contemplati nel form pubblico).
// Algoritmo: tabelle ufficiali Agenzia delle Entrate. La lettera finale dipende
// da una somma pesata di valori PARI/DISPARI sui primi 15 caratteri.
// Ritorna {ok:boolean, error?:string}.
// v141.0 — Omocodia: quando 2 CF coinciderebbero, l'Agenzia delle Entrate sostituisce
// le cifre con lettere secondo questa tabella. Posizioni sostituibili (1-based): 7, 8, 10, 11, 13, 14, 15.
const OMOCODIA_MAP = {'L':'0','M':'1','N':'2','P':'3','Q':'4','R':'5','S':'6','T':'7','U':'8','V':'9'};
function _cfDecodeChar(c) {
  if (/\d/.test(c)) return c;
  return Object.prototype.hasOwnProperty.call(OMOCODIA_MAP, c) ? OMOCODIA_MAP[c] : c;
}

function validateCodiceFiscale(cf, hint) {
  if (!cf) return {ok:false, error:'Codice fiscale non inserito'};
  cf = String(cf).toUpperCase().trim();
  if (cf.length !== 16) {
    return {ok:false, error:`Lunghezza errata: ${cf.length} caratteri (devono essere 16)`};
  }
  // Pattern: 6 lettere + (anno) + lettera mese + (giorno) + lettera prov + (seq prov) + lettera check.
  // Nelle posizioni "numeriche" (7-8 anno, 10-11 giorno, 13-15 seq prov) sono ammesse anche
  // lettere di omocodia (L,M,N,P,Q,R,S,T,U,V) per disambiguare CF identici.
  const pattern = /^[A-Z]{6}[\dLMNPQRSTUV]{2}[A-Z][\dLMNPQRSTUV]{2}[A-Z][\dLMNPQRSTUV]{3}[A-Z]$/;
  if (!pattern.test(cf)) {
    return {ok:false, error:'Formato non valido (atteso: 6 lettere + anno + lettera-mese + giorno + lettera-provincia + 3 caratteri + 1 lettera di controllo)'};
  }
  // Checksum: tabella PARI/DISPARI per posizioni 1-15, lettera finale derivata
  // dal modulo 26 della somma pesata.
  const DISPARI = {
    '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
    'A':1,'B':0,'C':5,'D':7,'E':9,'F':13,'G':15,'H':17,'I':19,'J':21,
    'K':2,'L':4,'M':18,'N':20,'O':11,'P':3,'Q':6,'R':8,'S':12,'T':14,
    'U':16,'V':10,'W':22,'X':25,'Y':24,'Z':23
  };
  const PARI = {
    '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
    'A':0,'B':1,'C':2,'D':3,'E':4,'F':5,'G':6,'H':7,'I':8,'J':9,
    'K':10,'L':11,'M':12,'N':13,'O':14,'P':15,'Q':16,'R':17,'S':18,'T':19,
    'U':20,'V':21,'W':22,'X':23,'Y':24,'Z':25
  };
  const CHECK_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = cf[i];
    // Posizione 1-based: dispari = posizione dispari (1,3,5,...)
    sum += ((i + 1) % 2 === 1) ? DISPARI[c] : PARI[c];
  }
  const expectedCheck = CHECK_LETTERS[sum % 26];
  if (cf[15] !== expectedCheck) {
    return {ok:false, error:`Checksum errato (l'ultimo carattere dovrebbe essere "${expectedCheck}" ma è "${cf[15]}")`};
  }
  // Coerenza con data di nascita (se fornita in GG/MM/AAAA).
  // Decodifica omocodia sulle posizioni "numeriche" prima del confronto.
  if (hint && hint.natoIl) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(hint.natoIl);
    if (m) {
      const [_, gg, mm, aaaa] = m;
      const yyCF = _cfDecodeChar(cf[6]) + _cfDecodeChar(cf[7]);
      const yyDate = aaaa.substring(2, 4);
      if (yyCF !== yyDate) {
        return {ok:false, error:`Le 2 cifre dell'anno nel CF (${yyCF}) non coincidono con la data di nascita (${aaaa})`};
      }
      // Mese: A=gen B=feb C=mar D=apr E=mag H=giu L=lug M=ago P=set R=ott S=nov T=dic
      const MESI = {'A':'01','B':'02','C':'03','D':'04','E':'05','H':'06',
                    'L':'07','M':'08','P':'09','R':'10','S':'11','T':'12'};
      const mmCF = MESI[cf[8]];
      if (mmCF && mmCF !== mm) {
        return {ok:false, error:`Il mese codificato nel CF ("${cf[8]}" = ${mmCF}) non coincide con la data di nascita (${mm})`};
      }
      // Giorno: per femmine, giorno + 40 → range 41-71. Decodifica omocodia su pos 10-11.
      const ggCFstr = _cfDecodeChar(cf[9]) + _cfDecodeChar(cf[10]);
      let ggCF = parseInt(ggCFstr, 10);
      if (Number.isNaN(ggCF)) return {ok:false, error:'Caratteri non validi nelle posizioni del giorno di nascita'};
      if (ggCF > 40) ggCF -= 40;
      if (ggCF !== parseInt(gg, 10)) {
        return {ok:false, error:`Il giorno codificato nel CF (${ggCF}) non coincide con la data di nascita (${gg})`};
      }
    }
  }
  return {ok:true};
}

// ─────────────────────────────────────────────────────────────────────────────
// v141.1 — Estrazione dati anagrafici dal CF (solo italiani).
// Workflow: l'utente digita il CF → clicca "Estrai dati" → JS valida + decodifica
// + popola Luogo/Provincia/Data e li blocca in readonly. Prima di passare allo
// Step 2 viene chiesta conferma esplicita che corrispondano al documento.
// Per relatori stranieri il bottone NON viene mostrato (CONTRATTO_INFO.straniero).
// ─────────────────────────────────────────────────────────────────────────────
let CF_CODES_CACHE = null;            // {COD: [COMUNE, SIGLA]} caricato da /static/data/cf_codes.json
let ANAGRAFICA_LOCKED = false;        // true → luogo/provincia/data in readonly perché derivati dal CF
let ANAGRAFICA_CONFIRMED = false;     // true → l'utente ha confermato → goNext() può procedere
let ANAGRAFICA_EXTRACTED_CF = '';     // CF che ha generato il lock (se cambia, sblocco)

const MESI_CF_REV = {'A':'01','B':'02','C':'03','D':'04','E':'05','H':'06',
                     'L':'07','M':'08','P':'09','R':'10','S':'11','T':'12'};

async function _ensureCfCodesLoaded() {
  if (CF_CODES_CACHE && Object.keys(CF_CODES_CACHE).length > 1000) return true;
  // v141.4 — rimosso "force-cache" (poteva servire una risposta stale tipo 302
  // dal login se non whitelisted). Aggiunto sanity-check sul contenuto: se il
  // JSON è vuoto o ha pochi record, tratto come fallimento e mostro warning.
  // Path relativo: risolve sia in locale (Flask, /cf_codes.json) sia su
  // sideraweb (GitHub Pages root, /cf_codes.json).
  try {
    const r = await fetch('cf_codes.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const ct = r.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('json')) {
      // Es. 302 → HTML di login restituito come 200 dopo redirect-follow
      throw new Error('Risposta non-JSON (' + ct + '). Verifichi di essere autenticato o riavvii il server.');
    }
    const data = await r.json();
    if (!data || typeof data !== 'object' || Object.keys(data).length < 1000) {
      throw new Error('Tabella vuota o incompleta (' + Object.keys(data || {}).length + ' record)');
    }
    CF_CODES_CACHE = data;
    return true;
  } catch (e) {
    CF_CODES_CACHE = null;
    showFormMsg('Impossibile caricare la tabella comuni: ' + e.message + '. Compili manualmente luogo, provincia e data di nascita.', 'warning');
    return false;
  }
}

function _decodeCfData(cf) {
  // Anno (pos 7-8 → idx 6-7), con decoder omocodia
  const yyDec = _cfDecodeChar(cf[6]) + _cfDecodeChar(cf[7]);
  const yi = parseInt(yyDec, 10);
  if (Number.isNaN(yi)) return null;
  const aaaa = yi <= 30 ? (2000 + yi) : (1900 + yi);
  // Mese (pos 9 → idx 8)
  const mm = MESI_CF_REV[cf[8]];
  if (!mm) return null;
  // Giorno + sesso (pos 10-11 → idx 9-10)
  const ggDec = _cfDecodeChar(cf[9]) + _cfDecodeChar(cf[10]);
  let gg = parseInt(ggDec, 10);
  if (Number.isNaN(gg)) return null;
  const sesso = gg > 40 ? 'F' : 'M';
  if (gg > 40) gg -= 40;
  if (gg < 1 || gg > 31) return null;
  const data_nascita = String(gg).padStart(2, '0') + '/' + mm + '/' + aaaa;
  // Codice catastale (pos 12-15 → idx 11-14)
  const cod_comune = cf.substring(11, 15);
  const estero = cod_comune.startsWith('Z');
  let luogo_nascita = '';
  let provincia = '';
  if (estero) {
    provincia = 'EE';
  } else if (CF_CODES_CACHE && CF_CODES_CACHE[cod_comune]) {
    luogo_nascita = CF_CODES_CACHE[cod_comune][0];
    provincia     = CF_CODES_CACHE[cod_comune][1];
  }
  return {data_nascita, luogo_nascita, provincia, sesso, estero, cod_comune};
}

function _setAnagraficaLocked(locked) {
  ANAGRAFICA_LOCKED = !!locked;
  const data = $('f-nato_il'), luogo = $('f-nato_a'), prov = $('f-provincia');
  if (data)  data.readOnly  = !!locked;
  if (luogo) luogo.readOnly = !!locked;
  if (prov)  prov.disabled  = !!locked;
  // Visual hint
  [data, luogo].forEach(el => {
    if (!el) return;
    if (locked) { el.style.background = '#f1f5f9'; el.style.color = '#0f172a'; }
    else { el.style.background = ''; el.style.color = ''; }
  });
}

async function onCfExtract() {
  clearFormMsg();
  const cfEl = $('f-cf');
  const cf = (cfEl.value || '').trim().toUpperCase();
  cfEl.value = cf;
  // Validazione formato + checksum (riusa il validator esistente)
  const check = validateCodiceFiscale(cf);
  if (!check.ok) {
    showFormMsg('Codice fiscale non valido — ' + check.error + '. Verifichi e riprovi.', 'error');
    cfEl.focus();
    return;
  }
  // Carica la tabella comuni (lazy)
  await _ensureCfCodesLoaded();
  // Decodifica
  const d = _decodeCfData(cf);
  if (!d) {
    showFormMsg('Impossibile estrarre i dati dal codice fiscale. Verifichi i caratteri.', 'error');
    return;
  }
  // Popola i campi
  $('f-nato_il').value = d.data_nascita;
  $('f-nato_a').value  = d.luogo_nascita;
  const provSel = $('f-provincia');
  if (provSel) provSel.value = d.provincia;
  // Lock condizionale
  if (d.estero) {
    // Italiano nato all'estero: data + provincia="EE" bloccati, luogo editabile (lo stato estero)
    _setAnagraficaLocked(true);
    $('f-nato_a').readOnly = false;
    $('f-nato_a').style.background = '';
    $('f-nato_a').style.color = '';
    showFormMsg('Estrazione completata. Lei risulta nato all\'estero (codice catastale ' + d.cod_comune + '): indichi il Nome dello Stato di nascita nel campo "Luogo di nascita".', 'info');
  } else if (!d.luogo_nascita) {
    _setAnagraficaLocked(false);
    showFormMsg('Codice comune "' + d.cod_comune + '" non trovato in archivio. Compili manualmente Luogo e Provincia di nascita.', 'warning');
  } else {
    _setAnagraficaLocked(true);
    ANAGRAFICA_EXTRACTED_CF = cf;
    ANAGRAFICA_CONFIRMED = false;
    showFormMsg('Dati estratti: ' + d.luogo_nascita + ' (' + d.provincia + ') — ' + d.data_nascita + '. Cliccando "Avanti" Le verrà chiesta conferma.', 'success');
  }
}

// Se l'utente modifica il CF dopo l'estrazione → sblocca tutto e richiede nuova Estrai
function _maybeUnlockOnCfChange() {
  if (!ANAGRAFICA_LOCKED) return;
  const cur = ($('f-cf').value || '').trim().toUpperCase();
  if (cur !== ANAGRAFICA_EXTRACTED_CF) {
    _setAnagraficaLocked(false);
    ANAGRAFICA_CONFIRMED = false;
    ANAGRAFICA_EXTRACTED_CF = '';
  }
}

// Confirm overlay
function _showAnagConfirmOverlay() {
  const tbody = document.querySelector('#anag-confirm-table tbody');
  const rows = [
    ['Cognome',           $('f-cognome').value],
    ['Nome',              $('f-nome').value],
    ['Codice fiscale',    $('f-cf').value],
    ['Luogo di nascita',  $('f-nato_a').value],
    ['Provincia',         $('f-provincia').value],
    ['Data di nascita',   $('f-nato_il').value],
  ];
  tbody.innerHTML = rows.map(([k, v]) =>
    `<tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px">${k}</td>`
    + `<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a">${(v || '').replace(/[<>&]/g, '')}</td></tr>`
  ).join('');
  $('anag-confirm-overlay').style.display = 'flex';
}

function anagConfirmYes() {
  $('anag-confirm-overlay').style.display = 'none';
  ANAGRAFICA_CONFIRMED = true;
  // Riesegue la navigazione "Avanti" che era stata bloccata
  CURRENT_STEP_INDEX++;
  const steps = getCurrentSteps();
  if (CURRENT_STEP_INDEX >= steps.length) CURRENT_STEP_INDEX = steps.length - 1;
  renderStep();
}

function anagConfirmNo() {
  $('anag-confirm-overlay').style.display = 'none';
  // Sblocca i campi così l'utente può correggerli a mano
  _setAnagraficaLocked(false);
  ANAGRAFICA_CONFIRMED = false;
  ANAGRAFICA_EXTRACTED_CF = '';
  showFormMsg('Modifichi i dati anagrafici che non corrispondono e clicchi nuovamente "Avanti".', 'info');
}

async function validateStep() {
  const steps = getCurrentSteps();
  const stepKey = steps[CURRENT_STEP_INDEX];

  if (stepKey === '1') {
    // v140.6 — Tutti i campi anagrafici obbligatori (era solo cognome/nome/cf).
    // Caso Zeqaj 1337-20: data/luogo/provincia di nascita vuoti hanno generato
    // un contratto firmato con ART.2 incompleto.
    const reqFields = {
      'cognome'  : 'Cognome',
      'nome'     : 'Nome',
      'cf'       : 'Codice fiscale',
      'nato_il'  : 'Data di nascita',
      'nato_a'   : 'Luogo di nascita',
      'provincia': 'Provincia di nascita',
    };
    for (const [k, label] of Object.entries(reqFields)) {
      const el = $('f-' + k);
      if (!(el.value || '').trim()) {
        showFormMsg('Campo obbligatorio mancante: ' + label, 'error');
        el.focus();
        return false;
      }
    }
    // Validazione rigorosa del Codice Fiscale (era solo lunghezza con bypass).
    const cf = $('f-cf').value.trim().toUpperCase();
    $('f-cf').value = cf;
    const cfCheck = validateCodiceFiscale(cf, {
      cognome: $('f-cognome').value.trim(),
      nome:    $('f-nome').value.trim(),
      natoIl:  $('f-nato_il').value.trim(),
    });
    if (!cfCheck.ok) {
      showFormMsg('Codice fiscale non valido — ' + cfCheck.error + '. Verifichi i caratteri e riprovi.', 'error');
      $('f-cf').focus();
      return false;
    }
    // v141.1 — Gate di conferma anagrafica: se i dati sono stati estratti dal CF
    // (lock attivo) e l'utente non ha ancora confermato, mostra l'overlay.
    // Per stranieri il lock non si attiva mai → ANAGRAFICA_LOCKED resta false → procede senza chiedere.
    if (ANAGRAFICA_LOCKED && !ANAGRAFICA_CONFIRMED) {
      _showAnagConfirmOverlay();
      return false; // blocca goNext; sarà anagConfirmYes() a far procedere
    }
  }

  // v208.3 — Step 2: Indirizzo/CAP/Città residenza obbligatori.
  // Caso Pasinelli 1334-1 (29/05/2026): contratto firmato con righe Indirizzo/CAP/Città
  // vuote in ART.2 perché il form non bloccava il passaggio allo step successivo.
  // Cellulare resta facoltativo (scelta esplicita).
  if (stepKey === '2') {
    const reqFields = {
      'indirizzo': 'Indirizzo',
      'cap'      : 'CAP',
      'citta'    : 'Città',
    };
    for (const [k, label] of Object.entries(reqFields)) {
      const el = $('f-' + k);
      if (!(el.value || '').trim()) {
        showFormMsg('Campo obbligatorio mancante: ' + label, 'error');
        el.focus();
        return false;
      }
    }
    // CAP italiano: 5 cifre numeriche.
    const cap = ($('f-cap').value || '').trim();
    if (!/^\d{5}$/.test(cap)) {
      showFormMsg('CAP non valido: deve essere di 5 cifre numeriche.', 'error');
      $('f-cap').focus();
      return false;
    }
  }

  // v127.2 — Step 3: azienda obbligatoria (scelta dal modale Pubblica/Privata)
  if (stepKey === '3') {
    const ente = ($('f-ente').value || '').trim();
    const ctype = ($('f-company-type').value || '').trim();
    if (!ente) {
      showFormMsg('Indichi la Sua azienda cliccando sulla card "Azienda".', 'error');
      return false;
    }
    if (!ctype) {
      showFormMsg('Confermi la tipologia (Pubblica oppure Privata/Altro) della Sua azienda cliccando "Modifica" sulla card.', 'error');
      openCompanyModal();
      return false;
    }
    // Per Pubblica la PEC è obbligatoria (gestita nel modale, ma defensive check)
    if (ctype === 'pubblica') {
      const pec = ($('f-pec').value || '').trim();
      if (!pec) {
        showFormMsg('Per le aziende pubbliche la PEC è obbligatoria. Riapra il modale "Azienda" per inserirla.', 'error');
        return false;
      }
    }
    // v298.5 — Punto 3.2: da questa risposta dipende il vocabolario del punto
    // 5.3 e con esso la qualificazione giuridica. Non ha un default sicuro.
    if (!document.querySelector('input[name="f-univ"]:checked')) {
      showFormMsg('Risponda al punto 3.2: è professore o ricercatore di un’università statale?', 'error');
      const r = $('univ-row');
      if (r) r.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    // v127.9 — italiani: scelta ECM/Non ECM obbligatoria
    if (!CONTRATTO_INFO.straniero) {
      const ecmFlag = ($('f-ecm-flag').value || '').trim();
      if (ecmFlag !== '0' && ecmFlag !== '1') {
        openEcmModal();
        return false;
      }
      // v128.0 — italiano + ECM: professione e disciplina AGENAS obbligatorie
      if (ecmFlag === '1') {
        const profCod = ($('f-prof-cod').value || '').trim();
        const discCod = ($('f-disc-cod').value || '').trim();
        if (!profCod) {
          showFormMsg('Selezioni la Sua professione dall\'elenco.', 'error');
          $('f-prof-select').focus();
          return false;
        }
        if (!discCod) {
          showFormMsg('Selezioni la Sua disciplina dall\'elenco.', 'error');
          $('f-disc-select').focus();
          return false;
        }
      }
    }
  }

  // v120.5 — Validazione IBAN allo step 4
  // v133.1 — Skip se incarico gratuito (IBAN row nascosta)
  if (stepKey === '4' && !pmQuestionIsHidden() && !metodoPagamento()) {
    showFormMsg('Indichi come preferisce ricevere il compenso (bonifico o link di pagamento) per procedere.', 'error');
    return false;
  }

  if (stepKey === '4' && !ibanIsHidden()) {
    const ibanEl = $('f-iban');
    const v = (ibanEl.value || '').trim();
    if (!v) {
      if (ibanIsRequired()) {
        showFormMsg('IBAN obbligatorio: ha scelto il pagamento tramite bonifico. Inserisca l\'IBAN per procedere, oppure torni indietro e scelga il link di pagamento.', 'error');
        ibanEl.focus();
        return false;
      }
      // IBAN vuoto e non obbligatorio → ok
    } else {
      const r = validateIban(v);
      if (!r.ok) {
        showFormMsg('IBAN non valido — ' + r.msg + '. La preghiamo di verificare l\'IBAN inserito prima di procedere.', 'error');
        ibanEl.focus();
        return false;
      }
      // Normalizza nel campo (rimuove spazi, uppercase)
      ibanEl.value = normalizeIban(v);
    }
  }

  if (stepKey === '5') {
    // v296.2 — Non si valida più la scelta di un'opzione ma la completezza
    // delle risposte: il messaggio indica la domanda rimasta senza risposta,
    // non una lettera che il relatore non ha mai visto.
    a3Calcola();
    if (!A3.dip) {
      showFormMsg('Indichi la Sua posizione lavorativa al punto 5.1.', 'error');
      return false;
    }
    if (A3.dip === 'no' && !A3.vinc) {
      showFormMsg('Indichi se ricorre una delle condizioni elencate, oppure scelga «Nessuna delle seguenti».', 'error');
      return false;
    }
    if (!A3.det) {
      showFormMsg('Manca ancora una risposta: controlli le domande qui sopra.', 'error');
      return false;
    }
    const sel = document.querySelector('input[name="opzione"]:checked');
    if (!sel) {
      showFormMsg('Non riusciamo a determinare il regime applicabile. Riveda le risposte.', 'error');
      return false;
    }
    // v296.4 — La PEC serve a scrivere all'amministrazione, quindi il criterio
    // è «è dipendente pubblico», non la lettera dell'opzione: la si chiede
    // anche a chi è esonerato dall'autorizzazione e anche a compenso zero,
    // perché l'informativa parte comunque.
    if (A3.dip === 'si') {
      const pecV = (($('f-pec') || {}).value || '').trim();
      if (!pecV) {
        showFormMsg('Ci serve la PEC del Suo ente: torni al passo «Attività professionale» e lo scelga fra le amministrazioni pubbliche.', 'error');
        return false;
      }
    }
    // Se passiamo da Opzione A a B/C (o viceversa) carichiamo le clausole se mancano
    if ((sel.value === 'B' || sel.value === 'C') && !CLAUSOLE_LOADED) {
      loadClausole();
    }
  }

  if (stepKey === '6') {
    // v141.3 — Non si può accettare ciò che non è stato visualizzato.
    let bisHtml = ($('bis-content') && $('bis-content').innerHTML || '').trim();
    // v311.10 — Un solo ritentativo silenzioso prima di bloccare: il primo
    // caricamento (allo step 5) può fallire per un intoppo di rete transitorio
    // — caso reale Riboldi/1355-7, dati confermati integri lato server appena
    // dopo — e senza questo l'unica via d'uscita per l'utente era ricaricare
    // la pagina, perdendo quanto già compilato negli step precedenti.
    if (!bisHtml || !CLAUSOLE_LOADED) {
      await loadClausole();
      bisHtml = ($('bis-content') && $('bis-content').innerHTML || '').trim();
    }
    if (!bisHtml || !CLAUSOLE_LOADED) {
      showFormMsg('Le clausole ART. 3 BIS non sono state caricate. Ricarichi la pagina (Ctrl+F5). Se il problema persiste contatti l\'organizzazione: non può accettare clausole che non Le sono state mostrate.', 'error');
      return false;
    }
    if (!$('ack-bis').checked) {
      showFormMsg('Per procedere deve dichiarare di aver letto e accettato le clausole ART. 3 BIS.', 'error');
      return false;
    }
  }

  // v289.9 — Curriculum: pochi campi obbligatori, perché la pagina deve
  // restare una conferma e non diventare un modulo da compilare.
  if (stepKey === 'cv' && !cvValidate()) return false;

  return true;
}

function updateOpzione() {
  const sel = document.querySelector('input[name="opzione"]:checked');
  // v296.2 — Le card op-A/op-B/op-C non esistono più (sostituite dalle domande):
  // il null-guard tiene in vita questa funzione, che serve ancora per clausole,
  // hint PEC e flusso degli step.
  ['A', 'B', 'C'].forEach(k => {
    const el = $('op-' + k);
    if (el) el.classList.toggle('selected', !!sel && sel.value === k);
  });
  const isPublic = sel && (sel.value === 'B' || sel.value === 'C');
  // v127.3 — pec-req-mark e pec-hint rimossi in v127.2 (Step 3 ridisegnato con
  // card riassunto + modale Pubblica/Privata). Null-guard per backward compat.
  const pecMark = $('pec-req-mark');
  if (pecMark) pecMark.style.display = isPublic ? 'inline' : 'none';
  const pecHint = $('pec-hint');
  if (pecHint) pecHint.textContent = isPublic
    ? '⚠ Obbligatoria per dipendenti pubblici'
    : 'Obbligatoria se è dipendente pubblico';
  if (isPublic && !CLAUSOLE_LOADED) loadClausole();
  // Sub-tipo C (SSN/UNIV): visibile solo se Opzione C scelta
  const subC = $('op-C-subtype');
  if (subC) {
    subC.style.display = (sel && sel.value === 'C') ? 'block' : 'none';
    if (sel && sel.value !== 'C') {
      // Reset sub-tipo se l'utente cambia opzione
      document.querySelectorAll('input[name="op-C-tipo"]').forEach(r => { r.checked = false; });
    }
  }
}

document.addEventListener('change', e => {
  if (e.target.name === 'opzione') updateOpzione();
});

/* ══ ART. 3 — derivazione del regime dalle risposte (v296.2) ═══════════════
   Il relatore non sceglie più fra tre opzioni scritte in linguaggio normativo:
   risponde su di sé e il codice fa la classificazione. Si conservano SIA il
   codice di dettaglio (A/A1/A2/B/B1/C/D/G) SIA le risposte grezze, perché se
   un domani la mappa cambia dalle risposte si può ricalcolare, dalla sola
   lettera no. La lettera legacy A/B/C continua a pilotare PDF e clausole.  */
const A3 = {};

function _a3Val(name) {
  const el = document.querySelector('input[name="' + name + '"]:checked');
  return el ? el.value : '';
}
function _a3Show(id, on) {
  const el = $(id);
  if (el) el.style.display = on ? '' : 'none';
}

/* Codice di dettaglio → lettera storica. Attenzione all'ordine controintuitivo
   delle lettere esistenti: B = con autorizzazione, C = esonerato. */
/* v302.7 — Via la chiave D: il caso "docenza esclusa ex lett. f-bis" non esiste
   piu' ne' nel form (dalla v300.7) ne' nel contratto. */
const A3_LEGACY = { A: 'A', A1: 'A', A2: 'A', B: 'C', B1: 'C', G: 'C', C: 'B' };

/* L'obbligo che sopravvive all'esclusione dall'autorizzazione grava sul
   dipendente e nasce dal codice di comportamento, non dall'art. 53: la
   comunicazione che manda Sidera gli giova ma non lo libera. */
const A3_CODA_COMUNICAZIONE =
  ' Resta a Suo carico la comunicazione preventiva dell’incarico alla Sua amministrazione, '
  + 'prevista dal codice di comportamento anche per gli incarichi esclusi dall’autorizzazione '
  + 'e anche se gratuiti: la comunicazione di Sidera non la sostituisce.';

const A3_TESTI = {
  A:  ['Non è dipendente pubblico.',
       'Nessuna autorizzazione da chiedere e nessuna comunicazione dovuta. Nel contratto dichiarerà, ai sensi dell’art. 76 del D.P.R. 445/2000, di non prestare servizio presso alcuna delle amministrazioni indicate dall’art. 1, comma 2, del D.Lgs. 165/2001.'],
  A1: ['Non è dipendente pubblico ed è in formazione specialistica.',
       'Verifichi che l’incarico sia compatibile con il vincolo di esclusività della Sua Scuola: se serve un nulla osta del Direttore, ce lo faccia avere prima dell’evento.'],
  A2: ['Non è dipendente pubblico, essendo legato al SSN da rapporto convenzionale.',
       'Le eventuali incompatibilità previste dall’Accordo Collettivo Nazionale restano da valutare con la Sua Azienda di riferimento.'],
  B:  ['È dipendente pubblico, in una posizione che la legge esclude dal regime autorizzatorio.',
       'Nessuna autorizzazione da chiedere.' + A3_CODA_COMUNICAZIONE],
  B1: ['È professore o ricercatore di università statale a tempo pieno.',
       'Le lezioni e i seminari di carattere occasionale sono liberamente esercitabili, anche retribuiti e '
       + 'senza autorizzazione (art. 6, comma 10, L. 240/2010), fatto salvo il rispetto dei Suoi obblighi '
       + 'istituzionali. L’esenzione regge finché l’attività resta occasionale: il regolamento '
       + 'del Suo ateneo può avere fissato soglie (per esempio 30 ore l’anno) oltre le quali '
       + 'l’autorizzazione torna dovuta.' + A3_CODA_COMUNICAZIONE],
  C:  ['È dipendente pubblico e il Suo ente richiede l’autorizzazione preventiva.',
       'L’incarico non può iniziare senza autorizzazione espressa: ce la faccia avere prima dell’evento. Sidera invia contestualmente la propria richiesta all’amministrazione.'],
  // v303.4 - Rimosso l'esito 'D' (docenza esclusa ex art. 53 c.6 lett.
  // f-bis): il caso e' stato chiuso alla v302.7 e il form non lo produce
  // piu' dalla v300.7. Restava a raccontare una regola che non applichiamo.
  G:  ['È dipendente pubblico e l’incarico è a titolo gratuito.',
       'Senza compenso non si applica il regime autorizzatorio.' + A3_CODA_COMUNICAZIONE],
};

/* v298.5 — La qualità di docente universitario adesso è una risposta del
   relatore (punto 3.2), non una deduzione nostra. La differenza non è di
   comodità: da quella qualità dipende quale regime gli si applica, e una
   deduzione sbagliata gliela attribuiva senza che se ne accorgesse. */
function a3ModoUniversitario() {
  const el = document.querySelector('input[name="f-univ"]:checked');
  return !!el && el.value === 'si';
}

/* Resta solo come suggerimento iniziale del punto 3.2, e con un'unica fonte
   ammessa: il campo Dip.pub di DBDOC valorizzato a '3', che è una qualifica
   già dichiarata, non un indizio. L'ente non basta — in un ateneo lavorano
   anche tecnici e amministrativi, e "Azienda Ospedaliero-Universitaria"
   contiene "Universitaria" pur non essendo un'università. */
function univPrefill() {
  if (document.querySelector('input[name="f-univ"]:checked')) return;
  if ((($('f-dip-pubblico') || {}).value || '').trim() !== '3') return;
  const si = document.querySelector('input[name="f-univ"][value="si"]');
  if (si) si.checked = true;
}

/* Cambiare la risposta 3.2 azzera il regime già scelto al 5.3: le due liste non
   sono traducibili l'una nell'altra, il "tempo pieno" dell'art. 6 L. 240/2010
   non è il "tempo pieno" del rapporto d'impiego comune. */
function onUnivChange() {
  univCoerenza();
  a3Calcola();
}

/* Riconoscere un ateneo dalla denominazione richiede prudenza: la categoria IPA
   degli ospedali si chiama "Aziende Ospedaliere, Aziende Ospedaliere
   UNIVERSITARIE, Policlinici e IRCCS Pubblici", e "Azienda Ospedaliero-
   Universitaria di Ferrara" contiene "Universitaria" pur non essendo
   un'università. Si confrontano quindi gli inizi, non una sottostringa. */
function _enteEAteneo() {
  const tipo = (($('f-azienda-tipo') || {}).value || '').toUpperCase().trim();
  if (tipo.startsWith('UNIVERSIT')) return true;
  const ente = (($('f-ente') || {}).value || '').toUpperCase().trim();
  return /^(UNIVERSIT|POLITECNICO|SCUOLA (NORMALE|SUPERIORE|IMT|IUSS)|LIBERA UNIVERSIT)/.test(ente);
}

/* v299.0 — Confronta 3.1 e 3.2 e, se non tornano, lo dice. Non corregge e non
   disabilita nulla: l'incoerenza apparente può essere la situazione reale di
   chi insegna in ateneo e presta servizio in ospedale. */
function univCoerenza() {
  const box = $('univ-avviso');
  if (!box) return;
  const r = document.querySelector('input[name="f-univ"]:checked');
  const ente = (($('f-ente') || {}).value || '').trim();
  if (!r || !ente) { box.style.display = 'none'; return; }
  const ateneo = _enteEAteneo();
  if (r.value === 'si' && !ateneo) {
    box.innerHTML = 'Al punto <b>3.1</b> ha indicato <b>' + _cfEsc(ente) + '</b>, che non risulta un ateneo. '
      + 'Se il Suo rapporto di lavoro dipendente è con l’università, torni al punto 3.1 e indichi l’ateneo; '
      + 'se invece è dipendente di questa struttura, risponda <b>No</b> qui. '
      + 'La comunicazione prima dell’evento partirà comunque verso l’amministrazione indicata al punto 3.1.';
    box.style.display = '';
  } else if (r.value === 'no' && ateneo) {
    box.innerHTML = 'Al punto <b>3.1</b> ha indicato un ateneo. Se vi lavora come personale tecnico o '
      + 'amministrativo, o con un contratto di insegnamento senza rapporto di impiego, <b>No</b> è la '
      + 'risposta corretta; se invece è professore o ricercatore dell’ateneo, risponda <b>Sì</b>.';
    box.style.display = '';
  } else {
    box.style.display = 'none';
  }
}

function a3Calcola() {
  const gratuito = (CONTRATTO_INFO.importo === 0);

  // v298.9 — Il 5.1 non si chiede a chi ha già detto, al 3.2, di essere
  // professore o ricercatore di ateneo statale: la risposta è implicata.
  // v300.5 — La risposta non viene più sovrascritta nel DOM: si deriva. Il
  // radio conserva quello che il relatore aveva effettivamente segnato, ed è
  // quello che permette di accorgersi della contraddizione e segnalarla.
  const modoUni = a3ModoUniversitario();
  const dipRaw = _a3Val('a3-dip');
  A3.dipForzato = modoUni && dipRaw === 'no';
  _a3Show('a3-q1', !modoUni);
  _a3Show('a3-q1-derivato', modoUni);
  _a3Show('a3-dip-corretto', modoUni && !!A3.dipForzato);

  A3.dip = modoUni ? 'si' : (dipRaw ? (dipRaw === 'no' ? 'no' : 'si') : '');
  A3.vinc = _a3Val('a3-vinc');

  // Il regime viene dal 5.3 solo per gli universitari; per tutti gli altri è
  // già dentro la risposta al 5.1.
  // v300.8 — Il regime non ha più una domanda sua: per l'universitario a tempo
  // pieno lo dice il 3.2, per tutti gli altri è dentro la risposta al 5.1.
  const reg = modoUni
    ? 'univ_pieno'
    : ({ si_pieno: 'pieno', si_pt50: 'pt50', si_univdef: 'univ_definito', si_asp: 'asp' }[dipRaw] || '');
  A3.reg_raw = reg;

  // Regime e qualità universitaria discendono dalla stessa risposta.
  A3.univ = (reg === 'univ_pieno') ? 'pieno' : (reg === 'univ_definito') ? 'definito' : 'no';
  A3.reg = (reg === 'univ_pieno' || reg === 'univ_definito') ? 'pieno' : reg;

  const dipSi = (A3.dip === 'si');
  _a3Show('a3-q2', A3.dip === 'no');

  // Chi è già escluso per la propria posizione non deve rispondere sul
  // regolamento del proprio ente: la domanda non cambierebbe l'esito.

  let det = '';
  if (A3.dip === 'no') {
    det = { nessuno: 'A', spec: 'A1', conv: 'A2', univpriv: 'A' }[A3.vinc] || '';
  } else if (dipSi && A3.reg) {
    if (gratuito) det = 'G';
    else if (A3.reg === 'pt50') det = 'B';
    // v303.4 - Aspettativa/comando/fuori ruolo: stesso codice 'B' del part-time
    // (il form comprime in B le posizioni che il comma 6 esclude), e' il regime
    // 'asp' a farne derivare il caso B_ASP e la InfPRE 9/10.
    else if (A3.reg === 'asp') det = 'B';
    else if (A3.univ === 'definito') det = 'B';
    else if (A3.univ === 'pieno') det = 'B1';
    // v300.7 — Un solo esito per il dipendente pubblico retribuito non esente:
    // l'autorizzazione la chiediamo comunque, quindi non c'è più un bivio.
    else det = 'C';
  }
  A3.det = det;
  _a3Show('a3-prot', det === 'C');
  A3.legacy = det ? A3_LEGACY[det] : '';
  A3.sub = (A3.legacy === 'C')
    ? ((A3.univ === 'pieno' || A3.univ === 'definito') ? 'UNIV' : 'SSN') : '';

  // Allinea i radio storici, che pilotano ancora flusso, clausole e PDF.
  document.querySelectorAll('input[name="opzione"]').forEach(r => {
    r.checked = (!!A3.legacy && r.value === A3.legacy);
  });
  document.querySelectorAll('input[name="op-C-tipo"]').forEach(r => {
    r.checked = (!!A3.sub && r.value === A3.sub);
  });
  updateOpzione();

  const box = $('a3-esito');
  if (box) {
    if (det) {
      $('a3-esito-testo').textContent = A3_TESTI[det][0];
      $('a3-esito-nota').textContent = A3_TESTI[det][1];
      box.style.display = '';
    } else {
      box.style.display = 'none';
    }
  }
}

/* Rete di sicurezza: chi non si riconosce nell'esito azzera e rifà. Una
   derivazione che non si può contestare sarebbe peggio della scelta a mano.
   La risposta 3.2 non si tocca: sta in un'altra sezione e azzerarla da qui
   lascerebbe un campo obbligatorio vuoto alle spalle del relatore. */
function a3Riapri() {
  ['a3-dip', 'a3-vinc'].forEach(n => {
    document.querySelectorAll('input[name="' + n + '"]').forEach(r => { r.checked = false; });
  });
  a3Calcola();
  const q1 = $('a3-q1');
  if (q1) q1.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getA3Payload() {
  return {
    dipendente_pubblico: A3.dip || '',
    vincolo: A3.vinc || '',
    regime_orario: A3.reg || '',
    universitario: A3.univ || '',
    regolamento_ente: A3.reg_ente || '',
    regolamento_num: (($('a3-reg-num') || {}).value || '').trim(),
    regolamento_data: (($('a3-reg-data') || {}).value || '').trim(),
    regolamento_art: (($('a3-reg-art') || {}).value || '').trim(),
    regolamento_link: (($('a3-reg-link') || {}).value || '').trim(),
    opzione_dettaglio: A3.det || '',
  };
}

async function loadClausole() {
  try {
    // 1) Best: clausole inline nel prefill (Strada B)
    if (CLAUSOLE_INLINE) {
      renderBis(CLAUSOLE_INLINE.bis);
      CLAUSOLE_LOADED = true;
      return;
    }
    // 2) v141.3 — Fallback statico: stesso path su Flask locale e su sideraweb
    //    (GitHub Pages serve clausole_pubblici.json alla root, sempre online).
    //    Risolve il caso TEST-GRAT-1: snapshot creato per Opzione A senza clausole
    //    + relatore che durante la compilazione passa a B/C.
    try {
      const r = await fetch('clausole_pubblici.json', {cache: 'force-cache'});
      if (r.ok) {
        const j = await r.json();
        if (j && j.bis) {
          CLAUSOLE_INLINE = j;
          renderBis(j.bis);
          CLAUSOLE_LOADED = true;
          return;
        }
      }
    } catch (_) { /* prosegui col fallback API */ }
    // 3) Ultima chance: endpoint Flask locale (utile solo in dev)
    try {
      const r = await fetch('/api/contratti/clausole-pubblici');
      if (r.ok) {
        const j = await r.json();
        if (j && j.ok) {
          CLAUSOLE_INLINE = { bis: j.bis };
          renderBis(j.bis);
          CLAUSOLE_LOADED = true;
          return;
        }
      }
    } catch (_) { /* finita la cascata */ }
    console.warn('Clausole non caricabili da nessuna fonte');
  } catch (e) {
    console.error('loadClausole error', e);
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// Reportlab usa <b>...</b> nei template Python — li lasciamo passare. Tutto il resto è escape.
function richText(s) {
  // Permettiamo SOLO i tag <b> ... </b> (e <i>, <br/>) che vengono dai TPL Python
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/<(?!\/?(?:b|i|br\s*\/?)>)/g, '&lt;');
}

// v302.5 — Un solo renderer: renderBis e renderTer facevano la stessa cosa su
// due strutture diverse, ora l'articolo è uno e la struttura è quella a blocchi.
function renderBis(bis) {
  if (!bis) return;
  if (bis.titolo && $('bis-title')) $('bis-title').textContent = bis.titolo;
  let html = '';
  for (const b of (bis.blocchi || [])) {
    html += `<div class="clausola"><h3>${richText(b.titolo)}</h3>`;
    for (const t of (b.testi || [])) {
      html += `<p>${richText(t)}</p>`;
    }
    html += `</div>`;
  }
  if (bis.presa_visione || bis.presa_visione_spec) {
    html += `<div class="clausola" style="border-left-color:#ea580c;background:#fff7ed">
      <p><b>${richText(bis.presa_visione)}</b></p>
      <p>${richText(bis.presa_visione_spec)}</p>
    </div>`;
  }
  $('bis-content').innerHTML = html;
}

function renderSummary() {
  const sel = document.querySelector('input[name="opzione"]:checked');
  const op = sel ? sel.value : '—';
  const opTxt = {A:'A — Non dipendente pubblico', B:'B — Dipendente pubblico con autorizzazione', C:'C — Dipendente pubblico con obbligo di comunicazione'}[op] || '—';
  const tbl = $('summary-table');
  const get = id => ($(id).value || '').trim() || '—';
  const dataNasc = normalizeDateInput($('f-nato_il').value || '') || '—';
  // CDI summary
  const cdi = getCdiPayload();
  let cdiTxt;
  if (cdi.no_collab) {
    cdiTxt = '<i>Nessun rapporto commerciale dichiarato negli ultimi 2 anni</i>';
  } else if (cdi.aziende.length === 0) {
    cdiTxt = '<i style="color:#dc2626">— nessuna azienda indicata e flag "nessun rapporto" non spuntato</i>';
  } else {
    cdiTxt = cdi.aziende.map((a, i) => `${i + 1}. ${a}`).join('<br>');
  }

  tbl.innerHTML = `
    <tr><td>Cognome e Nome</td><td>${get('f-cognome')} ${get('f-nome')}</td></tr>
    <tr><td>Codice fiscale</td><td>${get('f-cf')}</td></tr>
    <tr><td>Nato a / il</td><td>${get('f-nato_a')} (${get('f-provincia')}) — ${dataNasc}</td></tr>
    <tr><td>Indirizzo</td><td>${get('f-indirizzo')} — ${get('f-cap')} ${get('f-citta')} ${get('f-provincia')}</td></tr>
    <tr><td>Cellulare / Email</td><td>${get('f-cellulare')} — ${get('f-email')}</td></tr>
    <tr><td>Azienda / Professione</td><td>${get('f-ente')} — ${get('f-qualifica')}</td></tr>
    <tr><td>PEC aziendale</td><td>${get('f-pec')}</td></tr>
    ${ibanIsHidden() ? '' : `<tr><td>IBAN</td><td>${get('f-iban')}</td></tr>`}
    ${ibanIsHidden() ? '' : `<tr><td>P.IVA</td><td>${get('f-partita_iva')}</td></tr>`}
    <tr><td>Autorizzazione</td><td><b>${opTxt}</b></td></tr>
    <tr><td>Conflitto interesse</td><td>${cdiTxt}</td></tr>
  `;
}

// CDI: toggle checkbox "no collaborazioni" → disabilita le 5 input azienda
function cdiToggleNoCollab() {
  const cb = $('cdi-no-collab');
  const block = $('cdi-aziende-block');
  if (!cb || !block) return;
  const off = cb.checked;
  block.style.opacity = off ? '0.45' : '1';
  block.style.pointerEvents = off ? 'none' : 'auto';
  for (let i = 1; i <= 5; i++) {
    const el = $('cdi-az-' + i);
    if (el) {
      el.disabled = off;
      if (off) el.value = '';
    }
  }
}

function getCdiPayload() {
  const noCollab = !!($('cdi-no-collab') && $('cdi-no-collab').checked);
  const aziende = [];
  if (!noCollab) {
    for (let i = 1; i <= 5; i++) {
      const el = $('cdi-az-' + i);
      if (el && (el.value || '').trim()) aziende.push(el.value.trim());
    }
  }
  return { aziende, no_collab: noCollab };
}

// ── Curriculum semplificato (v289.9) ────────────────────────────────────────
// Il CV smette di essere un documento che Sidera compila sul relatore e firma
// da sé: qui il relatore conferma i propri dati e li firma insieme al
// contratto. Se i dati ci sono, la pagina è una conferma da tre secondi; se
// non ci sono, è un modulo breve.

let CV_INIZIALE = {};   // copia di quello che gli abbiamo mostrato
let CV_SBLOCCATO = false;

function cvPopulate(cv) {
  const dati = cv.dati || {};
  CV_INIZIALE = Object.assign({}, dati);
  for (const k of CV_FIELDS) {
    const el = $('f-cv-' + k);
    if (el) el.value = dati[k] || '';
  }
  // v296.3 — Niente blocco e niente avvisi sulla provenienza dei dati: sono
  // campi direttamente scrivibili. Quello che il relatore lascia scritto è
  // quello che sottoscrive, e da dove sia arrivato prima non lo riguarda.
  cvSetReadonly(false);
}

/* v296.2 — Professione e disciplina sono già state dichiarate al passo 3, dove
   sono quelle su cui si regge l'accreditamento ECM dell'evento. Richiederle qui
   significava farle scrivere due volte e rischiare che le due risposte non
   coincidessero. Si ereditano; restano modificabili, ma con la nota di dove
   arrivano. */
function cvEreditaDaStep3() {
  // Solo in modalità ECM: lì f-qualifica e f-specialita contengono i nomi
  // canonici AGENAS scelti dai menu. Fuori da quella modalità f-qualifica è il
  // ruolo lavorativo che arriva dall'anagrafica ("Direttore S.C. Oncologia…"),
  // che nel curriculum ECM non è una professione e non va copiato.
  if ((($('f-ecm-flag') || {}).value || '').trim() !== '1') return;
  const coppie = [['f-cv-professione', 'f-qualifica'], ['f-cv-disciplina', 'f-specialita']];
  for (const [dest, src] of coppie) {
    const d = $(dest), s = $(src);
    if (!d || !s) continue;
    const v = (s.value || '').trim();
    if (v) d.value = v;
  }
}

function cvSetReadonly(ro) {
  CV_SBLOCCATO = !ro;
  document.querySelectorAll('.cv-in').forEach(el => {
    // v290.3 — Il blocco vale solo per i campi che un valore ce l'hanno: sono
    // quelli da confermare. Un campo vuoto non si conferma, si compila, e
    // lasciarlo in sola lettura obbligava a passare da "Correggi" per
    // scrivere in una casella che era già visibilmente da riempire.
    const bloccalo = ro && (el.value || '').trim() !== '';
    el.readOnly = bloccalo;
    el.style.background = bloccalo ? '#f8fafc' : '#fff';
    el.style.color = bloccalo ? '#475569' : '#0f172a';
  });
}

function cvUnlock() {   // conservata: la richiama cvValidate() sui campi vuoti
  cvSetReadonly(false);
}

function getCvPayload() {
  const out = {};
  for (const k of CV_FIELDS) {
    const el = $('f-cv-' + k);
    out[k] = el ? (el.value || '').trim() : '';
  }
  return out;
}

function cvValidate() {
  const richiesti = Object.assign({}, CV_OBBLIGATORI);
  if (cvEMedico()) richiesti.albo_numero = 'Numero di iscrizione all\'albo';
  for (const [k, label] of Object.entries(richiesti)) {
    const el = $('f-cv-' + k);
    if (!el || (el.value || '').trim()) continue;
    // Se il campo obbligatorio è vuoto ma la scheda è ancora bloccata, il
    // relatore non può nemmeno scriverci: si sblocca prima di protestare.
    if (!CV_SBLOCCATO) cvUnlock();
    showFormMsg('Campo obbligatorio mancante nel curriculum: ' + label, 'error');
    el.focus();
    return false;
  }
  return true;
}

async function submitForm() {
  const sel = document.querySelector('input[name="opzione"]:checked');
  if (!sel) { showFormMsg('Selezione opzione mancante.', 'error'); return; }

  // v126.8 — Final PEC check (defensive, lo step 5 dovrebbe già aver bloccato)
  if (sel.value === 'B' || sel.value === 'C') {
    const pecV = (($('f-pec') || {}).value || '').trim();
    if (!pecV) {
      showFormMsg('PEC aziendale obbligatoria per dipendenti pubblici (Opzione ' + sel.value + '). Torni al Passo 3 e inserisca la PEC prima di inviare.', 'error');
      return;
    }
  }

  // v318.5 — Final check metodo di pagamento (defensive, lo step 4 dovrebbe già aver bloccato)
  if (!pmQuestionIsHidden() && !metodoPagamento()) {
    showFormMsg('Torni al passo 4 e indichi come preferisce ricevere il compenso.', 'error');
    return;
  }

  // v120.5 — Final IBAN check (defensive, lo step 4 dovrebbe già aver bloccato)
  // v133.1 — Skip se incarico gratuito (IBAN row nascosta nel form)
  if (!ibanIsHidden()) {
    const ibanV = ($('f-iban').value || '').trim();
    if (!ibanV && ibanIsRequired()) {
      showFormMsg('IBAN obbligatorio: ha scelto il pagamento tramite bonifico. Torni al passo 4 e inserisca l\'IBAN.', 'error');
      return;
    }
    if (ibanV) {
      const r = validateIban(ibanV);
      if (!r.ok) {
        showFormMsg('IBAN non valido — ' + r.msg + '. Torni al passo 4 per correggere prima di inviare.', 'error');
        return;
      }
      $('f-iban').value = normalizeIban(ibanV);
    }
  } else {
    // v318.5 — Ha scelto "link" (o l'incarico è gratuito): un IBAN digitato
    // prima di cambiare scelta non deve restare in giro e finire inviato.
    $('f-iban').value = '';
  }

  const anag = {};
  for (const k of FIELDS) {
    const el = $('f-' + k);
    if (!el) continue;
    let v = (el.value || '').trim();
    if (k === 'nato_il') v = normalizeDateInput(v);
    if (k === 'cf' || k === 'iban' || k === 'provincia') v = v.toUpperCase();
    anag[k] = v;
  }
  // v318.5 — Scelta esplicita del metodo di pagamento (vuota se incarico gratuito).
  anag.metodo_pagamento = metodoPagamento();

  // v289.9 — Controllo finale sul curriculum (difensivo: lo step 'cv'
  // dovrebbe già aver bloccato). Senza questi campi il CV allegato al
  // contratto uscirebbe monco e il relatore lo firmerebbe comunque.
  if (!cvValidate()) return;

  const cdi = getCdiPayload();

  const btn = $('btn-submit');
  btn.disabled = true;
  btn.textContent = '⏳ Invio in corso…';

  try {
    // Strada B: il submit va al GAS Web App pubblico, che scrive sul Sheet
    // Pipeline. MedFIND polla quel Sheet (ogni 5 min) e processa: genera PDF,
    // mergeia CDI, manda a iLovePDF. Il signer riceverà l'email iLovePDF.
    // Sub-tipo C (SSN | UNIV): solo se Opzione C, altrimenti vuoto
    const subC = document.querySelector('input[name="op-C-tipo"]:checked');
    const tipoDipPub = (sel.value === 'C' && subC) ? subC.value : '';

    // v127.2 — Snapshot Azienda (Pubblica/Privata + lookup DBAO o Altro)
    const azienda = {
      company_type: ($('f-company-type').value || '').toLowerCase(),  // 'pubblica' | 'privata' | ''
      tipo:        $('f-azienda-tipo').value || '',
      citta:       $('f-azienda-citta').value || '',
      prov:        $('f-azienda-prov').value || '',
      dbao_id:     $('f-dbao-id').value || '',                         // '' se Altro
      ipa_cod:     $('f-ipa-cod').value || '',                         // Codice IPA se scelto dall'Indice PA
      pec_attuale: cmState.pec_attuale || '',                          // PEC originale in DBAO
    };

    // v290.0 — Aperto da localhost il submit resta locale, come già faceva il
    // prefill. Prima andava sempre a GAS: una prova fatta sul PC dell'operatore
    // scriveva una riga sul Foglio Pipeline e tornava indietro col polling
    // qualche minuto dopo, che per un test è insieme lento e sporco.
    const submitLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const submitUrl = submitLocal ? '/api/contratti/submit' : GAS_API_URL;
    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },  // GAS doPost evita preflight CORS con text/plain
      body: JSON.stringify({
        action: 'submit',
        token: TOKEN,
        opzione_aut: sel.value,
        tipo_dip_pub: tipoDipPub,  // v120.4: 'SSN' | 'UNIV' (solo se C)
        // v296.2 — Risposte grezze dell'ART. 3 più il codice di dettaglio. Il
        // server ricalcola: quello che arriva da qui è un suggerimento.
        art3: getA3Payload(),
        anagrafica: anag,
        azienda: azienda,         // v127.2 (Fase 5: backend usa per discordanze PEC / nuovi enti)
        ecm: ($('f-ecm-flag').value || ''),  // v127.9: '1' ECM, '0' non ECM, '' straniero
        agenas_prof_cod: ($('f-prof-cod').value || ''),     // v128.0: codice prof. AGENAS (solo se ECM)
        agenas_disc_cod: ($('f-disc-cod').value || ''),     // v128.0: codice disciplina AGENAS (solo se ECM)
        aziende: cdi.aziende,
        no_collab: cdi.no_collab,
        cv: getCvPayload(),   // v289.9: curriculum confermato dal relatore
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      const msg = data.error || 'errore sconosciuto';
      if (data.already_submitted) {
        showState('success-screen');
        return;
      }
      showFormMsg('Errore invio: ' + msg, 'error');
      btn.disabled = false;
      btn.textContent = '📨 Invia PDF per la firma';
      return;
    }
    showState('success-screen');
  } catch (e) {
    showFormMsg('Errore di rete: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = '📨 Invia PDF per la firma';
  }
}

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
  box.innerHTML = testa + enti.map((e, i) =>
    '<div class="cm-strut-item" onclick="cmIpaSelect(' + i + ')">'
    + '<b>' + _cfEsc(e.nome) + '</b>'
    + '<div style="color:#64748b;font-size:14px">'
    + _cfEsc(e.comune) + ' (' + _cfEsc(e.prov) + ') · ' + _cfEsc(e.tipologia || '')
    + '</div></div>').join('');
}

function _cfEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cmIpaSelect(i) {
  const e = _cmIpaUltimi[i];
  if (!e) return;
  cmState.ipa = e;
  cmState.struttura = null;
  _cm('cm-struttura-info').innerHTML =
    '<b>' + _cfEsc(e.nome) + '</b><br><span style="color:#64748b;font-size:14px">'
    + _cfEsc(e.tipologia || '') + ' · ' + _cfEsc(e.comune) + ' (' + _cfEsc(e.prov) + ')</span>';
  _cm('cm-pec-ipa').textContent = e.pec || '';
  _cm('cm-pec-ipa-box').style.display = '';
  _cm('cm-pec-man-box').style.display = 'none';
  cmShowStep('cm-step-conferma');
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
  // Privata → forza Opzione A in Art. 3 (e auto-skip step 5/6/7)
  const radioA = document.querySelector('input[name="opzione"][value="A"]');
  if (radioA) {
    radioA.checked = true;
    if (typeof updateOpzione === 'function') updateOpzione();
  }
  updateAziendaSummary();
  closeCompanyModal();
}

function _populateCitiesDatalist() {
  // Riempie la datalist con le città distinte presenti in DBAO (Pubblica).
  const dl = _cm('cm-cities-datalist');
  if (!dl) return;
  const setCitta = new Map(); // citta_upper → display "Citta (PROV)"
  for (const r of cmDbaoCache) {
    const c = (r.CITTA || '').trim();
    const p = (r.Prov || r.PROV || '').trim();
    if (!c) continue;
    const key = c.toUpperCase() + '|' + p.toUpperCase();
    if (!setCitta.has(key)) setCitta.set(key, c);
  }
  const sortedCitta = [...setCitta.values()].sort((a, b) => a.localeCompare(b, 'it'));
  dl.innerHTML = '';
  for (const c of sortedCitta) {
    const o = document.createElement('option');
    o.value = c;
    dl.appendChild(o);
  }
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
    if (!confirm('La città indicata non risulta tra quelle in archivio. ' +
                 'Vuole proseguire comunque (potrà inserire la struttura come "Altro")?')) {
      return;
    }
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
    _cm('f-dbao-id').value = '';
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

// v127.9 — Mini modal ECM/Non ECM ─────────────────────────────────────────
// Si apre automaticamente all'ingresso Step 3 (solo italiani, solo se flag
// non ancora impostato). La scelta condiziona il flag "ecm" salvato nel submit.
// Per ora i campi Professione/Disciplina restano free text in entrambi i casi.

function openEcmModal() {
  $('em-overlay').style.display = 'flex';
}
function closeEcmModal() {
  $('em-overlay').style.display = 'none';
}
function emChoose(value) {
  // value = 1 (ECM) | 0 (non ECM)
  $('f-ecm-flag').value = String(value);
  updateEcmBadge();
  applyEcmModeToStep3();  // v128.0 — switch UI dropdown vs free text
  closeEcmModal();
}
function updateEcmBadge() {
  const row = $('ecm-badge-row');
  const badge = $('ecm-badge');
  const text = $('ecm-badge-text');
  if (!row || !badge || !text) return;
  const v = ($('f-ecm-flag').value || '').trim();
  if (v === '1') {
    row.style.display = '';
    badge.className = 'ecm-badge ecm';
    text.innerHTML = '✅ <b>Ambito ECM</b> — professione sanitaria';
  } else if (v === '0') {
    row.style.display = '';
    badge.className = 'ecm-badge non-ecm';
    text.innerHTML = '📋 <b>Non ECM</b> — non rientro tra le professioni sanitarie ECM';
  } else {
    row.style.display = 'none';
  }
}
function tryAutoOpenEcmModal() {
  // Apri il modal ECM se: siamo in Step 3 + non straniero + flag vuoto.
  // Per stranieri non chiediamo (gestiti separatamente come oggi).
  const steps = getCurrentSteps();
  const stepKey = steps[CURRENT_STEP_INDEX];
  if (stepKey !== '3') return;
  if (CONTRATTO_INFO.straniero) return;
  if (($('f-ecm-flag').value || '').trim() !== '') return;
  openEcmModal();
}

// v128.0 — Dropdown vincolati AGENAS (modalità ECM) ─────────────────────────

function _populateProfDropdown() {
  // Popola il <select> Professione con le 31 voci AGENAS (ordine numerico cod).
  const sel = $('f-prof-select');
  if (!sel) return;
  // Mantieni la prima opzione vuota
  let html = '<option value="">— scegli professione —</option>';
  for (const p of AGENAS_DATA.professioni) {
    html += `<option value="${p.cod}">${p.nome}</option>`;
  }
  sel.innerHTML = html;
}

function _populateDiscDropdown(codProf) {
  // Popola il <select> Disciplina con le discipline native della professione scelta.
  // Le voci sono già ordinate alfabeticamente nel JSON.
  const sel = $('f-disc-select');
  if (!sel) return;
  if (!codProf) {
    sel.innerHTML = '<option value="">— prima scelga la professione —</option>';
    sel.disabled = true;
    return;
  }
  const list = AGENAS_DATA.discipline_per_prof[String(codProf)] || [];
  let html = '<option value="">— scegli disciplina —</option>';
  for (const d of list) {
    html += `<option value="${d.cod}">${d.nome}</option>`;
  }
  sel.innerHTML = html;
  sel.disabled = false;
}

function onProfEcmChange() {
  const sel = $('f-prof-select');
  const codProf = sel.value;
  const nomeProf = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
  $('f-prof-cod').value = codProf || '';
  $('f-qualifica').value = (codProf ? nomeProf : '');
  // Reset disciplina quando cambia la professione
  $('f-disc-cod').value = '';
  $('f-specialita').value = '';
  _populateDiscDropdown(codProf);
}

function onDiscEcmChange() {
  const sel = $('f-disc-select');
  const codDisc = sel.value;
  const nomeDisc = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
  $('f-disc-cod').value = codDisc || '';
  $('f-specialita').value = (codDisc ? nomeDisc : '');
}

function applyEcmModeToStep3() {
  // Mostra dropdown AGENAS (ECM) o input free text (Non-ECM/straniero).
  const ecmFlag = ($('f-ecm-flag').value || '').trim();
  const isEcm = (ecmFlag === '1');
  // Stranieri: niente flag → mostra free text (modalità default)
  $('prof-ecm-row').style.display = isEcm ? '' : 'none';
  $('disc-ecm-row').style.display = isEcm ? '' : 'none';
  $('prof-free-row').style.display = isEcm ? 'none' : '';
  $('disc-free-row').style.display = isEcm ? 'none' : '';

  if (isEcm) {
    // Pre-selezione: se Qualifica DBDOC = nome canonico AGENAS, preseleziona dropdown
    const qualNow = ($('f-qualifica').value || '').trim().toUpperCase();
    const profMatch = AGENAS_DATA.professioni.find(p => p.nome === qualNow);
    if (profMatch && !$('f-prof-cod').value) {
      $('f-prof-select').value = String(profMatch.cod);
      $('f-prof-cod').value = String(profMatch.cod);
      _populateDiscDropdown(profMatch.cod);
      // Pre-selezione Disciplina se Specialità DBDOC matcha esattamente
      const specNow = ($('f-specialita').value || '').trim().toUpperCase();
      if (specNow) {
        const list = AGENAS_DATA.discipline_per_prof[String(profMatch.cod)] || [];
        const discMatch = list.find(d => d.nome === specNow);
        if (discMatch) {
          $('f-disc-select').value = String(discMatch.cod);
          $('f-disc-cod').value = String(discMatch.cod);
        }
      }
    } else if ($('f-prof-cod').value) {
      // Il codice è già impostato (es. dopo onProfEcmChange) — solo sincronizza select
      $('f-prof-select').value = $('f-prof-cod').value;
      _populateDiscDropdown($('f-prof-cod').value);
      if ($('f-disc-cod').value) {
        $('f-disc-select').value = $('f-disc-cod').value;
      }
    }
  }
}

init();
