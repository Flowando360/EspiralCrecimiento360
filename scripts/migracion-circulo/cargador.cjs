// CARGADOR Círculo → Espiral (empresa Mármoles y Servicios). Lee el ORIGEN (solo GET). Escribe SOLO en el destino.
// Uso: node f3_cargador.cjs <fase> [--aplicar]   fases: plan | cuentas | borrar | datos | archivos | verificar
const fs = require('fs'), crypto = require('crypto');
const FASE = process.argv[2] || 'plan', APLICAR = process.argv.includes('--aplicar'), SP = __dirname;
const O = { url: process.env.ORIGEN_SUPABASE_URL, key: process.env.ORIGEN_SUPABASE_SERVICE_ROLE_KEY };
const D = { url: 'https://dsunoydgabtfdypmnana.supabase.co', key: process.env.SUPABASE_SERVICE_ROLE_KEY };
const H = k => ({ apikey: k, Authorization: `Bearer ${k}` });
const EMP_ORIGEN = '00000000-0000-0000-0000-000000000001', MYS = '7fda2fa1-b69c-5acc-9f17-374f828831a6', CONV = '00000000-0000-0000-0000-000000000001';
const NS = 'c1a0b5e2-7d3f-5a11-9c4e-2f6b8d9a0e13';
const v5 = n => { const ns = Buffer.from(NS.replace(/-/g, ''), 'hex'); const h = crypto.createHash('sha1').update(ns).update(n).digest(); h[6] = (h[6] & 0x0f) | 0x50; h[8] = (h[8] & 0x3f) | 0x80; const x = h.subarray(0, 16).toString('hex'); return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`; };
const get = async (p, path, extra = {}) => { const r = await fetch(p.url + path, { headers: { ...H(p.key), ...extra } }); return r; };
const todo = async (p, t, sel = '*') => { let r = [], d = 0; for (;;) { const res = await get(p, `/rest/v1/${t}?select=${sel}`, { Range: `${d}-${d + 999}`, 'Range-Unit': 'items' }); const x = await res.json(); if (!Array.isArray(x)) return null; r = r.concat(x); if (x.length < 1000) break; d += 1000; } return r; };
const authUsers = async p => (await (await get(p, '/auth/v1/admin/users?per_page=1000')).json()).users;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EXCLUIR_TABLAS = new Set(['empresas']);   // la empresa Mármoles del destino ya existe y conserva su marca/ajustes
const FK_EXTRA = [['guia_del_flow_invitaciones', 'usado_por_usuario_flow_id', 'flow_perfiles'], ['guia_del_flow', 'cuestionario_flow_id', 'flow_cuestionarios']];
const RUTAS = [['flow_documentos', 'storage_path'], ['flow_pilares_sesiones', 'storage_path'], ['nexa_feed_publicaciones', 'archivo_url']];

async function preparar() {
  const swO = (await (await get(O, '/rest/v1/')).json()).definitions, swD = (await (await get(D, '/rest/v1/')).json()).definitions;
  const tablas = Object.keys(swO).filter(t => !t.startsWith('v_') && !EXCLUIR_TABLAS.has(t));
  const meta = {};
  for (const t of tablas) { const pk = [], fk = []; for (const [c, def] of Object.entries(swO[t].properties || {})) { const d = def.description || ''; if (/<pk\/>/.test(d)) pk.push(c); const m = /<fk table='([^']+)' column='([^']+)'\/>/.exec(d); if (m && m[2] === 'id') fk.push([c, m[1]]); } for (const [tt, c, tr] of FK_EXTRA) if (tt === t) fk.push([c, tr]); meta[t] = { pk, fk }; }
  const datos = {}; for (const t of tablas) { const r = await todo(O, t); if (r && r.length) datos[t] = r; }
  const uO = await authUsers(O), uD = await authUsers(D);
  const porCorreoD = new Map(uD.map(u => [(u.email || '').toLowerCase(), u])); const correoO = new Map(uO.map(u => [u.id, (u.email || '').toLowerCase()]));
  const perfilesO = datos.perfiles_usuario || []; const idsPerfil = new Set(perfilesO.map(p => p.id));
  const perfD = await todo(D, 'perfiles_usuario', 'id,empresa_id,usuario');
  const duenaD = new Map(perfD.map(p => [p.id, p.empresa_id]));
  // mapa de cuentas: origen -> destino
  const cuenta = new Map(), crear = [], unificadas = [];
  for (const u of uO) {
    const ex = porCorreoD.get((u.email || '').toLowerCase());
    if (ex) { if (duenaD.get(ex.id) === CONV && idsPerfil.has(u.id)) throw new Error('Choque con CONVERGIA: ' + u.email); cuenta.set(u.id, ex.id); if (!idsPerfil.has(u.id)) unificadas.push(u.id); }
    else if (idsPerfil.has(u.id)) { cuenta.set(u.id, v5('auth:' + u.id)); crear.push({ origen: u, id: v5('auth:' + u.id) }); }
    else { cuenta.set(u.id, u.id); crear.push({ origen: u, id: u.id }); }
  }
  // mapas de identificadores
  const idMap = {};
  for (const t of Object.keys(datos)) { if (!(meta[t].pk.length === 1 && meta[t].pk[0] === 'id')) continue; idMap[t] = new Map(); for (const r of datos[t]) idMap[t].set(r.id, t === 'perfiles_usuario' || t === 'flow_perfiles' ? (cuenta.get(r.id) ?? r.id) : (t.startsWith('flow_') ? r.id : v5(t + ':' + r.id))); }
  const todosMapa = new Map(); for (const t of Object.keys(idMap)) for (const [a, b] of idMap[t]) todosMapa.set(a, b); todosMapa.set(EMP_ORIGEN, MYS); for (const [a, b] of cuenta) todosMapa.set(a, b);
  const reescribir = s => typeof s === 'string' ? s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, u => todosMapa.get(u) ?? u) : s;
  const mapear = (tr, v) => v == null ? v : tr === 'empresas' ? MYS : tr === 'perfiles_usuario' || tr === 'flow_perfiles' ? (cuenta.get(v) ?? idMap[tr]?.get(v)) : idMap[tr]?.get(v);
  const colsD = t => Object.keys(swD[t]?.properties || {});
  const usuariosAjenos = new Set(perfD.filter(p => p.empresa_id !== MYS).map(p => (p.usuario || '').toLowerCase()));
  const plan = {}, rotas = [], ajustes = [];
  for (const t of Object.keys(datos)) {
    if (!swD[t]) { rotas.push(`tabla ${t} no existe en destino`); continue; }
    const permitidas = new Set(colsD(t));
    plan[t] = datos[t].map(r => {
      const n = {}; for (const [c, v] of Object.entries(r)) if (permitidas.has(c)) n[c] = v;
      if (idMap[t]) n.id = idMap[t].get(r.id);
      for (const [c, tr] of meta[t].fk) { if (r[c] == null || !permitidas.has(c)) continue; const nv = mapear(tr, r[c]); if (nv === undefined) { if (FK_EXTRA.some(([tt, cc]) => tt === t && cc === c)) { n[c] = null; ajustes.push(`${t}.${c}: referencia a un registro inexistente en el origen → vacío`); } else rotas.push(`${t}.${c}→${tr}: ${r[c]}`); } else n[c] = nv; }
      if ('empresa_id' in n && n.empresa_id) n.empresa_id = MYS;
      for (const [tt, c] of RUTAS) if (tt === t && n[c]) n[c] = reescribir(n[c]);
      if (t === 'perfiles_usuario' && usuariosAjenos.has((n.usuario || '').toLowerCase())) { ajustes.push(`usuario "${n.usuario}" → "${n.usuario}.mys"`); n.usuario = n.usuario + '.mys'; }
      return n;
    });
  }
  return { swO, swD, meta, datos, plan, rotas, ajustes, crear, unificadas, cuenta, reescribir, uO, uD, idMap, perfD };
}
function orden(plan, meta) { // orden topológico; las columnas hacia tablas aún no cargadas se difieren
  const pend = new Set(Object.keys(plan)), res = [], hecho = new Set(), diferidas = {};
  while (pend.size) { let avanzo = false; for (const t of [...pend]) { const deps = meta[t].fk.map(f => f[1]).filter(x => x !== t && plan[x] && !hecho.has(x)); if (deps.length === 0) { res.push(t); hecho.add(t); pend.delete(t); avanzo = true; } } if (!avanzo) { const t = [...pend][0]; diferidas[t] = meta[t].fk.filter(f => f[1] !== t && plan[f[1]] && !hecho.has(f[1])).map(f => f[0]); res.push(t); hecho.add(t); pend.delete(t); } }
  for (const t of res) { const prop = meta[t].fk.filter(f => f[1] === t).map(f => f[0]); if (prop.length) diferidas[t] = [...new Set([...(diferidas[t] || []), ...prop])]; }
  return { res, diferidas };
}
async function snapshotDestino(swD) { // ids de todas las tablas del destino
  const snap = {}; for (const t of Object.keys(swD).filter(t => !t.startsWith('v_'))) { const props = Object.keys(swD[t].properties || {}); const col = props.includes('id') ? 'id' : null; if (!col) continue; const r = await todo(D, t, 'id' + (props.includes('empresa_id') ? ',empresa_id' : '')); if (r) snap[t] = r; } return snap;
}
async function upsert(t, filas, pk, quitar = new Set()) {
  for (let i = 0; i < filas.length; i += 200) {
    let trozo = filas.slice(i, i + 200).map(f => { const n = { ...f }; for (const c of quitar) delete n[c]; return n; });
    for (let intento = 0; intento < 4; intento++) {
      const r = await fetch(`${D.url}/rest/v1/${t}?on_conflict=${pk.join(',')}`, { method: 'POST', headers: { ...H(D.key), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(trozo) });
      if (r.ok) break; const e = await r.json().catch(() => ({})); const m = /column "([^"]+)"/.exec(e.message || '');
      if (e.code === '428C9' && m) { quitar.add(m[1]); trozo = trozo.map(f => { const n = { ...f }; delete n[m[1]]; return n; }); continue; }
      throw new Error(`${t}: ${r.status} ${e.message || JSON.stringify(e)} ${e.details || ''}`);
    }
  }
}
(async () => {
  const B = await preparar(); const { plan, meta } = B;
  const { res: ordenTablas, diferidas } = orden(plan, meta);
  const filas = Object.values(plan).reduce((a, x) => a + x.length, 0);
  if (FASE === 'plan') {
    console.log(`PLAN: ${Object.keys(plan).length} tablas, ${filas} filas | relaciones rotas: ${B.rotas.length}${B.rotas.length ? '\n  ' + B.rotas.slice(0, 8).join('\n  ') : ''}`);
    console.log(`CUENTAS: reutilizadas por correo ${[...B.cuenta].filter(([a, b]) => a !== b).length - 0} | a crear ${B.crear.length} (${B.crear.filter(c => c.origen).length}) | unificadas con una cuenta existente ${B.unificadas.length}`);
    console.log('AJUSTES:', B.ajustes.join(' ; ') || 'ninguno'); console.log('Columnas diferidas por ciclos/autorreferencias:', JSON.stringify(diferidas));
    console.log('ORDEN:', ordenTablas.join(' > '));
    const snap = await snapshotDestino(B.swD); fs.writeFileSync(SP + '/f3_snapshot_previo.json', JSON.stringify(snap));
    const colision = []; for (const t of Object.keys(plan)) { const ex = new Map((snap[t] || []).map(x => [x.id, x.empresa_id])); for (const r of plan[t]) if (r.id && ex.has(r.id)) { const dueña = ex.get(r.id); if (!(t === 'perfiles_usuario' || t === 'flow_perfiles') || dueña === CONV) colision.push(`${t}:${r.id}:${dueña}`); } }
    console.log('COLISIONES de id con filas existentes del destino (deben ser 0):', colision.length, colision.slice(0, 5).join(' | '));
    fs.writeFileSync(SP + '/f3_plan.json', JSON.stringify({ orden: ordenTablas, diferidas, cuenta: [...B.cuenta] }));
    return;
  }

  const previo = JSON.parse(fs.readFileSync(SP + '/f3_snapshot_previo.json', 'utf8'));
  const ap = APLICAR ? '' : ' (SIMULACRO: no escribe)';

  if (FASE === 'extras') { // filas creadas por disparadores durante la carga (creadas desde el corte y que no están en el plan)
    const CORTE = process.argv.find(a => a.startsWith('--corte='))?.slice(8) || '2026-11-01T13:00:00Z'; const hallazgos = {};
    for (const t of Object.keys(B.swD).filter(t => !t.startsWith('v_'))) { const props = Object.keys(B.swD[t].properties || {}); if (!props.includes('created_at') || !props.includes('id')) continue; const sel = 'id,created_at' + (props.includes('empresa_id') ? ',empresa_id' : ''); const r = await todo(D, t, sel); if (!r) continue; const delPlan = new Set((plan[t] || []).map(x => x.id)); const nuevos = r.filter(x => x.created_at >= CORTE && !delPlan.has(x.id)); if (nuevos.length) hallazgos[t] = nuevos; }
    console.log('FILAS creadas por disparadores desde ' + CORTE + ' (no están en el plan):'); for (const [t, a] of Object.entries(hallazgos)) console.log('  ', t, a.length, a[0].empresa_id !== undefined ? JSON.stringify(a.reduce((o, x) => (o[x.empresa_id === MYS ? 'MYS' : x.empresa_id === CONV ? 'CONV' : String(x.empresa_id).slice(0, 8)] = (o[x.empresa_id === MYS ? 'MYS' : x.empresa_id === CONV ? 'CONV' : String(x.empresa_id).slice(0, 8)] || 0) + 1, o), {})) : '(sin empresa_id)');
    fs.writeFileSync(SP + '/f3_extras.json', JSON.stringify(Object.fromEntries(Object.entries(hallazgos).map(([t, a]) => [t, a.map(x => x.id)]))));
    return;
  }
  if (FASE === 'cuentas') {
    console.log(`CUENTAS${ap}: crear ${B.crear.length}`); if (!APLICAR) return; let ok = 0, ya = 0;
    for (const c of B.crear) { const u = c.origen; const r = await fetch(`${D.url}/auth/v1/admin/users`, { method: 'POST', headers: { ...H(D.key), 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, email: u.email, email_confirm: true, password: crypto.randomBytes(18).toString('base64url') + 'aA1!', user_metadata: u.user_metadata || {} }) }); if (r.ok) ok++; else { const e = await r.json().catch(() => ({})); if (/already|registered|exists/i.test(JSON.stringify(e))) ya++; else throw new Error('crear cuenta ' + u.email + ': ' + JSON.stringify(e)); } }
    console.log(`  creadas ${ok} | ya existían ${ya}`); return;
  }
  if (FASE === 'borrar') {
    const aBorrar = {}; for (const t of [...ordenTablas].reverse()) { if (t === 'perfiles_usuario' || t.startsWith('flow_') || t.startsWith('guia_del_flow')) continue; const filasM = (previo[t] || []).filter(x => x.empresa_id === MYS).map(x => x.id); if (filasM.length) aBorrar[t] = filasM; }
    console.log(`BORRAR${ap} filas actuales de Mármoles que se reemplazan:`, JSON.stringify(Object.fromEntries(Object.entries(aBorrar).map(([t, a]) => [t, a.length])))); if (!APLICAR) return;
    for (const [t, ids] of Object.entries(aBorrar)) for (let i = 0; i < ids.length; i += 100) { const r = await fetch(`${D.url}/rest/v1/${t}?id=in.(${ids.slice(i, i + 100).join(',')})&empresa_id=eq.${MYS}`, { method: 'DELETE', headers: { ...H(D.key), Prefer: 'return=minimal' } }); if (!r.ok) throw new Error(`borrar ${t}: ` + (await r.text())); }
    console.log('  listo'); return;
  }
  if (FASE === 'datos') {
    console.log(`DATOS${ap}: ${filas} filas en ${ordenTablas.length} tablas`); if (!APLICAR) return;
    for (const t of ordenTablas) { const pk = meta[t].pk; if (!pk.length) { console.log('  OMITIDA (sin clave primaria):', t); continue; } const dif = diferidas[t] || []; const f = dif.length ? plan[t].map(x => { const n = { ...x }; dif.forEach(c => n[c] = null); return n; }) : plan[t]; await upsert(t, f, pk); console.log(`  ${t}: ${plan[t].length}`); }
    for (const [t, dif] of Object.entries(diferidas)) { if (!dif.length) continue; await upsert(t, plan[t], meta[t].pk); console.log(`  (2.ª pasada) ${t}: ${plan[t].length}`); }
    return;
  }
  if (FASE === 'archivos') {
    const buckets = ['guia-del-flow', 'pilares-del-flow', 'guias-flow', 'feed-adjuntos']; const enc = p => p.split('/').map(encodeURIComponent).join('/');
    const listar = async (b, prefix = '', acc = []) => { const r = await fetch(`${O.url}/storage/v1/object/list/${b}`, { method: 'POST', headers: { ...H(O.key), 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix, limit: 1000, offset: 0 }) }).then(r => r.json()); for (const x of r) { if (x.id === null) await listar(b, prefix + x.name + '/', acc); else acc.push(prefix + x.name); } return acc; };
    const existentes = (await (await get(D, '/storage/v1/bucket')).json()).map(b => b.name);
    for (const b of buckets) { const objs = await listar(b); console.log(`ARCHIVOS${ap} ${b}: ${objs.length}`); if (!APLICAR) continue;
      if (!existentes.includes(b)) { const r = await fetch(`${D.url}/storage/v1/bucket`, { method: 'POST', headers: { ...H(D.key), 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b, name: b, public: false }) }); if (!r.ok) throw new Error('crear bucket ' + b + ': ' + (await r.text())); console.log('  bucket creado:', b); }
      for (const ruta of objs) { const nueva = B.reescribir(ruta); const d = await fetch(`${O.url}/storage/v1/object/${b}/${enc(ruta)}`, { headers: H(O.key) }); if (!d.ok) throw new Error('descarga ' + ruta + ' ' + d.status); const buf = Buffer.from(await d.arrayBuffer()); const u = await fetch(`${D.url}/storage/v1/object/${b}/${enc(nueva)}`, { method: 'POST', headers: { ...H(D.key), 'Content-Type': d.headers.get('content-type') || 'application/octet-stream', 'x-upsert': 'true' }, body: buf }); if (!u.ok) throw new Error('subida ' + nueva + ' ' + (await u.text())); } if (APLICAR) console.log('  copiados', objs.length); }
    return;
  }
  if (FASE === 'verificar') {
    const post = await snapshotDestino(B.swD); const informe = []; let ok = true;
    for (const t of Object.keys(plan)) { const ids = new Set((post[t] || []).map(x => x.id)); const falta = plan[t].filter(r => r.id && !ids.has(r.id)).length; if (falta) { ok = false; informe.push(`FALTAN ${falta} filas de ${t}`); } }
    const convPrev = {}, convPost = {}; let perdidas = 0; const resumenPerdidas = {};
    for (const t of Object.keys(previo)) { const idsPost = new Set((post[t] || []).map(x => x.id)); for (const x of previo[t]) { if (!idsPost.has(x.id)) { if (x.empresa_id === CONV) { perdidas++; resumenPerdidas[t] = (resumenPerdidas[t] || 0) + 1; } } } convPrev[t] = previo[t].filter(x => x.empresa_id === CONV).length; convPost[t] = (post[t] || []).filter(x => x.empresa_id === CONV).length; }
    const difConv = Object.keys(convPrev).filter(t => convPrev[t] !== convPost[t]);
    const sinEmpresa = {}; for (const t of Object.keys(previo)) { if (previo[t][0] && 'empresa_id' in previo[t][0]) continue; const idsPost = new Set((post[t] || []).map(x => x.id)); const m = previo[t].filter(x => !idsPost.has(x.id)).length; if (m) sinEmpresa[t] = m; }
    console.log('FILAS del plan presentes en el destino:', ok ? 'TODAS' : informe.join('; '));
    console.log('CONVERGIA — filas perdidas:', perdidas, JSON.stringify(resumenPerdidas), '| tablas con conteo distinto:', JSON.stringify(difConv));
    console.log('Tablas SIN empresa_id que perdieron filas (cascada por reemplazar Mármoles; revisar que sean de Mármoles):', JSON.stringify(sinEmpresa));
    const uD = await authUsers(D); console.log('Cuentas de acceso en destino:', uD.length);
    const por = {}; for (const t of ['colaboradores', 'cargos', 'perfiles_usuario', 'competencias', 'ciclos_evaluacion', 'alertas']) por[t] = { MYS: (post[t] || []).filter(x => x.empresa_id === MYS).length, CONV: (post[t] || []).filter(x => x.empresa_id === CONV).length }; console.log('Conteos por empresa:', JSON.stringify(por));
    return;
  }
  throw new Error('fase desconocida: ' + FASE);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
