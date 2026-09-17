

(function() {
  'use strict';

  window.__kimtim_BINLIBRARY_LOADED = true;

  var K = window.KimtimKeys || {};

  let binLibrary = [];
  let currentFilter = 'all';

  function getUserId() {
    return localStorage.getItem(K.USER_ID) || null;
  }

  function getUserName() {
    return localStorage.getItem(K.FIRST_NAME) || 'Unknown';
  }

  function sendToBackground(payload) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2);
      const handler = (event) => {
        if (event.data && event.data.type === "kimtim_FROM_BACKGROUND" && event.data.requestId === requestId) {
          window.removeEventListener("message", handler);
          resolve(event.data.response);
        }
      };
      window.addEventListener("message", handler);
      window.postMessage({ type: "kimtim_TO_BACKGROUND", requestId, payload }, "*");
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("Background request timeout"));
      }, 30000);
    });
  }

  async function fetchBinLibrary() {
    try {
      const userId = getUserId();
      const result = await sendToBackground({
        type: "API_REQUEST",
        endpoint: "bin-library",
        payload: { user_id: userId, _method: "GET" }
      });

      if (result && result.success && result.bins) {
        binLibrary = result.bins;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function getFilteredBins() {
    const bins = binLibrary || [];
    if (currentFilter === 'top') {

      return [...bins].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return [...bins].sort((a, b) => {
      const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
      const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  function setupFilterButtons(showWarningFn, restoreDashboardFn) {
    const allBtn = document.getElementById('binFilterAll');
    const topBtn = document.getElementById('binFilterTop');

    if (allBtn) {
      allBtn.addEventListener('click', () => {
        currentFilter = 'all';
        allBtn.classList.add('active');
        if (topBtn) topBtn.classList.remove('active');
        renderBinLibraryGrid(showWarningFn, restoreDashboardFn);
      });
    }

    if (topBtn) {
      topBtn.addEventListener('click', () => {
        currentFilter = 'top';
        topBtn.classList.add('active');
        if (allBtn) allBtn.classList.remove('active');
        renderBinLibraryGrid(showWarningFn, restoreDashboardFn);
      });
    }
  }

  function renderBinLibraryGrid(showWarningFn, restoreDashboardFn) {
    const grid = document.getElementById("binLibraryGrid");
    if (!grid) return;

    setupFilterButtons(showWarningFn, restoreDashboardFn);

    const currentBins = getFilteredBins();

    if (currentBins.length === 0) {
      grid.innerHTML = '<div class="bin-library-empty">No BINs in library<br><span class="bin-library-empty-sub">Owner can add via Telegram bot</span></div>';
      return;
    }

    grid.innerHTML = currentBins.map((item, index) => {
      const userVote = item.user_vote || null;
      const likeClass = userVote === 'like' ? 'voted' : '';
      const dislikeClass = userVote === 'dislike' ? 'voted' : '';

      let uploadDate = 'N/A';
      if (item.added_at) {
        const dateObj = new Date(item.added_at);
        if (!isNaN(dateObj)) {
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = String(dateObj.getFullYear()).slice(-2);
          let hours = dateObj.getHours();
          const ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12 || 12;
          const mins = String(dateObj.getMinutes()).padStart(2, '0');
          uploadDate = `${day}|${month}|${year} - ${hours}:${mins}${ampm}`;
        }
      }

      let creditName = item.credit || 'N/A';
      if (creditName.startsWith('@')) {
        creditName = creditName.substring(1);
      }

      return `
      <div class="bin-library-card" data-index="${index}" data-id="${item.id}" data-bin="${item.bin}">
        <div class="bin-card-box">
          <div class="bin-info-row">
            <span class="bin-info-label">SITE:</span>
            <span class="bin-info-value site">${item.site || 'N/A'}</span>
          </div>
          <div class="bin-info-row">
            <span class="bin-info-label">BIN:</span>
            <span class="bin-info-value bin">${item.bin || 'N/A'}</span>
          </div>
          <div class="bin-info-row">
            <span class="bin-info-label">CREDIT:</span>
            <span class="bin-info-value type">@${creditName}</span>
          </div>
        </div>
        <div class="bin-card-footer">
          <div class="bin-upload-info">
            <span class="bin-upload-label">upload on</span>
            <span class="bin-upload-date">${uploadDate}</span>
          </div>
          <span class="bin-footer-separator">|</span>
          <div class="bin-footer-btns">
            <button class="bin-fb-btn like ${likeClass}" data-id="${item.id}" data-action="like" data-index="${index}">
              👍 <span class="fb-count">${item.likes || 0}</span>
            </button>
            <button class="bin-fb-btn dislike ${dislikeClass}" data-id="${item.id}" data-action="dislike" data-index="${index}">
              👎 <span class="fb-count">${item.dislikes || 0}</span>
            </button>
          </div>
        </div>
      </div>
    `}).join('');

    grid.querySelectorAll('.bin-fb-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const vote = btn.dataset.action;
        const id = btn.dataset.id;
        const index = parseInt(btn.dataset.index);
        const userId = getUserId();
        const userName = getUserName();

        if (!userId) {
          if (showWarningFn) showWarningFn('❌ Please login first to vote', 'error');
          return;
        }

        const card = btn.closest('.bin-library-card');
        const likeBtn = card.querySelector('.bin-fb-btn.like');
        const dislikeBtn = card.querySelector('.bin-fb-btn.dislike');

        btn.style.transform = 'scale(1.1)';
        setTimeout(() => { btn.style.transform = ''; }, 150);

        try {
          const result = await sendToBackground({
            type: "API_REQUEST",
            endpoint: "bin-feedback",
            payload: {
              id: id,
              vote: vote,
              user_id: userId,
              user_name: userName,
              _method: 'POST'
            }
          });

          if (result && result.success) {

            likeBtn.querySelector('.fb-count').textContent = result.likes;
            dislikeBtn.querySelector('.fb-count').textContent = result.dislikes;

            likeBtn.classList.remove('voted');
            dislikeBtn.classList.remove('voted');

            if (result.user_vote === 'like') {
              likeBtn.classList.add('voted');
            } else if (result.user_vote === 'dislike') {
              dislikeBtn.classList.add('voted');
            }

            if (binLibrary[index]) {
              binLibrary[index].likes = result.likes;
              binLibrary[index].dislikes = result.dislikes;
              binLibrary[index].user_vote = result.user_vote;
            }
          }
        } catch (err) {
        }
      });
    });
  }

  function createBinLibraryModal() {
    const modal = document.createElement("div");
    modal.className = "cc-modal hidden";
    modal.id = "binLibraryModal";
    modal.innerHTML = `
    <div class="cc-modal-content bin-library-modal">
      <div class="cc-modal-header">
        <span>📚 BIN Library</span>
        <button class="cc-modal-close" id="binLibraryCloseBtn">×</button>
      </div>
      <div class="cc-modal-body" id="binLibraryBody">
        <div class="bin-library-grid" id="binLibraryGrid">
          <div class="bin-library-empty">Loading...</div>
        </div>
      </div>
    </div>
    `;
    return modal;
  }

  async function openBinLibraryModal(showWarningFn, restoreDashboardFn) {
    const modal = document.getElementById("binLibraryModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.classList.add("show");

    const grid = document.getElementById("binLibraryGrid");
    if (grid) {
      grid.innerHTML = '<div class="bin-library-empty">Loading BIN Library...</div>';
    }

    let success = await fetchBinLibrary();
    if (!success || binLibrary.length === 0) {
      await new Promise(r => setTimeout(r, 500));
      await fetchBinLibrary();
    }

    renderBinLibraryGrid(showWarningFn, restoreDashboardFn);
  }

  function closeBinLibraryModal() {
    const modal = document.getElementById("binLibraryModal");
    if (modal) {
      modal.classList.remove("show");
      modal.classList.add("hidden");
    }
  }

  window.kimtimBinLibrary = {

    get bins() { return binLibrary; },

    fetchBinLibrary,
    renderBinLibraryGrid,
    createBinLibraryModal,
    openBinLibraryModal,
    closeBinLibraryModal,
    getUserId,
    getUserName
  };

})();






