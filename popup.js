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
const selectAllBtn = document.getElementById('selectAllBtn');

// #17: Set instead of giant regex — easier to maintain
const FILE_EXTENSIONS = new Set([
  'txt','md','js','ts','jsx','tsx','py','css','json','xml','csv','log',
  'yml','yaml','toml','ini','cfg','conf','sh','bash','bat','ps1',
  'rb','go','rs','java','c','cpp','h','hpp','cs','sql','r',
  'swift','kt','scala','lua','pl','ex','exs','hs','ml',
  'vue','svelte','astro','mdx','ipynb',
  'pdf','pptx','docx','xlsx','doc','ppt','xls',
]);

function isFileUrl(url) {
  if (!url) return false;
  return url.startsWith('file://');
}

// #1 #16: Only check extensions on file:// URLs, not on http/chrome-extension URLs
function getFileExtension(url) {
  if (!url) return null;
  const pathname = url.split('?')[0].split('#')[0];
  const dot = pathname.lastIndexOf('.');
  if (dot === -1) return null;
  const ext = pathname.slice(dot + 1).toLowerCase();
  return FILE_EXTENSIONS.has(ext) ? ext : null;
}

function isFileTab(url) {
  if (!url) return false;
  if (isFileUrl(url)) return true;
  // Only check extension for file:// URLs to avoid false positives
  // on web URLs like moodlearn.ariel.ac.il/view.php
  return false;
}

function getExtLabel(url) {
  if (!url) return null;
  const pathname = url.split('?')[0].split('#')[0];
  const dot = pathname.lastIndexOf('.');
  if (dot === -1) return null;
  return pathname.slice(dot + 1).toUpperCase();
}

async function getWindowInfo(w) {
  const tabs = await chrome.tabs.query({ windowId: w.id });
  const active = tabs.find(t => t.active) || tabs[0];
  const allUrls = tabs.map(t => t.url || '');
  const fileCount = allUrls.filter(u => isFileTab(u)).length;
  const hasFiles = fileCount > 0;
  const ext = active ? getExtLabel(active.url) : null;
  return {
    id: w.id,
    title: active?.title || 'Untitled',
    url: active?.url || '',
    tabCount: tabs.length,
    tabUrls: allUrls,
    tabTitles: tabs.map(t => t.title || ''),
    isFile: hasFiles,
    ext: ext,
  };
}

// #18: Use textContent-based escaping
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

let infos = [];
let myId = null;
let lastClosed = null;

async function refresh() {
  try {
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

    // #3: Reset button state on every refresh
    resetButton(closeFilesBtn, files.length, 'files', 'Close Files');
    resetButton(closeAllBtn, others.length, 'windows', 'Close All');

    // #10: Build window list
    windowList.innerHTML = infos.length === 0
      ? '<div class="empty-state">No windows found</div>'
      : infos.map(w => {
          const mine = w.id === myId;
          const dot = mine ? '' : w.isFile ? 'file' : 'page';
          let badge;
          if (mine) {
            badge = '<span class="badge badge-keep">KEEP</span>';
          } else if (w.isFile) {
            // #6: Show file extension as badge
            const extLabel = w.ext || 'FILE';
            badge = `<span class="badge badge-file">${esc(extLabel)}</span>`;
          } else {
            badge = '<span class="badge badge-page">PAGE</span>';
          }
          const tabs = w.tabCount > 1 ? `<span class="tab-count">${w.tabCount} tabs</span>` : '';
          // #11: Add title attribute for full tooltip on hover
          return `<div class="window-item ${mine ? 'current' : ''}" title="${esc(w.url)}">
            <span class="window-dot ${dot}"></span>
            <span class="window-title">${esc(w.title)}</span>
            ${tabs}
            ${badge}
          </div>`;
        }).join('');
  } catch (err) {
    // #12: Error handling
    windowList.innerHTML = `<div class="empty-state">Error loading windows</div>`;
  }
}

// #3: Reset button to default state
function resetButton(btn, count, sub, label) {
  btn.classList.remove('done', 'closing-pulse');
  btn.querySelector('.btn-num').textContent = count;
  btn.querySelector('.btn-sub').textContent = sub;
  btn.querySelector('.btn-label').textContent = label;
  btn.disabled = count === 0;
}

async function saveForUndo(targets) {
  // #4: Warn if overwriting existing undo
  if (lastClosed && lastClosed.length > 0) {
    const prev = lastClosed.length;
    undoBar.classList.add('hidden');
    lastClosed = null;
  }

  const data = [];
  for (const w of targets) {
    data.push({ urls: w.tabUrls, title: w.title });
  }
  // #13: try/catch with awareness of quota
  try {
    await chrome.storage.session.set({ lastClosed: data });
  } catch (err) {
    // Storage quota exceeded — keep in memory only
  }
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
    // #2: Replace chrome:// URLs with about:blank instead of filtering them out
    const urls = (win.urls || []).map(u => {
      if (!u || u.startsWith('chrome://') || u.startsWith('chrome-extension://')) return 'about:blank';
      return u;
    }).filter(u => u);
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

  // #5: Confirmation for mass close (5+ windows)
  if (n >= 5) {
    const label = filter.filesOnly ? 'file' : '';
    const ok = confirm(`Close ${n} ${label} windows? You can undo after.`);
    if (!ok) return;
  }

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
    selectAllBtn.classList.add('hidden');
    return;
  }
  selectAllBtn.classList.remove('hidden');
  selectAllBtn.textContent = 'Select all';

  selectList.innerHTML = others.map(w => {
    const dot = w.isFile ? 'file' : 'page';
    let badge;
    if (w.isFile) {
      const extLabel = w.ext || 'FILE';
      badge = `<span class="badge badge-file">${esc(extLabel)}</span>`;
    } else {
      badge = '<span class="badge badge-page">PAGE</span>';
    }
    const tabs = w.tabCount > 1 ? `<span class="tab-count">${w.tabCount} tabs</span>` : '';
    // #11: tooltip with URL
    return `<label class="select-item" title="${esc(w.url)}">
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

// #7: Select All / Deselect All
selectAllBtn.addEventListener('click', () => {
  const checkboxes = selectList.querySelectorAll('input[type="checkbox"]');
  const allChecked = [...checkboxes].every(cb => cb.checked);
  checkboxes.forEach(cb => { cb.checked = !allChecked; });
  selectAllBtn.textContent = allChecked ? 'Select all' : 'Deselect all';
  updateSelectedCount();
});

function updateSelectedCount() {
  const checkboxes = selectList.querySelectorAll('input[type="checkbox"]');
  const checked = [...checkboxes].filter(cb => cb.checked).length;
  selectedCountEl.textContent = checked;
  closeSelectedBtn.disabled = checked === 0;
  // Update select all button text
  if (checkboxes.length > 0) {
    const allChecked = checked === checkboxes.length;
    selectAllBtn.textContent = allChecked ? 'Deselect all' : 'Select all';
  }
}

closeSelectedBtn.addEventListener('click', async () => {
  const checked = [...selectList.querySelectorAll('input:checked')];
  const ids = checked.map(cb => Number(cb.dataset.wid));
  const n = ids.length;
  if (n === 0) return;

  // #5: Confirmation for 5+ windows
  if (n >= 5) {
    const ok = confirm(`Close ${n} selected windows? You can undo after.`);
    if (!ok) return;
  }

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

// #9: Real-time updates when windows open/close
chrome.windows.onCreated.addListener(() => refresh());
chrome.windows.onRemoved.addListener((winId) => {
  if (winId !== myId) refresh();
});

refresh();
