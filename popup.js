const totalCountEl = document.getElementById('totalCount');
const filesCountEl = document.getElementById('filesCount');
const allCountEl = document.getElementById('allCount');
const closeFilesBtn = document.getElementById('closeFilesBtn');
const closeAllBtn = document.getElementById('closeAllBtn');
const windowList = document.getElementById('windowList');
const selectToggle = document.getElementById('selectToggle');
const selectPanel = document.getElementById('selectPanel');
const selectList = document.getElementById('selectList');
const closeSelectedBtn = document.getElementById('closeSelectedBtn');
const selectedCountEl = document.getElementById('selectedCount');
const undoBar = document.getElementById('undoBar');
const undoBtn = document.getElementById('undoBtn');
const undoCountEl = document.getElementById('undoCount');

const FILE_EXTENSIONS = /\.(txt|md|js|ts|jsx|tsx|py|html|css|json|xml|csv|log|yml|yaml|toml|ini|cfg|conf|sh|bash|bat|ps1|rb|go|rs|java|c|cpp|h|hpp|cs|php|sql|r|swift|kt|scala|lua|pl|ex|exs|hs|ml|vue|svelte|astro|mdx|ipynb|env|gitignore|dockerfile|makefile|pdf|pptx|docx|xlsx|doc|ppt|xls)$/i;

function isFileUrl(url) {
  if (!url) return false;
  return url.startsWith('file://');
}

function hasFileExtension(url) {
  if (!url) return false;
  const pathname = url.split('?')[0].split('#')[0];
  return FILE_EXTENSIONS.test(pathname);
}

