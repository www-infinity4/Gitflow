'use strict';

const API = 'https://api.github.com';
const OWNER = 'www-infinity4';
const COMMITS_PER_REPO = 8;
const state = { registry: null, tokens: [], failures: [], repo: 'all', color: 'all', query: '' };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const safe = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function getJSON(url) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function classify(message, files = []) {
  const text = `${message} ${files.map(file => file.filename || file).join(' ')}`.toLowerCase();
  const tests = [
    ['red', /fix|repair|broken|error|fail|route|redirect|404|bug|restore|missing|conflict/],
    ['pink', /research|investigat|study|source|citation|verify|experiment|hypothesis/],
    ['blue', /import|migrat|copy|asset|upload|dependency|adapter|feed|api/],
    ['purple', /integrat|connect|sync|merge|wallet|token|portal|cross[- ]repo|assimilat/],
    ['orange', /decid|choose|proposal|plan|roadmap|architecture|design/],
    ['yellow', /data|json|schema|database|ledger|metric|analytics|catalog|index/],
    ['green', /build|add|create|implement|engineer|feature|page|ui|style|game|tool/]
  ];
  return (tests.find(([, pattern]) => pattern.test(text)) || ['green'])[0];
}

function tokenFromCommit(machine, commit) {
  const firstLine = commit.commit.message.split('\n')[0];
  return {
    id: commit.sha,
    short: commit.sha.slice(0, 9),
    repo: machine.repo,
    role: machine.role,
    symbol: machine.symbol,
    purpose: machine.purpose,
    message: firstLine,
    body: commit.commit.message,
    author: commit.commit.author?.name || commit.author?.login || 'Unknown',
    date: commit.commit.author?.date || commit.commit.committer?.date,
    url: commit.html_url,
    apiUrl: commit.url,
    parents: commit.parents || [],
    color: classify(firstLine),
    status: 'verified-commit'
  };
}

async function scan() {
  setWatcher('loading', 'Watcher reading GitHub…');
  $('#refresh-button').disabled = true;
  $('#token-grid').innerHTML = $('#loading-template').innerHTML.repeat(6);
  state.tokens = [];
  state.failures = [];
  const results = await Promise.all(state.registry.watch.map(async machine => {
    try {
      const commits = await getJSON(`${API}/repos/${OWNER}/${machine.repo}/commits?per_page=${COMMITS_PER_REPO}`);
      return { machine, commits };
    } catch (error) {
      state.failures.push({ machine, error: error.message });
      return { machine, commits: [] };
    }
  }));
  state.tokens = results.flatMap(({ machine, commits }) => commits.map(commit => tokenFromCommit(machine, commit)))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  state.failures.forEach(({ machine, error }) => state.tokens.push({
    id: `route:${machine.repo}`, short: 'NO ROUTE', repo: machine.repo, role: machine.role,
    symbol: machine.symbol, purpose: machine.purpose, message: `Repository route needs repair: ${error}`,
    author: 'Gitscan watcher', date: new Date().toISOString(), color: 'red', status: 'broken-route', parents: []
  }));
  renderRepoFilters();
  renderTokens();
  updateMetrics();
  const successful = results.filter(result => result.commits.length).length;
  setWatcher(state.failures.length ? 'error' : 'live', `${successful}/${results.length} repositories synchronized`);
  $('#last-scan').textContent = `Verified ${new Date().toLocaleString()}`;
  $('#watcher-notice').className = `notice${state.failures.length ? ' error' : ''}`;
  $('#watcher-notice').textContent = state.failures.length
    ? `${state.failures.length} route(s) could not be read. They are preserved as red repair tokens instead of being hidden.`
    : 'Verified live repository history loaded. Token serials are full Git commit hashes; no random activity is displayed.';
  $('#refresh-button').disabled = false;
}

function setWatcher(kind, text) {
  const el = $('#watcher-status');
  el.className = `status ${kind}`;
  el.querySelector('span').textContent = text;
}

function renderRepoFilters() {
  const counts = state.tokens.reduce((map, token) => map.set(token.repo, (map.get(token.repo) || 0) + 1), new Map());
  $('#repo-filters').innerHTML = [
    `<button class="repo-filter ${state.repo === 'all' ? 'active' : ''}" data-repo="all"><b>All machines</b><span>${state.tokens.length}</span></button>`,
    ...state.registry.watch.map(machine => `<button class="repo-filter ${state.repo === machine.repo ? 'active' : ''}" data-repo="${safe(machine.repo)}"><b>${safe(machine.symbol)} ${safe(machine.repo)}</b><span>${counts.get(machine.repo) || 0}</span></button>`)
  ].join('');
  $$('.repo-filter').forEach(button => button.addEventListener('click', () => {
    state.repo = button.dataset.repo;
    renderRepoFilters();
    renderTokens();
  }));
}

function filteredTokens() {
  const query = state.query.toLowerCase();
  return state.tokens.filter(token =>
    (state.repo === 'all' || token.repo === state.repo) &&
    (state.color === 'all' || token.color === state.color) &&
    (!query || `${token.repo} ${token.id} ${token.message} ${token.author} ${token.role}`.toLowerCase().includes(query))
  );
}

