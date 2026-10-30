/* v394.8 — Residenza del form contratto: città (2.3), CAP (2.2), provincia (2.4).
 *
 * The city is typed by hand: a datalist offers the current ISTAT comuni but a
 * free value is still accepted. Three non-blocking warnings, all advisory:
 *   - the city is not an Italian comune (Rizzo 1359-21 wrote «LECCEL»);
 *   - the CAP does not belong to the city (cap_comuni.json, keyed by cadastral code);
 *   - the province disagrees with the city (v391.2, Falco 1352-19).
 * Split out of contratto-form.js (R09 budget 2700). Depends on its globals:
 * $, CF_CODES_CACHE, _ensureCfCodesLoaded, PROVINCE_IT, _cfEsc, _aggiornaResidenzaEstera,
 * _residenzaEstera. Both copies (MedFIND static/ and SitoSidera) must stay identical.
 */
let CAP_COMUNI_CACHE = null;   // {CADASTRAL: "73100" | "00100 00118 ..."}

async function _ensureCapLoaded() {
  if (CAP_COMUNI_CACHE) return true;
  try {
    const r = await fetch('cap_comuni.json');
    if (!r.ok) return false;
    const d = await r.json();
    if (Object.keys(d).length < 7000) return false;
    CAP_COMUNI_CACHE = d;
    return true;
  } catch (e) { return false; }
}

// Accents typed as letters or as apostrophes (Agliè / AGLIE') compare equal.
function _resNorm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
}

// Current comuni only: suppressed ones carry 'S' (ISTAT list, v391.3).
function _resComuni() {
  return Object.entries(CF_CODES_CACHE || {}).filter(([k, v]) => k[0] !== 'Z' && v[2] !== 'S');
}

async function _resDatalist() {
  const inp = $('f-citta');
  if (!inp || $('citta-list') || !(await _ensureCfCodesLoaded())) return;
  const dl = document.createElement('datalist');
  dl.id = 'citta-list';
  dl.innerHTML = [...new Set(_resComuni().map(([, v]) => v[0]))].sort()
    .map(n => `<option value="${_cfEsc(n)}">`).join('');
  document.body.appendChild(dl);
  inp.setAttribute('list', 'citta-list');
  inp.setAttribute('autocomplete', 'off');
}

function _resAvviso(id, anchor) {
  let w = $(id);
  if (!w && anchor) { w = document.createElement('div'); w.id = id; w.className = 'hint'; w.style.color = '#b45309'; anchor.parentNode.appendChild(w); }
  return w;
}

function _resUsaCitta(nome) {
  $('f-citta').value = nome;
  _residenzaCittaProvincia(true);
}

// fill=true: an empty province is completed from the city (prefill, city typed).
async function _residenzaCittaProvincia(fill) {
  const sel = $('f-pvr'), inp = $('f-citta'); if (!sel || !inp) return;
  const wp = _resAvviso('pvr-avviso', sel), wc = _resAvviso('citta-avviso', inp);
  wp.innerHTML = ''; wc.innerHTML = '';
  const citta = inp.value.trim().toUpperCase();
  if (!citta || _residenzaEstera() || !(await _ensureCfCodesLoaded())) return;
  const capOk = await _ensureCapLoaded();
  const cap = ((($('f-cap') || {}).value) || '').trim();
  const key = _resNorm(citta);
  const match = _resComuni().filter(([, v]) => _resNorm(v[0]) === key);
  const capComuni = (capOk && /^\d{5}$/.test(cap))
    ? _resComuni().filter(([k]) => (CAP_COMUNI_CACHE[k] || '').split(' ').includes(cap)) : [];
  const elenco = l => l.slice(0, 3).map(([, v]) =>
    `<a href="#" onclick="_resUsaCitta('${_cfEsc(v[0]).replace(/'/g, "\\'")}');return false"><b>${_cfEsc(v[0])}</b></a> (${v[1]})`).join(', ');

  if (!match.length) {
    wc.innerHTML = `⚠ «${_cfEsc(citta)}» non risulta tra i comuni italiani: verifichi di averlo scritto per intero e senza errori (se risiede in una frazione, indichi il comune).`
      + (capComuni.length ? ` Il CAP ${cap} corrisponde a ${elenco(capComuni)}.` : '');
    return;
  }
  const caps = match.map(([k]) => CAP_COMUNI_CACHE && CAP_COMUNI_CACHE[k]).filter(Boolean).join(' ').split(' ').filter(Boolean);
  if (capOk && /^\d{5}$/.test(cap) && caps.length && !caps.includes(cap)) {
    wc.innerHTML = `⚠ Il CAP ${cap} non corrisponde a ${_cfEsc(match[0][1][0])}`
      + (caps.length <= 3 ? ` (CAP ${caps.join(', ')})` : '') + '.'
      + (capComuni.length ? ` Risulta di ${elenco(capComuni)}.` : '') + ' Verifichi CAP e città.';
  }

  const sig = new Set(match.map(([, v]) => v[1]));
  let prov = sig.size === 1 ? [...sig][0] : '';
  if (!PROVINCE_IT.includes(prov)) prov = '';
  if (fill && prov && !sel.value) { sel.value = prov; _aggiornaResidenzaEstera(); }
  const pvr = (sel.value || '').toUpperCase();
  wp.innerHTML = (prov && pvr && pvr !== 'EE' && pvr !== prov)
    ? `⚠ ${_cfEsc(citta)} risulta in provincia di <b>${prov}</b>, non ${_cfEsc(pvr)}. Verifichi la provincia di <b>residenza</b> (non quella di nascita).` : '';
}

document.addEventListener('change', e => {
  const id = e.target && e.target.id;
  if (id === 'f-pvr') _aggiornaResidenzaEstera();
  if (id === 'f-citta' || id === 'f-pvr' || id === 'f-cap') _residenzaCittaProvincia(id === 'f-citta');
});
_resDatalist();
_ensureCapLoaded();