async function getWindowInfo(w) {
  const tabs = await chrome.tabs.query({ windowId: w.id });
  const active = tabs.find(t => t.active) || tabs[0];
  const allUrls = tabs.map(t => t.url || '');
  const fileCount = allUrls.filter(u => isFileUrl(u) || hasFileExtension(u)).length;
  const hasFiles = fileCount > 0;
  return {
    id: w.id,
    title: active?.title || 'Untitled',
    url: active?.url || '',
    tabCount: tabs.length,
    tabUrls: allUrls,
    tabTitles: tabs.map(t => t.title || ''),
    isFile: hasFiles,
  };
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

let infos = [];
let myId = null;
let lastClosed = null;

async function refresh() {
  const cur = await chrome.windows.getCurrent();
  myId = cur.id;
  const raw = await chrome.windows.getAll();

  const wins = raw.filter(w => w.type !== 'devtools');

  infos = await Promise.all(wins.map(getWindowInfo));
  infos.sort((a, b) => (a.id === myId ? -1 : b.id === myId ? 1 : 0));

  const others = infos.filter(w => w.id !== myId);
  const files = others.filter(w => w.isFile);

  totalCountEl.textContent = wins.length;
  filesCountEl.textContent = files.length;
  allCountEl.textContent = others.length;

  closeFilesBtn.disabled = files.length === 0;
  closeAllBtn.disabled = others.length === 0;

  windowList.innerHTML = infos.length === 0
    ? '<div class="empty-state">No windows found</div>'
    : infos.map(w => {
        const mine = w.id === myId;
        const dot = mine ? '' : w.isFile ? 'file' : 'page';
        const badge = mine
          ? '<span class="badge badge-keep">KEEP</span>'
          : w.isFile
          ? '<span class="badge badge-file">FILE</span>'
          : '<span class="badge badge-page">PAGE</span>';
        const tabs = w.tabCount > 1 ? `<span class="tab-count">${w.tabCount} tabs</span>` : '';
        return `<div class="window-item ${mine ? 'current' : ''}">
          <span class="window-dot ${dot}"></span>
          <span class="window-title">${esc(w.title)}</span>
          ${tabs}
          ${badge}
        </div>`;
      }).join('');
}

async function saveForUndo(targets) {
  const data = [];
  for (const w of targets) {
    data.push({ urls: w.tabUrls, title: w.title });
  }
  try {
    await chrome.storage.session.set({ lastClosed: data });
  } catch {}
  lastClosed = data;
}

function showUndo(count) {
  undoCountEl.textContent = count;
  undoBar.classList.remove('hidden');
}

undoBtn.addEventListener('click', async () => {
  let data = lastClosed;
  if (!data) {
    try {
      const stored = await chrome.storage.session.get('lastClosed');
      data = stored.lastClosed;
    } catch {}
  }
  if (!data || data.length === 0) return;

  for (const win of data) {
    const urls = (win.urls || []).filter(u => u && !u.startsWith('chrome://'));
    if (urls.length > 0) {
      await chrome.windows.create({ url: urls });
    }
  }

  lastClosed = null;
  try { await chrome.storage.session.remove('lastClosed'); } catch {}
  undoBar.classList.add('hidden');
  await refresh();
});

async function closeWindows(filter) {
  const targets = infos.filter(w => w.id !== myId && filter(w));
  const n = targets.length;
  if (n === 0) return;
  const btn = filter.filesOnly ? closeFilesBtn : closeAllBtn;

  btn.querySelector('.btn-label').textContent = `Closing ${n}...`;
  btn.classList.add('closing-pulse');
  btn.disabled = true;

  await saveForUndo(targets);

  for (const w of targets) {
    try { await chrome.windows.remove(w.id); } catch {}
  }

  btn.classList.remove('closing-pulse');
  btn.classList.add('done');
  btn.querySelector('.btn-num').textContent = '✓';
  btn.querySelector('.btn-sub').textContent = '';
  btn.querySelector('.btn-label').textContent = `Closed ${n}`;

  showUndo(n);
  await refresh();

  if (infos.filter(w => w.id !== myId).length === 0) {
    setTimeout(() => window.close(), 1500);
  }
}

const fileFilter = Object.assign(w => w.isFile, { filesOnly: true });
const allFilter = Object.assign(() => true, { filesOnly: false });

closeFilesBtn.addEventListener('click', () => closeWindows(fileFilter));
closeAllBtn.addEventListener('click', () => closeWindows(allFilter));

selectToggle.addEventListener('click', () => {
  selectPanel.classList.toggle('hidden');
  selectToggle.classList.toggle('open', !selectPanel.classList.contains('hidden'));
  selectToggle.textContent = selectPanel.classList.contains('hidden')
    ? 'Select specific windows ▾'
    : 'Select specific windows ▴';
  if (!selectPanel.classList.contains('hidden')) renderSelectList();
});

function renderSelectList() {
  const others = infos.filter(w => w.id !== myId);
  if (others.length === 0) {
    selectList.innerHTML = '<div class="empty-state">No other windows</div>';
    closeSelectedBtn.disabled = true;
    return;
  }
  selectList.innerHTML = others.map(w => {
    const dot = w.isFile ? 'file' : 'page';
    const badge = w.isFile
      ? '<span class="badge badge-file">FILE</span>'
      : '<span class="badge badge-page">PAGE</span>';
    const tabs = w.tabCount > 1 ? `<span class="tab-count">${w.tabCount} tabs</span>` : '';
    return `<label class="select-item">
      <input type="checkbox" data-wid="${w.id}">
      <span class="window-dot ${dot}"></span>
      <span class="select-title">${esc(w.title)}</span>
      ${tabs}
      ${badge}
    </label>`;
  }).join('');

  selectList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateSelectedCount);
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const checked = selectList.querySelectorAll('input:checked').length;
  selectedCountEl.textContent = checked;
  closeSelectedBtn.disabled = checked === 0;
}

closeSelectedBtn.addEventListener('click', async () => {
  const checked = [...selectList.querySelectorAll('input:checked')];
  const ids = checked.map(cb => Number(cb.dataset.wid));
  const n = ids.length;
  if (n === 0) return;

  const targets = infos.filter(w => ids.includes(w.id));
  await saveForUndo(targets);

  closeSelectedBtn.disabled = true;

  for (const id of ids) {
    try { await chrome.windows.remove(id); } catch {}
  }

  showUndo(n);
  await refresh();
  renderSelectList();

  if (infos.filter(w => w.id !== myId).length === 0) {
    setTimeout(() => window.close(), 1500);
  }
});

refresh();