function renderTokens() {
  const tokens = filteredTokens();
  $('#ledger-title').textContent = `${tokens.length} inspectable ${tokens.length === 1 ? 'token' : 'tokens'}`;
  $('#token-grid').innerHTML = tokens.length ? tokens.map(token => `
    <article class="token-card" data-id="${safe(token.id)}" data-color="${token.color}" tabindex="0" role="button" aria-label="Open token ${safe(token.short)}">
      <div class="token-top"><span>${safe(token.symbol)} ${safe(token.repo)}</span><span class="token-kind">${safe(state.registry.colors[token.color])}</span></div>
      <h3>${safe(token.message)}</h3>
      <p>${safe(token.role)} · ${safe(token.author)}</p>
      <code class="token-sha">${safe(token.short)}</code>
      <div class="token-bottom"><span>${formatDate(token.date)}</span><span>VIEW · BUILD · CONNECT →</span></div>
    </article>`).join('') : '<div class="empty">No token matches these filters.</div>';
  $$('.token-card').forEach(card => {
    const open = () => openToken(state.tokens.find(token => token.id === card.dataset.id));
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') open(); });
  });
}

function formatDate(date) {
  return date ? new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric', year:'numeric' }).format(new Date(date)) : 'Unknown date';
}

async function openToken(token) {
  const dialog = $('#token-dialog');
  $('#token-page').innerHTML = '<div class="token-page"><p class="eyebrow">LOADING VERIFIED COMMIT EVIDENCE…</p></div>';
  dialog.showModal();
  if (token.status === 'broken-route') return renderTokenPage(token, null);
  try {
    const detail = await getJSON(`${API}/repos/${OWNER}/${token.repo}/commits/${token.id}`);
    token.color = classify(token.message, detail.files || []);
    renderTokenPage(token, detail);
  } catch (error) {
    renderTokenPage({ ...token, color:'red', detailError:error.message }, null);
  }
}

function robotWork(token, detail) {
  const files = detail?.files || [];
  const names = files.map(file => file.filename);
  const tasks = [];
  if (!names.some(name => /readme/i.test(name))) tasks.push('Document the user-facing purpose and verification steps for this change.');
  if (!names.some(name => /test|spec/i.test(name))) tasks.push('Add a repeatable test or a manual verification record tied to this commit.');
  if (names.some(name => /\.html$/.test(name)) && !names.some(name => /\.css$/.test(name))) tasks.push('Check mobile readability and interaction sizing in the changed page.');
  if (/research|data|claim|science/i.test(token.message) && !names.some(name => /source|citation|reference|research/i.test(name))) tasks.push('Attach primary sources and separate observed evidence from hypotheses.');
  if (/token|wallet|reward|coin/i.test(token.message)) tasks.push('Trace the action through token creation, ledger persistence, wallet display and duplicate prevention.');
  if (!tasks.length) tasks.push('Run the changed files, record the observed result and promote the next unresolved item into a child action token.');
  return tasks;
}

function buildIssueUrl(token, detail) {
  const files = (detail?.files || []).map(file => `- [ ] Inspect \`${file.filename}\``).join('\n') || '- [ ] Restore the repository route';
  const tasks = robotWork(token, detail).map(task => `- [ ] ${task}`).join('\n');
  const body = `## Parent action token\n\n${token.id}\n\n## Evidence\n\n- Repository: ${OWNER}/${token.repo}\n- Commit: ${token.url || 'unavailable'}\n- Classification: ${state.registry.colors[token.color]}\n\n## Files\n\n${files}\n\n## Robot work queue\n\n${tasks}\n\n## Definition of done\n\n- [ ] Output is usable on mobile\n- [ ] Sources and observed results are attached\n- [ ] Completion commit is linked back to this token`;
  return `https://github.com/${OWNER}/${token.repo}/issues/new?title=${encodeURIComponent(`[${token.short}] Build: ${token.message}`)}&body=${encodeURIComponent(body)}`;
}

