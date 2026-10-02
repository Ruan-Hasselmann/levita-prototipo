/* Levita · protótipo clicável com modo teste
   Fluxos: cadastro da igreja (admin), convite + primeiro acesso, disponibilidade,
   confirmar + imprevisto (voluntário), montar escala e pendências (líder). */
(() => {
  "use strict";
  const CFG = window.LEVITA_CONFIG || {};
  const device = document.getElementById("device");
  const params = new URLSearchParams(location.search);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- dados fictícios ---------- */
  const COLORS = { Ana: "#db2777", Lia: "#059669", João: "#0284c7", Marina: "#7c3aed", Pedro: "#ca8a04", Tiago: "#16a34a", Bruno: "#2563eb", Carla: "#e11d48", Rafael: "#9333ea", Gui: "#d97706", Davi: "#ea580c", Clara: "#be185d", Marcos: "#7c5cff" };
  const ini = (n, extra = "") => `<span class="ini" style="background:${COLORS[n] || "#5b5b78"}${extra}">${esc(n.slice(0, 2).toUpperCase())}</span>`;

  const DISP = [
    { w: 1, id: "d2m", d: "DOM", n: 2, nome: "Culto da manhã · 10h", on: true },
    { w: 1, id: "d2n", d: "DOM", n: 2, nome: "Culto da noite · 19h", on: false },
    { w: 2, id: "q5", d: "QUA", n: 5, nome: "Culto de oração · 20h", on: true },
    { w: 2, id: "d9m", d: "DOM", n: 9, nome: "Culto da manhã · 10h", on: true },
    { w: 2, id: "d9n", d: "DOM", n: 9, nome: "Culto da noite · 19h", on: false },
    { w: 3, id: "q12", d: "QUA", n: 12, nome: "Culto de oração · 20h", on: true },
    { w: 3, id: "d16m", d: "DOM", n: 16, nome: "Culto da manhã · 10h", on: true },
    { w: 3, id: "d16n", d: "DOM", n: 16, nome: "Culto da noite · 19h", on: false },
    { w: 4, id: "q19", d: "QUA", n: 19, nome: "Culto de oração · 20h", on: true },
    { w: 4, id: "d23m", d: "DOM", n: 23, nome: "Culto da manhã · 10h", on: true },
    { w: 5, id: "d30m", d: "DOM", n: 30, nome: "Culto da manhã · 10h", on: true },
  ];

  const ROWS = [
    { id: "d2m", l: "Dom 2", s: "Manhã" }, { id: "d2n", l: "Dom 2", s: "Noite" },
    { id: "q5", l: "Qua 5", s: "Oração" }, { id: "d9m", l: "Dom 9", s: "Manhã" }, { id: "d9n", l: "Dom 9", s: "Noite" },
  ];
  const COLS = ["Vocal", "Violão", "Teclado", "Bateria"];
  const NEED = { d2m: { Vocal: 2, Violão: 1, Teclado: 1, Bateria: 1 }, d2n: { Vocal: 2, Violão: 1, Teclado: 1, Bateria: 1 }, q5: { Vocal: 1, Teclado: 1 }, d9m: { Vocal: 2, Violão: 1, Teclado: 1, Bateria: 1 }, d9n: { Vocal: 2, Violão: 1, Teclado: 1, Bateria: 1 } };
  const SUG = {
    d2m: { Vocal: ["Ana", "Lia"], Violão: ["João"], Teclado: ["Marina"], Bateria: ["Pedro"] },
    d2n: { Vocal: ["Carla", "Rafael"], Violão: [], Teclado: ["Gui"], Bateria: ["Pedro"] },
    q5: { Vocal: ["Ana"], Teclado: ["Marina"] },
    d9m: { Vocal: ["Lia", "Carla"], Violão: ["Bruno"], Teclado: ["Gui"], Bateria: ["Tiago"] },
    d9n: { Vocal: ["Ana", "Rafael"], Violão: ["João"], Teclado: ["Marina"], Bateria: ["Davi"] },
  };
  const CANDS = {
    Violão: [{ n: "Bruno", d: "Disponível · serviu 1× no mês", ok: true, sug: true }, { n: "João", d: "Disponível · já está no culto da manhã", ok: true }, { n: "Clara", d: "Não pode nesse dia", ok: false }],
    Bateria: [{ n: "Tiago", d: "Disponível · serviu 1× no mês", ok: true, sug: true }, { n: "Davi", d: "Disponível · serviu 1× no mês", ok: true }, { n: "Pedro", d: "Já está no culto da manhã", ok: true }],
    Vocal: [{ n: "Lia", d: "Disponível · serviu 2× no mês", ok: true, sug: true }, { n: "Carla", d: "Disponível · serviu 2× no mês", ok: true }, { n: "Ana", d: "Disponível · serviu 3× no mês", ok: true }],
    Teclado: [{ n: "Gui", d: "Disponível · serviu 2× no mês", ok: true, sug: true }, { n: "Marina", d: "Disponível · serviu 3× no mês", ok: true }],
  };

  /* ---------- estado ---------- */
  let S;
  function fresh(role, screen) {
    return {
      role, screen, sheet: null, toast: null, full: false,
      igreja: { nome: "", cidade: "", papel: "Pastor(a)" },
      cultos: new Set(["Domingo 10h", "Domingo 19h"]), grupos: new Set(["Louvor", "Mídia"]),
      formacao: { "🎤 Vocal": 2, "🎸 Violão": 1, "🎹 Teclado": 1, "🥁 Bateria": 1, "🎸 Baixo": 0 },
      prazo: 25, publica: 28,
      dados: { nome: "Ana Beatriz Souza", cel: "(11) 98765-4321", nasc: "", lgpd: false },
      dias: new Set(["QUA", "DOM"]), padrao: new Set(["Qua · 20h", "Dom · 10h"]),
      disp: DISP.map((d) => ({ ...d })), dispEnviada: false,
      conf: false, imprev: null, motivo: null, saida: "troca", day: 6,
      grade: null, enviada: false, picked: null,
      pend: { troca: "aberta", naopode: "aberta" },
    };
  }
  const setScreen = (screen) => { S.screen = screen; S.sheet = null; S.full = false; };

  /* ---------- modo teste ---------- */
  const TASKS = {
    1: { curto: "Cadastre sua igreja", texto: "Você é o pastor de uma igreja e quer começar a usar o Levita. Cadastre a sua igreja.", start: () => (S = fresh("admin", "entrada")) },
    2: { curto: "Entre pelo convite", texto: "O líder do Louvor te mandou um convite pelo WhatsApp. Entre no Levita e diga em quais cultos você costuma poder servir.", start: () => (S = fresh("vol", "wa")) },
    3: { curto: "Disponibilidade de novembro", texto: "Diga em quais cultos de novembro você pode servir. Atenção: no domingo, dia 9, você vai viajar e não pode.", start: () => (S = fresh("vol", "home")) },
    4: { curto: "Confirme e resolva um imprevisto", texto: "Você está na escala deste domingo. Confirme que vai. Depois, imagine que surgiu um imprevisto e você não vai poder ir: resolva isso pelo app.", start: () => (S = fresh("vol", "home")) },
    5: { curto: "Monte e envie a escala", texto: "Você é o líder do Louvor. Monte a escala de novembro, sem deixar nenhuma vaga sem pessoa, e envie para a equipe.", start: () => (S = fresh("lider", "lhome")) },
    6: { curto: "Resolva as pendências", texto: "Você é o líder do Louvor. Resolva tudo o que está esperando por você no app.", start: () => (S = fresh("lider", "lhome")) },
  };
  const PERFIL_TASKS = { admin: [1], voluntario: [2, 3, 4], lider: [5, 6], todos: [1, 2, 3, 4, 5, 6] };
  const T = { on: false, p: null, perfil: null, list: [], idx: -1, cur: null, overlay: null, sendState: "" };

  function startTest(p, perfil) {
    T.on = true; T.p = p.slice(0, 40); T.perfil = PERFIL_TASKS[perfil] ? perfil : "todos";
    T.list = PERFIL_TASKS[T.perfil]; T.idx = -1; T.overlay = { kind: "welcome" };
    S = fresh("admin", "entrada");
  }
  function nextTask() {
    T.idx++;
    if (T.idx >= T.list.length) { T.overlay = { kind: "end" }; T.cur = null; flush(); return; }
    T.overlay = { kind: "task", n: T.list[T.idx] };
  }
  function beginTask(n) {
    TASKS[n].start();
    T.cur = { n, t0: performance.now(), toques: 0, fora: 0, caminho: [], done: false };
    T.overlay = null;
  }
  function finishTask(status, extra = {}) {
    if (!T.cur || T.cur.done) return;
    T.cur.done = true;
    T.cur.status = status;
    T.cur.dur = Math.round(performance.now() - T.cur.t0);
    T.cur.obs = extra.obs || T.cur.obs || "";
    T.overlay = { kind: "seq", status };
  }
  function goal(n, obs) {
    if (T.on && T.cur && T.cur.n === n && !T.cur.done) {
      if (obs) T.cur.obs = obs;
      setTimeout(() => { finishTask("concluiu"); render(); }, 900);
    }
  }
  function submitTask(facilidade, comentario) {
    const c = T.cur;
    const obs = [c.obs, comentario].filter(Boolean).join(" | ").slice(0, 1000);
    queue({
      participante: T.p, perfil: T.perfil, tarefa: c.n, status: c.status, duracao_ms: Math.min(c.dur, 3600000),
      toques: Math.min(c.toques, 5000), toques_fora: Math.min(c.fora, 5000), caminho: c.caminho.slice(0, 400),
      facilidade: facilidade || null, observacao: obs || null, dispositivo: navigator.userAgent.slice(0, 300),
    });
    nextTask();
  }

  /* fila de envio: guarda no aparelho e envia ao Supabase */
  const QKEY = "levita_fila_resultados";
  const readQ = () => { try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch { return []; } };
  const writeQ = (q) => { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch {} };
  function queue(row) { const q = readQ(); q.push(row); writeQ(q); flush(); }
  // um envio por vez: dois envios simultâneos liam a mesma fila e duplicavam linhas
  let flushing = false, flushAgain = false;
  async function flush() {
    if (flushing) { flushAgain = true; return; }
    flushing = true;
    try { await flushOnce(); } finally { flushing = false; }
    if (flushAgain) { flushAgain = false; flush(); }
  }
  async function flushOnce() {
    const q = readQ();
    if (!q.length) { T.sendState = "enviado"; render(); return; }
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) { T.sendState = "local"; render(); return; }
    T.sendState = "enviando";
    const rest = [];
    for (const row of q) {
      try {
        const r = await fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/rest/v1/sessoes_teste", {
          method: "POST",
          headers: { apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(row),
        });
        if (!r.ok) rest.push(row);
      } catch { rest.push(row); }
    }
    // mantém o que entrou na fila durante o envio
    const sent = new Set(q.filter((r) => !rest.includes(r)).map((r) => JSON.stringify(r)));
    writeQ(readQ().filter((r) => !sent.has(JSON.stringify(r))));
    T.sendState = rest.length ? "erro" : "enviado";
    render();
  }

  /* registro de toques durante a tarefa */
  device.addEventListener("click", (e) => {
    if (!T.cur || T.cur.done || T.overlay || e.target.closest(".taskbar")) return;
    T.cur.toques++;
    const el = e.target.closest("button, input, a, label, [data-a]");
    if (!el) T.cur.fora++;
    const label = el ? (el.dataset.a ? el.dataset.a + (el.dataset.v ? ":" + el.dataset.v : "") : (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 40)) : "fora";
    if (T.cur.caminho.length < 400) T.cur.caminho.push({ s: S.screen + (S.sheet ? "/" + S.sheet.k : "") + (S.full ? "/ingresso" : ""), a: label, t: Math.round((performance.now() - T.cur.t0) / 100) / 10 });
  }, true);

  /* ---------- telas ---------- */
  const steps = (n) => `<div class="steps">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`;
  const chip = (set, val, label = val) => `<button class="chip ${set.has(val) ? "on" : ""}" data-a="chip" data-set="${set === S.cultos ? "cultos" : set === S.grupos ? "grupos" : set === S.dias ? "dias" : "padrao"}" data-v="${esc(val)}">${esc(label)}</button>`;

  const V = {
    /* ===== admin: cadastro da igreja ===== */
    entrada: () => `
      <div class="screen full" style="background:var(--hero)">
        <div class="row" style="margin-top:6px"><span style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#7c5cff,#c084fc);display:block"></span><b style="font-family:var(--display);font-size:19px">Levita</b></div>
        <h1 class="h1" style="font-size:34px;margin-top:56px">Escalas que dão gosto de usar.</h1>
        <p class="why" style="font-size:15px">Voluntários dizem quando podem, líderes montam a escala em minutos e todos confirmam pelo celular.</p>
        <div class="bottom">
          <button class="btn" data-a="go" data-v="login">⛪ Criar minha igreja · grátis</button>
          <button class="btn sec-btn" data-a="toast" data-v="Abra o link do convite que você recebeu pelo WhatsApp.">Tenho um convite</button>
          <p class="small muted" style="text-align:center;margin:4px 0 0">Já uso o Levita · <button class="link" data-a="toast" data-v="Neste protótipo, use “Criar minha igreja”.">Entrar</button></p>
          ${T.on ? "" : `<p class="small muted" style="text-align:center;margin:10px 0 0">Explorar como: <button class="link" data-a="role" data-v="vol">Voluntário</button> · <button class="link" data-a="role" data-v="lider">Líder</button></p>`}
        </div>
      </div>`,
    login: () => `
      <div class="screen full">
        <button class="link" data-a="go" data-v="entrada" style="align-self:flex-start">← Voltar</button>
        <h1 class="h1" style="margin-top:24px">Como você quer entrar?</h1>
        <p class="why">Sem senha. Use a conta que você já tem no celular.</p>
        <div class="bottom">
          <button class="btn" data-a="go" data-v="w1">Continuar com Google</button>
          <button class="btn sec-btn" data-a="go" data-v="w1"> Continuar com Apple</button>
          <button class="btn ghost" data-a="go" data-v="w1">Receber link no e-mail</button>
        </div>
      </div>`,
    w1: () => `
      <div class="screen full">
        ${steps(1)}<div class="eyebrow">Passo 1 de 5</div>
        <h1 class="h2">Sua igreja</h1>
        <p class="why">É o nome que os voluntários vão ver no convite.</p>
        <div class="field"><label for="f-nome">Nome da igreja</label><input id="f-nome" data-f="igreja.nome" placeholder="Ex.: Igreja Videira" value="${esc(S.igreja.nome)}" autocomplete="off"></div>
        <div class="field"><label for="f-cidade">Cidade</label><input id="f-cidade" data-f="igreja.cidade" placeholder="Ex.: Campinas · SP" value="${esc(S.igreja.cidade)}" autocomplete="off"></div>
        <div class="field"><label>Você é</label><div class="chips">${["Pastor(a)", "Secretaria", "Líder"].map((p) => `<button class="chip ${S.igreja.papel === p ? "on" : ""}" data-a="papel" data-v="${p}">${p}</button>`).join("")}</div></div>
        <div class="bottom"><button class="btn" data-a="go" data-v="w2" ${S.igreja.nome.trim() ? "" : "disabled"} id="b-w1">Continuar</button></div>
      </div>`,
    w2: () => `
      <div class="screen full">
        ${steps(2)}<div class="eyebrow">Passo 2 de 5</div>
        <h1 class="h2">Quais cultos acontecem toda semana?</h1>
        <p class="why">Os voluntários vão dizer em quais desses cultos podem servir.</p>
        <div class="chips">${["Domingo 9h", "Domingo 10h", "Domingo 18h", "Domingo 19h", "Quarta 20h", "Sexta 20h", "Sábado 19h"].map((c) => chip(S.cultos, c)).join("")}</div>
        <p class="small muted" style="margin-top:12px">Cultos especiais (Natal, batismo) você cadastra depois.</p>
        <div class="bottom"><button class="btn" data-a="go" data-v="w3">Continuar · ${S.cultos.size} cultos</button><button class="btn ghost" data-a="go" data-v="w3">Pular, faço depois</button></div>
      </div>`,
    w3: () => `
      <div class="screen full">
        ${steps(3)}<div class="eyebrow">Passo 3 de 5</div>
        <h1 class="h2">Quais grupos servem na sua igreja?</h1>
        <p class="why">Cada grupo terá a própria escala e um líder para organizá-la.</p>
        <div class="chips">${[["Louvor", "🎶 Louvor"], ["Mídia", "🎥 Mídia"], ["Recepção", "🤝 Recepção"], ["Infantil", "🧸 Infantil"], ["Cantina", "☕ Cantina"], ["Intercessão", "🙏 Intercessão"], ["Som", "🔊 Som"]].map(([v, l]) => chip(S.grupos, v, l)).join("")}</div>
        <div class="bottom"><button class="btn" data-a="go" data-v="w4" ${S.grupos.size ? "" : "disabled"}>Continuar · ${S.grupos.size} grupos</button><button class="btn ghost" data-a="go" data-v="w4">Pular, faço depois</button></div>
      </div>`,
    w4: () => `
      <div class="screen full">
        ${steps(4)}<div class="eyebrow">Passo 4 de 5 · Louvor</div>
        <h1 class="h2">Quantas pessoas servem em cada culto? <button class="pill-tag t-acc" data-a="toast" data-v="Exemplo: no Louvor, 2 vocais e 1 baterista por culto. O líder pode mudar depois." aria-label="Ajuda">?</button></h1>
        <p class="why">Assim o Levita sabe quantas vagas preencher. Os outros grupos usam o sugerido.</p>
        ${Object.entries(S.formacao).map(([f, n]) => `<div class="counter"><span>${f}</span><span class="ctl"><button data-a="cnt" data-v="${esc(f)}" data-d="-1" aria-label="Menos">−</button><b>${n}</b><button data-a="cnt" data-v="${esc(f)}" data-d="1" aria-label="Mais">+</button></span></div>`).join("")}
        <div class="bottom"><button class="btn" data-a="go" data-v="w5">Continuar</button><button class="btn ghost" data-a="go" data-v="w5">Usar o sugerido</button></div>
      </div>`,
    w5: () => `
      <div class="screen full">
        ${steps(5)}<div class="eyebrow">Passo 5 de 5</div>
        <h1 class="h2">Como a escala do mês é feita</h1>
        <p class="why">Todo mês acontece assim. Você só escolhe os dias.</p>
        <div class="tl">
          <div class="s"><b>📝 Voluntários dizem quando podem</b><div class="small muted" style="margin-top:4px">até o dia <span class="daysel"><button data-a="dia" data-v="prazo" data-d="-1" aria-label="Menos">−</button><b>${S.prazo}</b><button data-a="dia" data-v="prazo" data-d="1" aria-label="Mais">+</button></span> do mês anterior</div></div>
          <div class="s"><b>🛠 Líderes montam a escala</b><div class="small muted" style="margin-top:4px">até o dia <span class="daysel"><button data-a="dia" data-v="publica" data-d="-1" aria-label="Menos">−</button><b>${S.publica}</b><button data-a="dia" data-v="publica" data-d="1" aria-label="Mais">+</button></span>, com sugestão automática</div></div>
          <div class="s"><b>✅ Todos confirmam pelo celular</b><div class="small muted" style="margin-top:4px">e recebem lembrete na véspera</div></div>
        </div>
        <div class="card tint small">Exemplo: a escala de <b>novembro</b> recebe respostas até <b>${S.prazo} de outubro</b>.</div>
        <div class="bottom"><button class="btn" data-a="concluir">Concluir</button><button class="btn ghost" data-a="concluir">Usar o sugerido</button></div>
      </div>`,
    checklist: () => `
      <div class="screen full">
        <div class="eyebrow">${esc(S.igreja.nome || "Sua igreja")}</div>
        <div class="row" style="margin-top:10px"><div class="ring" style="background:conic-gradient(var(--accent) 0 50%, var(--surface-2) 50% 100%)"><span>3/6</span></div><h1 class="h2">Falta pouco para a primeira escala</h1></div>
        <div style="margin-top:14px">
          <div class="list-item"><span class="ck ok">✓</span><div>Cultos da semana<div class="small muted">${S.cultos.size} cultos</div></div></div>
          <div class="list-item"><span class="ck ok">✓</span><div>Grupos que servem<div class="small muted">${S.grupos.size} grupos</div></div></div>
          <div class="list-item"><span class="ck ok">✓</span><div>Como a escala é feita<div class="small muted">respostas até o dia ${S.prazo}</div></div></div>
          <div class="list-item"><span class="ck"></span><div>Convidar os líderes<div class="small muted">um para cada grupo</div></div><button class="pill-tag t-acc" style="margin-left:auto" data-a="toast" data-v="Aqui você enviaria o convite pelo WhatsApp.">Convidar</button></div>
          <div class="list-item"><span class="ck"></span><div>Líderes chamarem a equipe<div class="small muted">começa quando eles entrarem</div></div></div>
          <div class="list-item"><span class="ck"></span><div>Primeira escala enviada<div class="small muted">depois do dia ${S.prazo}</div></div></div>
        </div>
        <p class="small muted" style="text-align:center;margin-top:auto">Quando tudo estiver ✓, aqui vira o resumo da igreja.</p>
      </div>`,

    /* ===== voluntário: convite e primeiro acesso ===== */
    wa: () => `
      <div class="wa-screen">
        <div class="wa-top">${ini("Marcos")}<div><b style="font-size:14px">Marcos (Líder Louvor)</b><div style="font-size:11px;color:#8696a0">online</div></div></div>
        <div class="wa-msg">
          <button class="wa-card" data-a="go" data-v="convite">
            <div style="height:84px;background:radial-gradient(120% 120% at 0% 0%,#5b3fd9,#1b1638 60%,#0b0b12);display:flex;align-items:flex-end;padding:10px"><b style="font-size:15px">Você foi convidada ✨</b></div>
            <div style="padding:8px 10px;font-size:12px;color:#b8b8d0">Servir no Louvor · Igreja Videira<br><span style="color:#7cc4ff">levita.app/c/x7k2</span></div>
          </button>
          Oi Ana! Te adicionei na equipe de Louvor 🎶 Toca no link pra entrar e marcar quando pode servir 🙏
          <div style="text-align:right;font-size:10px;color:#9fd6c9;margin-top:3px">14:02 ✓✓</div>
        </div>
      </div>`,
    convite: () => `
      <div class="screen full" style="background:var(--hero)">
        <div style="width:62px;height:62px;border-radius:18px;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-weight:800;margin:30px auto 0">IV</div>
        <div style="text-align:center;margin-top:16px"><div class="muted small">Igreja Videira</div><h1 class="h1" style="margin-top:6px">Bem-vinda à equipe de Louvor, Ana</h1></div>
        <p class="small muted" style="text-align:center;margin-top:10px">Convite de Marcos · válido por 7 dias</p>
        <div class="bottom">
          <button class="btn" data-a="go" data-v="dados">Continuar com Google</button>
          <button class="btn sec-btn" data-a="go" data-v="dados"> Continuar com Apple</button>
          <button class="btn ghost" data-a="go" data-v="dados">Receber link no e-mail</button>
        </div>
      </div>`,
    dados: () => `
      <div class="screen full">
        <div class="eyebrow">Passo 1 de 3</div>
        <h1 class="h2">Seus dados</h1>
        <p class="why">Para o líder te reconhecer e falar com você se precisar.</p>
        <div class="row" style="margin-bottom:14px">${ini("Ana", ";width:54px;height:54px;font-size:16px")}<div class="small muted">Foto do Google<br><button class="link" data-a="toast" data-v="Aqui você escolheria outra foto.">Trocar foto</button></div></div>
        <div class="field"><label for="f-dn">Nome completo</label><input id="f-dn" data-f="dados.nome" value="${esc(S.dados.nome)}"></div>
        <div class="field"><label for="f-dc">Celular (WhatsApp)</label><input id="f-dc" data-f="dados.cel" value="${esc(S.dados.cel)}" inputmode="tel"></div>
        <div class="field"><label for="f-dd">Data de nascimento</label><input id="f-dd" data-f="dados.nasc" placeholder="Ex.: 12/03/1998" value="${esc(S.dados.nasc)}" inputmode="numeric"></div>
        <label class="row small" style="margin-top:4px;cursor:pointer"><button class="ck ${S.dados.lgpd ? "ok" : ""}" data-a="lgpd" aria-label="Aceitar termos">${S.dados.lgpd ? "✓" : ""}</button><span>Li e aceito os <span class="link">termos de uso</span> e a <span class="link">política de privacidade</span></span></label>
        <div class="bottom"><button class="btn" id="b-dados" data-a="go" data-v="quando" ${S.dados.lgpd && S.dados.nasc.trim() ? "" : "disabled"}>Continuar</button></div>
      </div>`,
    quando: () => `
      <div class="screen full">
        <div class="eyebrow">Passo 2 de 3</div>
        <div class="card tint" style="margin-top:8px"><div class="eyebrow">Definido pelo líder</div><div style="font-weight:650;margin:4px 0 8px">Marcos te colocou no Louvor como</div><div class="chips"><span class="chip on">🎤 Vocal</span><span class="chip on">🎹 Teclado</span></div></div>
        <h1 class="h2" style="margin-top:18px">Em quais cultos você costuma poder?</h1>
        <p class="why">É o seu padrão. Todo mês ele já vem marcado e você só ajusta.</p>
        <div class="chips">${["Qua · 20h", "Dom · 10h", "Dom · 19h"].map((c) => chip(S.padrao, c)).join("")}</div>
        <div class="bottom"><button class="btn" data-a="go" data-v="instalar" ${S.padrao.size ? "" : "disabled"}>Continuar</button></div>
      </div>`,
    instalar: () => `
      <div class="screen full">
        <div class="eyebrow">Passo 3 de 3</div>
        <div style="margin:26px auto 0;width:90px;height:90px;border-radius:26px;background:linear-gradient(135deg,#7c5cff,#c084fc);box-shadow:0 0 40px rgba(124,92,255,.5);display:flex;align-items:center;justify-content:center;font-size:38px">🔔</div>
        <h1 class="h2" style="text-align:center;margin-top:18px">Não perca nenhuma escala</h1>
        <p class="why" style="text-align:center">Adicione o Levita à tela inicial para receber lembretes na véspera e no dia.</p>
        <div class="card small" style="line-height:2">1. Toque em <b>Compartilhar</b> ⬆️<br>2. Toque em <b>Adicionar à Tela de Início</b> ➕<br>3. Abra pelo ícone e ative os avisos</div>
        <div class="bottom"><button class="btn" data-a="instalado">Já adicionei, ativar avisos</button><button class="btn ghost" data-a="instalado">Agora não</button></div>
      </div>`,

    /* ===== voluntário: uso diário ===== */
    home: () => {
      const st = S.imprev ? ["t-warn", S.imprev === "troca" ? "Troca pedida" : "Líder avisado"] : S.conf ? ["t-ok", "Confirmado ✓"] : ["t-warn", "Aguardando você"];
      return `
      <div class="screen">
        <div class="row between"><div><div class="muted small">Outubro 2026</div><h1 class="h2">Esta semana</h1></div>${ini("Ana", ";width:36px;height:36px")}</div>
        <div class="week">${[["SEG", 30], ["TER", 1], ["QUA", 2], ["QUI", 3], ["SEX", 4], ["SÁB", 5], ["DOM", 6]].map(([d, n]) => `<button class="${n === 6 ? "on" : ""}" data-a="toast" data-v="${n === 6 ? "Este é o dia selecionado." : "Nenhuma escala neste dia."}">${d}<b>${n}</b>${n === 6 ? "<i></i>" : ""}</button>`).join("")}</div>
        <button class="ticket" data-a="abrir">
          <div class="row between"><span class="lbl">LOUVOR · VOCAL</span><span class="pill-tag ${st[0]}" style="background:#fff;color:#5b3fd9">${st[1]}</span></div>
          <div class="ttl">Culto da noite</div>
          <div class="cut"></div>
          <div class="kv"><div>CHEGADA<b>18h15</b></div><div>INÍCIO<b>19h</b></div><div>LOCAL<b>Templo</b></div></div>
        </button>
        <div class="sec">Servindo com você · 5 de 6 confirmados</div>
        ${[["João", "Violão", 1], ["Marina", "Teclado", 1], ["Pedro", "Bateria", 0], ["Lia", "Vocal", 1]].map(([n, f, ok]) => `<div class="list-item">${ini(n)}<span>${n} · ${f}</span><span class="pill-tag ${ok ? "t-ok" : "t-warn"}" style="margin-left:auto">${ok ? "confirmado" : "pendente"}</span></div>`).join("")}
      </div>`;
    },
    disp: () => {
      const weeks = [...new Set(S.disp.map((d) => d.w))];
      const n = S.disp.filter((d) => d.on).length;
      return `
      <div class="screen">
        <div class="eyebrow">Quando você pode servir</div>
        <h1 class="h2">Novembro</h1>
        <div class="card tint row between" style="margin-top:12px"><div><div class="eyebrow" style="color:var(--accent-3)">Responda até</div><b style="font-size:16px">25 de outubro</b></div><div style="text-align:right"><b style="font-size:22px">5</b><div class="small muted">dias</div></div></div>
        ${S.dispEnviada ? `<div class="card" style="margin-top:10px"><b>✓ Enviado!</b> <span class="muted small">Você pode mudar até 25/out.</span></div>` : ""}
        <button class="btn sec-btn" style="margin-top:12px;padding:11px" data-a="todos">✓ Posso em todos</button>
        ${weeks.map((w) => `<div class="sec">Semana ${w}</div>` + S.disp.filter((d) => d.w === w).map((d) => `
          <div class="list-item" style="padding:9px 0">
            <div style="width:36px;text-align:center;font-size:10px;color:var(--muted);line-height:1.1">${d.d}<b style="display:block;font-size:16px;color:var(--text)">${d.n}</b></div>
            <span style="flex:1">${d.nome}</span>
            <button class="sw ${d.on ? "on" : ""}" data-a="tgl" data-v="${d.id}" aria-label="${d.on ? "Posso" : "Não posso"}: ${d.d} ${d.n}, ${d.nome}"></button>
          </div>`).join("")).join("")}
        <div style="margin-top:16px"><button class="btn" data-a="enviardisp">Enviar · ${n} cultos marcados</button></div>
      </div>`;
    },
    avisos: () => `
      <div class="screen">
        <h1 class="h2">Avisos</h1>
        <div class="sec">Hoje</div>
        <div class="card tint"><b>📅 Escala de outubro publicada</b><div class="small muted">Você está em 3 cultos. Confirme cada um.</div></div>
        <div class="card"><b>⏳ Disponibilidade fecha em 5 dias</b><div class="small muted">Diga até 25/out em quais cultos de novembro você pode.</div></div>
        <div class="sec">Esta semana</div>
        <div class="card"><b>🎂 Aniversário do João</b><div class="small muted">Ele serve com você no Louvor.</div></div>
      </div>`,
    perfil: () => `
      <div class="screen">
        <div style="text-align:center">${ini("Ana", ";width:64px;height:64px;font-size:18px")}<h1 class="h2" style="margin-top:8px">Ana Souza</h1><div class="small muted">Igreja Videira</div></div>
        <div class="sec">Onde eu sirvo</div>
        <div class="card"><div class="row between"><span>🎶 Louvor</span><span class="small muted">Vocal · Teclado</span></div></div>
        <div class="sec">Aparência</div>
        <div class="chips"><span class="chip on">Sistema</span><span class="chip">Escuro</span><span class="chip">Claro</span></div>
        <div class="sec">Ministério</div>
        <button class="btn sec-btn" data-a="toast" data-v="Abriria o WhatsApp do Marcos com uma mensagem pronta.">Quero conversar sobre minha participação</button>
      </div>`,

    /* ===== líder ===== */
    lhome: () => {
      const n = (S.pend.troca === "aberta") + (S.pend.naopode === "aberta");
      return `
      <div class="screen">
        <div class="row between"><div><div class="eyebrow">Líder · Louvor</div><h1 class="h2">Novembro</h1></div>${ini("Marcos", ";width:36px;height:36px")}</div>
        <div class="card" style="margin-top:14px"><div class="row between"><span class="eyebrow">Etapa 1 · Disponibilidade</span><span class="pill-tag t-ok">concluída</span></div><b style="display:block;margin-top:6px">17 de 18 responderam</b></div>
        <div class="card tint"><div class="row between"><span class="eyebrow" style="color:var(--accent-3)">Etapa 2 · Montar a escala</span><span class="small muted">até 28/out</span></div>
          <b style="display:block;margin:6px 0 10px">${S.enviada ? "Escala enviada para a equipe ✓" : S.grade ? "Escala em preparo" : "Pronta para começar"}</b>
          <button class="btn" style="padding:12px" data-a="go" data-v="grade">${S.enviada ? "Ver escala" : S.grade ? "Continuar montando" : "Montar agora"}</button></div>
        <button class="card row between" style="width:100%;text-align:left;margin-top:10px;${n ? "border-color:rgba(251,113,133,.45)" : ""}" data-a="go" data-v="pend"><span>⚡ Precisa de você</span>${n ? `<span class="badge" style="font-size:12px;padding:2px 8px">${n}</span>` : `<span class="pill-tag t-ok">tudo certo</span>`}</button>
        <div class="sec">Próximo culto · Dom 6 noite</div>
        <div class="card"><div class="row between"><span><b>5/6</b> confirmados</span><span class="pill-tag t-warn">1 pendente</span></div></div>
      </div>`;
    },
    grade: () => {
      const g = S.grade;
      let body;
      if (!g) {
        body = `<div class="card tint" style="margin-top:14px;text-align:center;padding:22px"><div style="font-size:34px">✨</div><b style="display:block;margin-top:6px">O Levita monta a sugestão para você</b><p class="small muted" style="margin:6px 0 14px">Ele usa a disponibilidade de cada um, equilibra quem serviu mais ou menos e evita conflitos.</p><button class="btn" data-a="gerar">Gerar sugestão</button></div>`;
      } else {
        const al = alerts();
        body = `
        <div class="grid" style="margin-top:14px">
          <div></div>${COLS.map((c) => `<div class="h">${c.toUpperCase()}</div>`).join("")}
          ${ROWS.map((r) => `<div class="l"><b>${r.l}</b>${r.s}</div>` + COLS.map((c) => {
            const need = NEED[r.id][c];
            if (!need) return `<div class="cell" style="opacity:.35">—</div>`;
            const ppl = g[r.id][c];
            const empty = ppl.length < need;
            const warn = r.id === "d2n" && c === "Bateria" && ppl.includes("Pedro");
            return `<button class="cell ${empty ? "emp" : ""} ${warn ? "warn" : ""} ${S.picked === r.id + c ? "fresh" : ""}" data-a="cell" data-v="${r.id}|${c}" aria-label="${r.l} ${r.s}, ${c}">${empty && !ppl.length ? "+" : ppl.map((p) => ini(p)).join("") + (empty ? "<span style='margin-left:3px'>+</span>" : "")}</button>`;
          }).join("")).join("")}
        </div>
        ${al.length ? `<div class="card" style="margin-top:12px;border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.07)">${al.map((a) => `<div class="small">⚠ ${a}</div>`).join("")}<div class="small muted" style="margin-top:4px">Toque na célula para ajustar.</div></div>` : `<div class="card" style="margin-top:12px"><span class="small">✓ Nenhum alerta. Tudo pronto para enviar.</span></div>`}
        ${S.enviada ? `<div class="card tint" style="margin-top:12px"><b>✓ Enviada para a equipe</b><div class="small muted">Cada pessoa recebeu um aviso para confirmar.</div><button class="btn wa" style="margin-top:10px;padding:11px" data-a="toast" data-v="Abriria o WhatsApp com a escala formatada para o grupo.">Compartilhar no grupo do WhatsApp</button></div>` : `<div style="margin-top:14px"><button class="btn" data-a="enviar">Enviar para a equipe</button></div>`}`;
      }
      return `<div class="screen">
        <div class="row between"><div><div class="eyebrow">Louvor</div><h1 class="h2">Escala de novembro</h1></div><span class="pill-tag ${S.enviada ? "t-ok" : "t-warn"}">${S.enviada ? "Enviada" : "Em preparo"}</span></div>
        ${body}</div>`;
    },
    equipe: () => `
      <div class="screen">
        <div class="row between"><div><div class="eyebrow">Louvor</div><h1 class="h2">Equipe · 18</h1></div><button class="pill-tag t-acc" style="padding:7px 11px" data-a="toast" data-v="Aqui você enviaria convites pelo WhatsApp.">+ Convidar</button></div>
        ${[["Ana", "Vocal · Teclado", "3× em out"], ["João", "Violão", "2× em out"], ["Marina", "Teclado", "3× em out"], ["Pedro", "Bateria", "4× em out"], ["Lia", "Vocal", "2× em out"], ["Tiago", "Bateria", "1× em out"]].map(([n, f, x]) => `<button class="list-item" style="width:100%;text-align:left" data-a="toast" data-v="Abriria a ficha de ${n}: funções, preferências e ausências.">${ini(n)}<div>${n}<div class="small muted">${f}</div></div><span class="small muted" style="margin-left:auto">${x}</span></button>`).join("")}
      </div>`,
    pend: () => {
      const t = S.pend.troca, np = S.pend.naopode;
      return `
      <div class="screen">
        <div class="eyebrow">Líder · Louvor</div>
        <h1 class="h2">Precisa de você</h1>
        <div class="card" style="margin-top:14px">
          <div class="row between"><span class="pill-tag t-acc">🔁 TROCA</span><span class="small muted">há 10 min</span></div>
          <div class="row" style="margin-top:10px">${ini("Ana")}<span class="muted">→</span>${ini("Lia")}<span class="small">Ana quer trocar com Lia</span></div>
          <div class="small muted" style="margin-top:6px">Dom 6 noite · Vocal · motivo: saúde · Lia já aceitou</div>
          ${t === "aberta" ? `<div class="row" style="margin-top:12px"><button class="btn sec-btn" style="padding:11px" data-a="troca" data-v="recusada">Recusar</button><button class="btn" style="padding:11px" data-a="troca" data-v="aprovada">Aprovar</button></div>` : `<div class="pill-tag ${t === "aprovada" ? "t-ok" : "t-bad"}" style="display:inline-block;margin-top:10px">${t === "aprovada" ? "Troca aprovada ✓" : "Troca recusada"}</div>`}
        </div>
        <div class="card">
          <div class="row between"><span class="pill-tag t-bad">✕ NÃO PODE</span><span class="small muted">há 1 h</span></div>
          <div style="margin-top:10px"><b>Pedro</b> · Dom 6 noite · Bateria</div>
          ${np === "aberta" ? `<div class="sec" style="margin-top:12px">Substitutos sugeridos</div>
            ${[["Tiago", "Disponível · serviu 1× no mês", 1], ["Davi", "Disponível · serviu 1× no mês", 0]].map(([n, d, s]) => `<div class="list-item">${ini(n)}<div>${n}${s ? ' <span class="pill-tag t-acc">sugerido</span>' : ""}<div class="small muted">${d}</div></div><button class="pill-tag t-acc" style="margin-left:auto;padding:6px 11px" data-a="substituto" data-v="${n}">Convidar</button></div>`).join("")}`
            : `<div class="pill-tag t-ok" style="display:inline-block;margin-top:10px">${esc(np)} convidado · esperando confirmação</div>`}
        </div>
        ${t !== "aberta" && np !== "aberta" ? `<div class="card" style="margin-top:12px;text-align:center"><b>🎉 Tudo resolvido</b></div>` : ""}
      </div>`;
    },
  };

  function alerts() {
    const g = S.grade, out = [];
    let vagas = 0;
    ROWS.forEach((r) => COLS.forEach((c) => { const need = NEED[r.id][c]; if (need && g[r.id][c].length < need) vagas += need - g[r.id][c].length; }));
    if (vagas) out.push(`${vagas} vaga${vagas > 1 ? "s" : ""} sem pessoa (Violão, Dom 2 noite)`);
    if (g.d2n.Bateria.includes("Pedro")) out.push("Pedro está 2× no domingo 2 (manhã e noite)");
    return out;
  }

  /* gavetas */
  const SHEETS = {
    naoposso: () => `
      <div class="grab"></div>
      <h2 class="h2">Não vai dar? Sem problema 🙏</h2>
      <p class="small muted" style="margin:4px 0 12px">Dom 6 · Culto da noite · Vocal</p>
      <div class="eyebrow" style="margin-bottom:8px">Motivo</div>
      <div class="chips">${["Trabalho", "Saúde", "Viagem", "Família", "Outro"].map((m) => `<button class="chip ${S.motivo === m ? "on" : ""}" data-a="motivo" data-v="${m}">${m}</button>`).join("")}</div>
      <button class="choice ${S.saida === "troca" ? "on" : ""}" data-a="saida" data-v="troca"><b>🔁 Pedir troca a um colega</b><small>Vocais disponíveis nesse culto recebem o pedido. O líder aprova.</small></button>
      <button class="choice ${S.saida === "avisar" ? "on" : ""}" data-a="saida" data-v="avisar"><b>📣 Só avisar o líder</b><small>O líder escolhe quem vai no seu lugar.</small></button>
      <div style="margin-top:16px"><button class="btn" data-a="enviarimprev" ${S.motivo ? "" : "disabled"}>${S.saida === "troca" ? "Enviar pedido de troca" : "Avisar o líder"}</button></div>`,
    cell: () => {
      const [rid, c] = S.sheet.v.split("|");
      const r = ROWS.find((x) => x.id === rid);
      const cur = S.grade[rid][c];
      return `
      <div class="grab"></div>
      <h2 class="h2">${c} · ${r.l} ${r.s.toLowerCase()}</h2>
      <p class="small muted" style="margin:4px 0 10px">${NEED[rid][c]} pessoa${NEED[rid][c] > 1 ? "s" : ""} nesta função · ${cur.length ? "agora: " + cur.join(", ") : "vaga sem pessoa"}</p>
      <div class="eyebrow">Melhores opções</div>
      ${(CANDS[c] || []).filter((p) => !cur.includes(p.n) || p.n === "Pedro").map((p) => `
        <button class="list-item" style="width:100%;text-align:left;${p.ok ? "" : "opacity:.45"}" data-a="pick" data-v="${p.n}" ${p.ok ? "" : "disabled"}>${ini(p.n)}<div>${p.n}${p.sug ? ' <span class="pill-tag t-acc">sugerido</span>' : ""}<div class="small muted">${p.d}</div></div><span class="pill-tag t-acc" style="margin-left:auto;padding:6px 11px">${p.ok ? "Escolher" : "—"}</span></button>`).join("")}`;
    },
    enviar: () => {
      const al = alerts();
      const vagas = al.some((a) => a.includes("vaga"));
      return `
      <div class="grab"></div>
      ${vagas ? `<h2 class="h2">Ainda há vaga sem pessoa</h2><p class="small muted" style="margin:6px 0 14px">Se enviar assim, a vaga aparece para a equipe como “Quero servir”.</p>
        <button class="btn" data-a="sheetclose">Escolher alguém</button><div style="height:8px"></div><button class="btn sec-btn" data-a="confirmaenvio">Enviar assim mesmo</button>`
      : `<h2 class="h2">Enviar a escala de novembro?</h2><p class="small muted" style="margin:6px 0 14px">18 pessoas vão receber um aviso para confirmar. Você ainda pode ajustar depois.${al.length ? "<br>⚠ " + al.join("<br>⚠ ") : ""}</p>
        <button class="btn" data-a="confirmaenvio">Enviar para a equipe</button><div style="height:8px"></div><button class="btn ghost" data-a="sheetclose">Voltar</button>`}`;
    },
  };

  /* ingresso aberto */
  function fullTicket() {
    return `
    <div class="full-ticket">
      <div class="row between"><button class="round" data-a="fechar" aria-label="Fechar">✕</button><span class="small" style="color:#d8ceff">1 de 3 próximas</span></div>
      <div class="lbl" style="font-size:11px;color:#d8ceff;font-weight:600;letter-spacing:.08em;margin-top:24px">LOUVOR · VOCAL</div>
      <div style="font-family:var(--display);font-size:36px;font-weight:700;line-height:1.02;letter-spacing:-.03em;margin-top:6px">Culto da<br>noite</div>
      <div class="cut" style="margin:18px -20px"></div>
      <div class="kv"><div>DATA<b>Dom, 6 out</b></div><div>CHEGADA<b>18h15</b></div><div>INÍCIO<b>19h</b></div></div>
      <div style="font-size:10.5px;color:#d8ceff;letter-spacing:.08em;margin:16px 0 6px">EQUIPE</div>
      <div class="row" style="gap:0">${["João", "Marina", "Pedro", "Lia"].map((n, i) => ini(n, i ? ";margin-left:-8px;border:2px solid #2a1f66" : ";border:2px solid #2a1f66")).join("")}<span class="small" style="margin-left:8px;color:#d8ceff">+2</span></div>
      <div class="info"><span>📝</span><span>“Chegar 15 min antes para a passagem de som” — Marcos</span></div>
      <div class="info"><span>🎵</span><span>Ensaio sábado, 5/out, 16h · Sala de música</span></div>
      <button class="small" style="color:#d8ceff;margin-top:10px;text-align:left" data-a="toast" data-v="Adicionaria o culto à agenda do seu celular.">📅 Adicionar à minha agenda</button>
      <div style="margin-top:auto;padding-top:16px">
        ${S.imprev ? `<div class="swipe done">${S.imprev === "troca" ? "🔁 Troca pedida · esperando um colega" : "📣 Líder avisado"}</div>`
        : S.conf ? `<div class="swipe done">✓ Presença confirmada</div>`
        : `<div class="swipe" id="swipe"><div class="knob" id="knob" aria-label="Deslize para confirmar">→</div>Deslize para confirmar</div>`}
        ${S.imprev ? "" : `<div class="row" style="margin-top:10px"><button class="btn sec-btn" style="padding:12px;background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.15)" data-a="naoposso" data-v="troca">Pedir troca</button><button class="btn sec-btn" style="padding:12px;background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.15)" data-a="naoposso" data-v="avisar">${S.conf ? "Não posso mais" : "Não posso"}</button></div>`}
      </div>
    </div>`;
  }

  /* navegação */
  const NAVS = {
    vol: [["home", "🏠", "Início"], ["disp", "🗓", "Quando posso"], ["avisos", "🔔", "Avisos"], ["perfil", "👤", "Perfil"]],
    lider: [["lhome", "🏠", "Início"], ["grade", "📋", "Escala"], ["equipe", "👥", "Equipe"], ["pend", "⚡", "Pendências"]],
  };
  const NO_NAV = new Set(["entrada", "login", "w1", "w2", "w3", "w4", "w5", "checklist", "wa", "convite", "dados", "quando", "instalar"]);
  function nav() {
    if (NO_NAV.has(S.screen) || S.full) return "";
    const items = NAVS[S.role === "lider" ? "lider" : "vol"];
    const pend = (S.pend.troca === "aberta") + (S.pend.naopode === "aberta");
    return `<nav class="nav" aria-label="Navegação">${items.map(([id, ic, l]) => `<button class="${S.screen === id ? "on" : ""}" data-a="go" data-v="${id}"><span class="ic">${ic}</span><span>${l}${id === "pend" && pend ? `<span class="badge">${pend}</span>` : ""}</span></button>`).join("")}</nav>`;
  }

  /* ---------- overlays do modo teste ---------- */
  function overlay() {
    const o = T.overlay;
    const total = T.list.length;
    if (o.kind === "welcome") return `<div class="overlay">
      <div class="row"><span style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#7c5cff,#c084fc);display:block"></span><b style="font-family:var(--display);font-size:19px">Levita</b></div>
      <h1 class="h1" style="margin-top:34px">Obrigado por ajudar! 🙏</h1>
      <p class="why" style="font-size:15px">Você vai testar um aplicativo novo para escalas de igreja. São ${total} tarefa${total > 1 ? "s" : ""} curtas.</p>
      <div class="card small" style="line-height:1.7">• Não existe resposta errada: <b>quem está sendo testado é o app, não você</b>.<br>• Faça do jeito que achar natural, sem pressa.<br>• Se travar, tudo bem: toque em <b>“Não consegui”</b> no topo.<br>• Nada aqui é real. Os dados são de exemplo.</div>
      <div class="bottom"><button class="btn" data-a="t-next">Começar</button></div></div>`;
    if (o.kind === "task") return `<div class="overlay">
      <div class="eyebrow">Tarefa ${T.idx + 1} de ${total}</div>
      <div class="taskcard"><div class="eyebrow">Sua missão</div><p>${TASKS[o.n].texto}</p></div>
      <p class="small muted">Leia com calma. Quando tocar em “Começar”, o app abre e a tarefa fica resumida na faixa roxa do topo.</p>
      <div class="bottom"><button class="btn" data-a="t-begin" data-v="${o.n}">Começar</button></div></div>`;
    if (o.kind === "giveup") return `<div class="overlay">
      <h1 class="h2" style="margin-top:20px">Tudo bem! Isso ajuda muito 🙌</h1>
      <p class="why">Se puder, conte o que dificultou. É opcional.</p>
      <div class="field"><label for="f-gu">O que te confundiu?</label><input id="f-gu" data-f="ov.gu" value="${esc(o.gu || "")}" placeholder="Ex.: não achei onde confirmar" maxlength="300"></div>
      <div class="bottom"><button class="btn" data-a="t-giveup">Pular esta tarefa</button><button class="btn ghost" data-a="t-back">Voltar e continuar tentando</button></div></div>`;
    if (o.kind === "seq") return `<div class="overlay">
      <div class="eyebrow">Tarefa ${T.idx + 1} de ${total}</div>
      <h1 class="h2" style="margin-top:14px">${o.status === "concluiu" ? "Pronto, tarefa concluída! 🎉" : "Tarefa encerrada"}</h1>
      <p class="why" style="font-size:15px">De forma geral, quão fácil foi fazer essa tarefa?</p>
      <div class="row" style="justify-content:space-between">${["😣", "🙁", "😐", "🙂", "😄"].map((e, i) => `<button class="chip ${o.seq === i + 1 ? "on" : ""}" style="font-size:26px;padding:8px 10px" data-a="t-seq" data-v="${i + 1}" aria-label="${i + 1} de 5">${e}</button>`).join("")}</div>
      <div class="row between small muted" style="margin-top:6px"><span>Muito difícil</span><span>Muito fácil</span></div>
      <div class="field" style="margin-top:18px"><label for="f-cm">Algum comentário? (opcional)</label><input id="f-cm" data-f="ov.cm" value="${esc(o.cm || "")}" maxlength="300" placeholder="Ex.: achei o botão pequeno"></div>
      <div class="bottom"><button class="btn" data-a="t-submit" ${o.seq ? "" : "disabled"}>${T.idx + 1 < total ? "Próxima tarefa" : "Finalizar"}</button></div></div>`;
    if (o.kind === "end") return `<div class="overlay" style="text-align:center">
      <div style="font-size:54px;margin-top:40px">🙏</div>
      <h1 class="h1">Muito obrigado!</h1>
      <p class="why" style="font-size:15px">Sua participação vai ajudar igrejas a organizarem melhor seus voluntários.</p>
      <p class="small muted">${{ enviando: "Enviando suas respostas…", enviado: "✓ Respostas enviadas.", local: "Respostas guardadas neste aparelho.", erro: "Não consegui enviar agora. Mantenha esta página aberta e com internet; vou tentar de novo." }[T.sendState] || ""}</p>
      ${T.sendState === "erro" ? `<div class="bottom"><button class="btn sec-btn" data-a="t-retry">Tentar enviar de novo</button></div>` : ""}</div>`;
    if (o.kind === "facil") return facilitador();
    return "";
  }

  function facilitador() {
    const base = location.origin + location.pathname;
    const f = T.fac;
    const link = f.code ? `${base}?p=${encodeURIComponent(f.code)}&perfil=${f.perfil}` : "";
    return `<div class="overlay">
      <div class="eyebrow">Facilitador</div>
      <h1 class="h2">Gerar link de teste</h1>
      <p class="why">Cada participante recebe um link próprio. Use códigos, não nomes (ex.: P1, P2…).</p>
      <div class="field"><label for="f-code">Código do participante</label><input id="f-code" data-f="fac.code" value="${esc(f.code)}" placeholder="Ex.: P1" maxlength="40"></div>
      <div class="field"><label>Perfil</label><div class="chips">${[["admin", "Pastor/secretaria · tarefa 1"], ["voluntario", "Voluntário · tarefas 2–4"], ["lider", "Líder · tarefas 5–6"], ["todos", "Todas · 1–6"]].map(([v, l]) => `<button class="chip ${f.perfil === v ? "on" : ""}" data-a="fperfil" data-v="${v}">${l}</button>`).join("")}</div></div>
      <div id="f-box" ${link ? "" : "hidden"}><div class="card small" style="word-break:break-all" id="f-link">${esc(link)}</div>
        <div class="row" style="margin-top:10px"><button class="btn" style="padding:12px" data-a="fcopy">Copiar link</button><a class="btn sec-btn" id="f-open" style="padding:12px;text-decoration:none" href="${esc(link)}">Abrir aqui</a></div></div>
      <div class="sec">Resultados</div>
      <a class="btn ghost" href="relatorio.html" style="text-decoration:none">Abrir relatório →</a>
      ${!CFG.supabaseUrl ? `<div class="card small" style="margin-top:10px;border-color:rgba(251,191,36,.45)">⚠ Supabase ainda não configurado (config.js). Os resultados ficam só no aparelho.</div>` : ""}
    </div>`;
  }

  /* ---------- render ---------- */
  let lastKey = "";
  function render() {
    const active = document.activeElement;
    const focusId = active && active.id;
    const caret = active && "selectionStart" in active ? active.selectionStart : null;
    let html = "";
    if (T.on && T.cur && !T.cur.done && !T.overlay) {
      html += `<div class="taskbar" role="status"><span>Tarefa ${T.idx + 1}/${T.list.length} · ${TASKS[T.cur.n].curto}</span><button data-a="t-ask-giveup">Não consegui</button></div>`;
    }
    html += S.full ? fullTicket() : V[S.screen]();
    html += nav();
    if (S.sheet) html += `<div class="scrim" data-a="sheetclose"></div><div class="sheet" role="dialog" aria-modal="true">${SHEETS[S.sheet.k]()}</div>`;
    if (S.toast) html += `<div class="toast" role="status"><span>${esc(S.toast)}</span></div>`;
    if (T.overlay) html += overlay();
    device.innerHTML = html;
    // anima só quando a tela muda; redesenhos na mesma tela não piscam
    const key = S.screen + (S.full ? "/ingresso" : "");
    device.classList.toggle("still", key === lastKey);
    lastKey = key;
    device.classList.toggle("has-taskbar", !!(T.on && T.cur && !T.cur.done && !T.overlay));
    if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch {} } }
    bindSwipe();
  }

  let toastTimer;
  function toast(msg) { S.toast = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => { S.toast = null; render(); }, 2600); }

  /* ---------- ações ---------- */
  const ACT = {
    go: (v) => setScreen(v),
    role: (v) => { S = fresh(v, v === "lider" ? "lhome" : "home"); },
    toast: (v) => toast(v),
    papel: (v) => { S.igreja.papel = v; },
    chip: (v, el) => { const set = { cultos: S.cultos, grupos: S.grupos, dias: S.dias, padrao: S.padrao }[el.dataset.set]; set.has(v) ? set.delete(v) : set.add(v); },
    cnt: (v, el) => { S.formacao[v] = Math.max(0, Math.min(9, S.formacao[v] + Number(el.dataset.d))); },
    dia: (v, el) => { S[v] = Math.max(1, Math.min(31, S[v] + Number(el.dataset.d))); },
    concluir: () => { setScreen("checklist"); goal(1); },
    lgpd: () => { S.dados.lgpd = !S.dados.lgpd; },
    instalado: () => { S.role = "vol"; setScreen("home"); toast("Tudo pronto! Bem-vinda ao Levita 🎉"); goal(2); },
    abrir: () => { S.full = true; },
    fechar: () => { S.full = false; },
    naoposso: (v) => { S.saida = v; S.sheet = { k: "naoposso" }; },
    motivo: (v) => { S.motivo = v; },
    saida: (v) => { S.saida = v; },
    enviarimprev: () => { S.imprev = S.saida; S.sheet = null; toast(S.saida === "troca" ? "Pedido de troca enviado aos vocais disponíveis." : "Marcos foi avisado."); goal(4, (S.conf ? "confirmou antes" : "NÃO confirmou antes") + "; imprevisto: " + S.saida + "; motivo: " + S.motivo); },
    tgl: (v) => { const d = S.disp.find((x) => x.id === v); d.on = !d.on; },
    todos: () => { S.disp.forEach((d) => (d.on = true)); },
    enviardisp: () => { S.dispEnviada = true; toast("Disponibilidade enviada ✓"); const d9 = S.disp.filter((d) => d.n === 9).every((d) => !d.on); goal(3, "domingo 9 desmarcado: " + (d9 ? "sim" : "não")); },
    gerar: () => { S.grade = JSON.parse(JSON.stringify(SUG)); toast("Sugestão pronta. Confira os alertas."); },
    cell: (v) => { if (!S.enviada) S.sheet = { k: "cell", v }; else toast("A escala já foi enviada."); },
    pick: (v) => {
      const [rid, c] = S.sheet.v.split("|");
      const cur = S.grade[rid][c], need = NEED[rid][c];
      if (cur.length < need) cur.push(v); else cur[cur.length - 1] = v;
      S.picked = rid + c; S.sheet = null; toast(v + " escalado(a).");
    },
    enviar: () => { S.sheet = { k: "enviar" }; },
    confirmaenvio: () => {
      S.enviada = true; S.sheet = null; toast("Escala enviada para a equipe ✓");
      const al = alerts();
      goal(5, al.length ? "enviada com alertas: " + al.join("; ") : "enviada sem alertas");
    },
    sheetclose: () => { S.sheet = null; },
    troca: (v) => { S.pend.troca = v; checkPend(); },
    substituto: (v) => { S.pend.naopode = v; toast(v + " recebeu o convite para substituir."); checkPend(); },
    /* modo teste */
    "t-next": () => nextTask(),
    "t-begin": (v) => beginTask(Number(v)),
    "t-ask-giveup": () => { T.overlay = { kind: "giveup" }; },
    "t-back": () => { T.overlay = null; },
    "t-giveup": () => { const gu = (T.overlay.gu || "").trim(); T.overlay = null; finishTask("desistiu", { obs: gu ? "dificuldade: " + gu.slice(0, 300) : "" }); },
    "t-seq": (v) => { T.overlay.seq = Number(v); },
    "t-submit": () => { submitTask(T.overlay.seq, (T.overlay.cm || "").trim().slice(0, 300)); },
    "t-retry": () => flush(),
    fperfil: (v) => { T.fac.perfil = v; },
    fcopy: () => {
      const el = document.getElementById("f-link"); const txt = el ? el.textContent : "";
      navigator.clipboard?.writeText(txt).then(() => toast("Link copiado ✓"), () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Selecionei o link: copie manualmente."); });
    },
  };
  function checkPend() {
    if (S.pend.troca !== "aberta" && S.pend.naopode !== "aberta") goal(6, "troca: " + S.pend.troca + "; substituto: " + S.pend.naopode);
  }

  device.addEventListener("click", (e) => {
    const el = e.target.closest("[data-a]");
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.a];
    if (!fn) return;
    // comentário digitado no overlay precisa ser lido antes do re-render
    fn(el.dataset.v, el);
    render();
  });
  device.addEventListener("input", (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    const [a, b] = f.split(".");
    const val = e.target.value;
    // atualiza só o necessário: redesenhar a tela fecharia o teclado do celular
    if (a === "ov") { if (T.overlay) T.overlay[b] = val; return; }
    if (a === "fac") {
      T.fac[b] = val.trim();
      const link = T.fac.code ? `${location.origin + location.pathname}?p=${encodeURIComponent(T.fac.code)}&perfil=${T.fac.perfil}` : "";
      const box = document.getElementById("f-box");
      if (box) { box.hidden = !link; document.getElementById("f-link").textContent = link; document.getElementById("f-open").href = link || "#"; }
      return;
    }
    S[a][b] = val;
    const bw1 = document.getElementById("b-w1");
    if (bw1) bw1.disabled = !S.igreja.nome.trim();
    const bd = document.getElementById("b-dados");
    if (bd) bd.disabled = !(S.dados.lgpd && S.dados.nasc.trim());
  });

  /* deslizar para confirmar (toque e mouse) */
  function bindSwipe() {
    const track = document.getElementById("swipe"), knob = document.getElementById("knob");
    if (!track || !knob) return;
    // o arraste começa em qualquer ponto da trilha, não só no círculo
    let x0 = null, dx = 0;
    const max = () => track.clientWidth - knob.clientWidth - 10;
    track.addEventListener("pointerdown", (e) => { x0 = e.clientX; track.setPointerCapture(e.pointerId); knob.style.transition = "none"; });
    track.addEventListener("pointermove", (e) => { if (x0 == null) return; dx = Math.max(0, Math.min(max(), e.clientX - x0)); knob.style.transform = `translateX(${dx}px)`; });
    const end = () => {
      if (x0 == null) return;
      x0 = null; knob.style.transition = "transform .2s";
      if (dx > max() * 0.85) { S.conf = true; toast("Presença confirmada ✓"); if (T.cur) T.cur.caminho.push({ s: "ingresso", a: "deslizou-confirmar", t: Math.round((performance.now() - T.cur.t0) / 100) / 10 }); render(); }
      else { knob.style.transform = "translateX(0)"; if (dx < 6) toast("Arraste o círculo até o fim para confirmar."); }
      dx = 0;
    };
    track.addEventListener("pointerup", end); track.addEventListener("pointercancel", end);
  }

  /* ---------- início ---------- */
  if (params.has("facilitador")) {
    S = fresh("admin", "entrada");
    T.fac = { code: "", perfil: "voluntario" };
    T.overlay = { kind: "facil" };
  } else if (params.get("p")) {
    startTest(params.get("p"), params.get("perfil") || "todos");
  } else {
    S = fresh("admin", "entrada");
  }
  render();
  flush();
})();
