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
  if (_RE_ENTE_PUBBLICO.test(ente) || _RE_ENTE_PUBBLICO_OVUNQUE.test(ente)) return 'nome';
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
  if (av) av.style.display = (rr && rr.value === 'dipendente' && _privataMaPubblica()) ? '' : 'none';
}

function _a3RappConfermaDovuta() {
  const ctype = (($('f-company-type') || {}).value || '').toLowerCase();
  return ctype === 'pubblica' && A3.dip === 'no' && A3.vinc === 'nessuno';
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