function renderTokenPage(token, detail) {
  const files = detail?.files || [];
  const stats = detail?.stats;
  const tasks = robotWork(token, detail);
  const parent = token.parents?.[0]?.sha;
  const known = detail
    ? `GitHub reports this commit changed ${files.length} file(s) with ${stats?.additions || 0} addition(s) and ${stats?.deletions || 0} deletion(s).`
    : 'The watcher could not retrieve a commit record for this route.';
  const inference = detail
    ? `The ${state.registry.colors[token.color]} classification is derived from the commit message and changed filenames. It is a routing aid, not a claim about the quality or completion of the work.`
    : 'This red token keeps missing infrastructure visible until its route can be restored.';
  $('#token-page').innerHTML = `<article class="token-page" data-color="${token.color}">
    <p class="page-kicker">${safe(token.symbol)} ${safe(token.repo)} · ${safe(state.registry.colors[token.color]).toUpperCase()} · ${safe(token.status)}</p>
    <h1>${safe(token.message)}</h1>
    <p>${safe(token.purpose)}</p>
    <code class="full-sha">${safe(token.id)}</code>
    <div class="page-actions">
      ${token.url ? `<a href="${safe(token.url)}" target="_blank" rel="noreferrer">VIEW COMMIT</a>` : ''}
      <a class="build" href="${safe(buildIssueUrl(token, detail))}" target="_blank" rel="noreferrer">BUILD THIS NEXT</a>
      <button id="copy-token">COPY WORK PACKET</button>
    </div>
    <div class="detail-grid">
      <section class="detail-card"><h2>Identity & lineage</h2><ul class="fact-list">
        <li><b>Author</b><br>${safe(token.author)}</li><li><b>Committed</b><br>${safe(formatDate(token.date))}</li>
        <li><b>Parent</b><br>${parent ? `<code>${safe(parent)}</code>` : 'No parent returned'}</li><li><b>Version</b><br>Commit-addressed; immutable serial</li>
      </ul></section>
      <section class="detail-card"><h2>Observed output</h2><ul class="fact-list">
        <li><span class="truth-label">OBSERVED</span>${safe(known)}</li>
        <li><span class="truth-label inference">INFERENCE</span>${safe(inference)}</li>
        ${token.detailError ? `<li>Detail read failed: ${safe(token.detailError)}</li>` : ''}
      </ul></section>
      <section class="detail-card wide"><h2>Project floor plan</h2><div class="floor-plan">
        <div class="floor-step"><b>01 · SIGNAL</b><span>Commit enters watcher from ${safe(token.repo)}.</span></div>
        <div class="floor-step"><b>02 · ANCHOR</b><span>Full SHA locks identity, files, author and parent.</span></div>
        <div class="floor-step"><b>03 · DEVELOP</b><span>Research and robot tasks become a visible work packet.</span></div>
        <div class="floor-step"><b>04 · OUTPUT</b><span>Next commit becomes a child token linked to this work.</span></div>
      </div></section>
      <section class="detail-card"><h2>Files / physical rooms</h2><ul class="file-list">${files.length ? files.map(file => `<li><code>${safe(file.filename)}</code><br>${safe(file.status)} · +${file.additions} / −${file.deletions} · ${file.changes} changes</li>`).join('') : '<li>No changed-file data available.</li>'}</ul></section>
      <section class="detail-card"><h2>Robot work queue</h2><ol class="robot-list">${tasks.map(task => `<li>${safe(task)}</li>`).join('')}</ol></section>
      <section class="detail-card wide"><h2>Research record & sources</h2><ul class="source-list">
        ${token.url ? `<li><a href="${safe(token.url)}" target="_blank" rel="noreferrer">Primary evidence: GitHub commit and diff</a></li>` : ''}
        <li><a href="https://docs.github.com/en/rest/commits/commits" target="_blank" rel="noreferrer">Method source: GitHub REST commit documentation</a></li>
        <li><a href="https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History" target="_blank" rel="noreferrer">Method source: Git commit-history documentation</a></li>
        <li><b>Research rule:</b> claims from external material need a direct source link; project ideas remain labeled as hypotheses until a test produces recorded evidence.</li>
      </ul></section>
    </div>
  </article>`;
  $('#copy-token').addEventListener('click', async event => {
    const packet = { schema:'infinity/action-token/v1', token, files, stats, robotWork:tasks, generatedAt:new Date().toISOString() };
    await navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    event.currentTarget.textContent = 'COPIED';
  });
}

function updateMetrics() {
  $('#metric-repos').textContent = new Set(state.tokens.filter(token => token.status === 'verified-commit').map(token => token.repo)).size;
  $('#metric-tokens').textContent = state.tokens.filter(token => token.status === 'verified-commit').length;
  $('#metric-files').textContent = 'ON';
  $('#metric-broken').textContent = state.failures.length;
}

function exportWatcher() {
  const payload = { schema:'infinity/action-token-watcher-export/v1', generatedAt:new Date().toISOString(), source:`https://github.com/${OWNER}`, tokens:state.tokens, failures:state.failures };
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' }));
  link.download = `gitflow-action-tokens-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function boot() {
  try {
    state.registry = await getJSON('gitflow-family.json');
    $$('.color-filter').forEach(button => button.addEventListener('click', () => {
      state.color = button.dataset.color;
      $$('.color-filter').forEach(item => item.classList.toggle('active', item === button));
      renderTokens();
    }));
    $('#token-search').addEventListener('input', event => { state.query = event.target.value; renderTokens(); });
    $('#refresh-button').addEventListener('click', scan);
    $('#export-button').addEventListener('click', exportWatcher);
    $('#dialog-close').addEventListener('click', () => $('#token-dialog').close());
    $('#token-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
    await scan();
  } catch (error) {
    setWatcher('error', 'Watcher could not start');
    $('#token-grid').innerHTML = `<div class="empty">${safe(error.message)}</div>`;
  }
}

boot();
