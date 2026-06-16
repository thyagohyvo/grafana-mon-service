(() => {
  /* ── Referências ──────────────────────────────────────────────────────── */
  const root       = htmlNode.querySelector('#cg-root');
  const grid       = htmlNode.querySelector('#cg-grid');
  const empty      = htmlNode.querySelector('#cg-empty');
  const subEl      = htmlNode.querySelector('#cg-sub');
  const filterEl   = htmlNode.querySelector('#cg-filter');
  const btnClear   = htmlNode.querySelector('#cg-clear');
  const cntOk      = htmlNode.querySelector('#cg-cnt-ok');
  const cntDown    = htmlNode.querySelector('#cg-cnt-down');
  const footerInfo = htmlNode.querySelector('#cg-footer-info');
  const footerTs   = htmlNode.querySelector('#cg-footer-ts');
  const btnName    = htmlNode.querySelector('#cg-sort-name');
  const btnStatus  = htmlNode.querySelector('#cg-sort-status');
  const btnUptime  = htmlNode.querySelector('#cg-sort-uptime');

  /* ── Tema automático ──────────────────────────────────────────────────── */
  root.dataset.theme = htmlGraphics?.theme?.isDark ? 'dark' : 'light';

  /* ── Estado persistente ───────────────────────────────────────────────── */
  const KEY = '__cg_svc_state__';
  const S = window[KEY] ||= { q: '', sortCol: 'Servidor', sortDir: 'asc' };

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const isNil = v =>
    v === null || v === undefined || v === '' ||
    (typeof v === 'number' && !isFinite(v));

  const asNum = v => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isFinite(n) ? n : null;
  };

  const asStr = v => isNil(v) ? '' : String(v);

  const getVal = (field, i) => {
    const vals = field?.values;
    if (!vals) return null;
    return typeof vals.get === 'function' ? vals.get(i) : vals[i];
  };

  /* ── Leitura de dados ─────────────────────────────────────────────────── */
  const toRows = () => {
    const series = htmlGraphics?.data?.series;
    if (!series?.length) return [];
    const df     = series[0];
    const fields = df.fields || [];
    const idx    = Object.fromEntries(fields.map((f, i) => [f.name, i]));
    const n      = fields[0]?.values?.length ?? 0;
    const need   = ['Servidor', 'Status', 'Uptime'];
    const out    = [];
    for (let i = 0; i < n; i++) {
      const row = {};
      for (const col of need) {
        const f = fields[idx[col]];
        row[col] = f ? getVal(f, i) : null;
      }
      out.push(row);
    }
    return out;
  };

  /* ── Formatações ──────────────────────────────────────────────────────── */
  const isUp = raw => asNum(raw) === 1;

  const formatUptime = raw => {
    const s0 = asNum(raw);
    if (s0 === null || s0 < 0) return '—';
    let s = Math.floor(s0);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600);  s -= h * 3600;
    const m = Math.floor(s / 60);
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h || d) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  };

  const sinceDate = raw => {
    const s0 = asNum(raw);
    if (s0 === null || s0 < 0) return '—';
    const since = new Date(Date.now() - s0 * 1000);
    return since.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit'
    }) + ' ' + since.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  /* ── Ordenação ────────────────────────────────────────────────────────── */
  const sortRows = rows => [...rows].sort((a, b) => {
    let d = 0;
    if (S.sortCol === 'Status') {
      d = (isUp(a.Status) ? 1 : 0) - (isUp(b.Status) ? 1 : 0);
    } else if (S.sortCol === 'Uptime') {
      d = (asNum(a.Uptime) ?? -1) - (asNum(b.Uptime) ?? -1);
    } else {
      d = asStr(a.Servidor).localeCompare(asStr(b.Servidor), 'pt-BR', {
        numeric: true, sensitivity: 'base'
      });
    }
    return S.sortDir === 'asc' ? d : -d;
  });

  /* ── Botões de sort ───────────────────────────────────────────────────── */
  const updateSortBtns = () => {
    const map = { Servidor: btnName, Status: btnStatus, Uptime: btnUptime };
    [btnName, btnStatus, btnUptime].forEach(b => b.classList.remove('cg-sort-btn--active'));
    map[S.sortCol]?.classList.add('cg-sort-btn--active');
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  const render = () => {
    root.dataset.theme = htmlGraphics?.theme?.isDark ? 'dark' : 'light';

    let rows = toRows();
    const now = new Date();
    const ts  = now.toLocaleString('pt-BR');

    if (!rows.length) {
      empty.style.display = 'block';
      grid.querySelectorAll('.cg-card').forEach(c => c.remove());
      subEl.textContent = 'Sem dados';
      cntOk.innerHTML   = '<span class="cg-pill__dot"></span>0 Online';
      cntDown.innerHTML = '<span class="cg-pill__dot"></span>0 Offline';
      footerTs.textContent = ts;
      return;
    }
    empty.style.display = 'none';

    // contagens totais (antes do filtro)
    let okCount = 0, downCount = 0;
    rows.forEach(r => { isUp(r.Status) ? okCount++ : downCount++; });
    cntOk.innerHTML   = `<span class="cg-pill__dot"></span>${okCount} Online`;
    cntDown.innerHTML = `<span class="cg-pill__dot"></span>${downCount} Offline`;

    // filtro
    if (S.q) {
      const q = S.q.toLowerCase();
      rows = rows.filter(r => asStr(r.Servidor).toLowerCase().includes(q));
    }

    // ── Ordena pelo nome real antes de mascarar ───────────────────────────
    const sorted = sortRows(rows);
    updateSortBtns();

    // remove cards anteriores
    grid.querySelectorAll('.cg-card').forEach(c => c.remove());

    sorted.forEach(row => {
      const up      = isUp(row.Status);
      const stKey   = up ? 'up' : 'down';
      const stLabel = up ? 'UP' : 'DOWN';
      const srv     = asStr(row.Servidor).replace(/[<>]/g, '');
      const uptime  = formatUptime(row.Uptime);
      const since   = sinceDate(row.Uptime);

      const card = document.createElement('div');
      card.className = 'cg-card';
      card.innerHTML = `
        <div class="cg-card__topbar ${stKey}"></div>

        <div class="cg-card__body">
          <div class="cg-card__name-row">
            <span class="cg-card__name" title="${srv}">${srv}</span>
            <span class="cg-badge ${stKey}">${stLabel}</span>
          </div>
          <div class="cg-card__label">Servidor</div>

          <div class="cg-card__sep"></div>

          <div class="cg-card__metrics">
            <div class="cg-metric">
              <div class="cg-metric__label">Uptime</div>
              <div class="cg-metric__val">${uptime}</div>
            </div>
            <div class="cg-metric">
              <div class="cg-metric__label">Online desde</div>
              <div class="cg-metric__sub">${since}</div>
            </div>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    subEl.textContent      = `${rows.length} hosts · ${ts}`;
    footerInfo.textContent = `Grafana HTML Graphics · Zabbix MySQL · ${rows.length} hosts`;
    footerTs.textContent   = ts;
  };

  /* ── Eventos ──────────────────────────────────────────────────────────── */
  if (!root.dataset.bound) {
    root.dataset.bound = '1';

    filterEl.addEventListener('input', () => {
      S.q = (filterEl.value || '').trim().toLowerCase();
      render();
    });

    btnClear.addEventListener('click', () => {
      S.q = '';
      filterEl.value = '';
      render();
    });

    [
      [btnName,   'Servidor'],
      [btnStatus, 'Status'],
      [btnUptime, 'Uptime'],
    ].forEach(([btn, col]) => {
      btn.addEventListener('click', () => {
        S.sortDir = (S.sortCol === col && S.sortDir === 'asc') ? 'desc' : 'asc';
        S.sortCol = col;
        render();
      });
    });
  }

  filterEl.value = S.q || '';
  updateSortBtns();

  /* ── Entry point ──────────────────────────────────────────────────────── */
  onRender = () => { try { render(); } catch(e) { console.error('[cg-svc]', e); } };
  try { render(); } catch(e) { console.error('[cg-svc]', e); }
})();
