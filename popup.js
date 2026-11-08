const totalCountEl = document.getElementById('totalCount');
const filesCountEl = document.getElementById('filesCount');
const pagesCountEl = document.getElementById('pagesCount');
const filesCard = document.getElementById('filesCard');
const closeFilesBtn = document.getElementById('closeFilesBtn');
const closeAllBtn = document.getElementById('closeAllBtn');
const filesCloseCount = document.getElementById('filesCloseCount');
const allCloseCount = document.getElementById('allCloseCount');
const windowList = document.getElementById('windowList');

const FILE_PATTERNS = [
  /^file:\/\//,
  /\.(txt|md|js|ts|jsx|tsx|py|html|css|json|xml|csv|log|yml|yaml|toml|ini|cfg|conf|sh|bash|bat|ps1|rb|go|rs|java|c|cpp|h|hpp|cs|php|sql|r|swift|kt|scala|lua|pl|ex|exs|hs|ml|vue|svelte|astro|mdx|ipynb|env|gitignore|dockerfile|makefile)$/i,
  /\/[^\/]+\.[a-z]{1,5}$/,
];

function isFileWindow(url) {
  if (!url) return false;
  if (url.startsWith('file://')) return true;
  const pathname = url.split('?')[0].split('#')[0];
  return FILE_PATTERNS.some(p => p.test(pathname));
}

async function getWindowInfo(windowObj) {
  const tabs = await chrome.tabs.query({ windowId: windowObj.id });
  const activeTab = tabs.find(t => t.active) || tabs[0];
  const url = activeTab?.url || '';
  const isFile = isFileWindow(url);
  return {
    id: windowObj.id,
    title: activeTab?.title || 'Untitled Window',
    url,
    tabCount: tabs.length,
    type: windowObj.type,
    isFile,
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let windowInfos = [];
let currentWindowId = null;

async function updateUI() {
  const currentWindow = await chrome.windows.getCurrent();
  currentWindowId = currentWindow.id;
  const allWindowsRaw = await chrome.windows.getAll();
  const allWindows = allWindowsRaw.filter(w => w.type === 'normal');

  windowInfos = await Promise.all(allWindows.map(w => getWindowInfo(w)));
  windowInfos.sort((a, b) => (a.id === currentWindowId ? -1 : b.id === currentWindowId ? 1 : 0));

  const others = windowInfos.filter(w => w.id !== currentWindowId);
  const fileWindows = others.filter(w => w.isFile);
  const pageWindows = others.filter(w => !w.isFile);

  totalCountEl.textContent = allWindows.length;
  filesCountEl.textContent = fileWindows.length;
  pagesCountEl.textContent = pageWindows.length;
  filesCloseCount.textContent = fileWindows.length;
  allCloseCount.textContent = others.length;

  if (fileWindows.length === 0) {
    filesCard.classList.add('zero');
    closeFilesBtn.disabled = true;
    closeFilesBtn.style.opacity = '0.4';
  }

  if (others.length === 0) {
    closeAllBtn.disabled = true;
    closeAllBtn.style.opacity = '0.4';
  }

  if (windowInfos.length === 0) {
    windowList.innerHTML = '<div class="empty-state">No windows found</div>';
  } else {
    windowList.innerHTML = windowInfos.map(w => {
      const isCurrent = w.id === currentWindowId;
      const dotClass = isCurrent ? '' : w.isFile ? 'file' : 'page';
      let badge = '';
      if (isCurrent) {
        badge = '<span class="window-badge">KEEP</span>';
      } else if (w.isFile) {
        badge = '<span class="window-badge file-badge">FILE</span>';
      } else {
        badge = '<span class="window-badge page-badge">PAGE</span>';
      }
      return `
        <div class="window-item ${isCurrent ? 'current' : ''}">
          <span class="window-dot ${dotClass}"></span>
          <span class="window-title">${escapeHtml(w.title)}</span>
          ${badge}
        </div>
      `;
    }).join('');
  }
}

async function closeWindows(filter) {
  const toClose = windowInfos.filter(w => w.id !== currentWindowId && filter(w));
  const count = toClose.length;
  const btn = filter === isFileFilter ? closeFilesBtn : closeAllBtn;

  btn.innerHTML = `<span class="closing-pulse">⏳</span> Closing ${count}...`;
  btn.disabled = true;

  for (const w of toClose) {
    try { await chrome.windows.remove(w.id); } catch (e) {}
  }

  btn.classList.add('done');
  btn.innerHTML = `✓ Closed ${count} window${count !== 1 ? 's' : ''}`;

  await updateUI();
  if (windowInfos.filter(w => w.id !== currentWindowId).length === 0) {
    setTimeout(() => window.close(), 800);
  }
}

const isFileFilter = w => w.isFile;
const allFilter = () => true;

closeFilesBtn.addEventListener('click', () => closeWindows(isFileFilter));
closeAllBtn.addEventListener('click', () => closeWindows(allFilter));

updateUI();
