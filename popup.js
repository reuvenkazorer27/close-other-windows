const totalCountEl = document.getElementById('totalCount');
const filesCountEl = document.getElementById('filesCount');
const allCountEl = document.getElementById('allCount');
const closeFilesBtn = document.getElementById('closeFilesBtn');
const closeAllBtn = document.getElementById('closeAllBtn');
const windowList = document.getElementById('windowList');

const FILE_PATTERNS = [
  /^file:\/\//,
  /\.(txt|md|js|ts|jsx|tsx|py|html|css|json|xml|csv|log|yml|yaml|toml|ini|cfg|conf|sh|bash|bat|ps1|rb|go|rs|java|c|cpp|h|hpp|cs|php|sql|r|swift|kt|scala|lua|pl|ex|exs|hs|ml|vue|svelte|astro|mdx|ipynb|env|gitignore|dockerfile|makefile)$/i,
];

function isFileWindow(url) {
  if (!url) return false;
  if (url.startsWith('file://')) return true;
  const pathname = url.split('?')[0].split('#')[0];
  return FILE_PATTERNS.some(p => p.test(pathname));
}

async function getWindowInfo(w) {
  const tabs = await chrome.tabs.query({ windowId: w.id });
  const active = tabs.find(t => t.active) || tabs[0];
  return {
    id: w.id,
    title: active?.title || 'Untitled',
    url: active?.url || '',
    isFile: isFileWindow(active?.url || ''),
  };
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

let infos = [];
let myId = null;

async function refresh() {
  const cur = await chrome.windows.getCurrent();
  myId = cur.id;
  const raw = await chrome.windows.getAll();
  const wins = raw.filter(w => w.type === 'normal');

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
        return `<div class="window-item ${mine ? 'current' : ''}">
          <span class="window-dot ${dot}"></span>
          <span class="window-title">${esc(w.title)}</span>
          ${badge}
        </div>`;
      }).join('');
}

async function close(filter) {
  const targets = infos.filter(w => w.id !== myId && filter(w));
  const n = targets.length;
  const btn = filter.filesOnly ? closeFilesBtn : closeAllBtn;

  btn.querySelector('.btn-label').textContent = `Closing ${n}...`;
  btn.classList.add('closing-pulse');
  btn.disabled = true;

  for (const w of targets) {
    try { await chrome.windows.remove(w.id); } catch {}
  }

  btn.classList.remove('closing-pulse');
  btn.classList.add('done');
  btn.querySelector('.btn-num').textContent = '✓';
  btn.querySelector('.btn-sub').textContent = '';
  btn.querySelector('.btn-label').textContent = `Closed ${n}`;

  await refresh();
  if (infos.filter(w => w.id !== myId).length === 0) {
    setTimeout(() => window.close(), 700);
  }
}

const fileFilter = Object.assign(w => w.isFile, { filesOnly: true });
const allFilter = Object.assign(() => true, { filesOnly: false });

closeFilesBtn.addEventListener('click', () => close(fileFilter));
closeAllBtn.addEventListener('click', () => close(allFilter));

refresh();
