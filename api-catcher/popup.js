(function() {
  'use strict';

  let currentTabId = null;
  let filterList = [];

  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const serverStatus = document.getElementById('serverStatus');
  const recordingSwitch = document.getElementById('recordingSwitch');
  const filterListEl = document.getElementById('filterList');
  const addFilterBtn = document.getElementById('addFilterBtn');
  const apiListEl = document.getElementById('apiList');
  const apiCountEl = document.getElementById('apiCount');
  const clearBtn = document.getElementById('clearBtn');

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  function getMethodClass(method) {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    return validMethods.includes(method) ? method : 'GET';
  }

  function updateRecordingUI(isRecording) {
    if (isRecording) {
      statusBadge.classList.remove('stopped');
      statusBadge.classList.add('recording');
      statusText.textContent = '录制中';
    } else {
      statusBadge.classList.remove('recording');
      statusBadge.classList.add('stopped');
      statusText.textContent = '已停止';
    }
    recordingSwitch.checked = isRecording;
  }

  function updateServerStatusUI(connected) {
    if (connected) {
      serverStatus.classList.remove('disconnected');
      serverStatus.classList.add('connected');
      serverStatus.textContent = '✓ 服务器连接正常';
    } else {
      serverStatus.classList.remove('connected');
      serverStatus.classList.add('disconnected');
      serverStatus.textContent = '⚠ 上传接口未连通';
    }
  }

  function renderFilterList() {
    filterListEl.innerHTML = '';
    
    if (filterList.length === 0) {
      return;
    }

    filterList.forEach((keyword, index) => {
      const filterItem = document.createElement('div');
      filterItem.className = 'filter-item';
      filterItem.innerHTML = `
        <input type="text" class="filter-input" value="${keyword}" 
               placeholder="输入筛选关键词" data-index="${index}">
        <button class="delete-filter-btn" data-index="${index}">×</button>
      `;
      filterListEl.appendChild(filterItem);
    });

    document.querySelectorAll('.filter-input').forEach(input => {
      input.addEventListener('input', handleFilterInputChange);
      input.addEventListener('blur', saveFilterList);
    });

    document.querySelectorAll('.delete-filter-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteFilter);
    });
  }

  function handleFilterInputChange(e) {
    const index = parseInt(e.target.dataset.index);
    filterList[index] = e.target.value;
  }

  function handleDeleteFilter(e) {
    const index = parseInt(e.target.dataset.index);
    filterList.splice(index, 1);
    renderFilterList();
    saveFilterList();
  }

  function saveFilterList() {
    filterList = filterList.filter(k => k.trim() !== '');
    chrome.runtime.sendMessage({
      type: 'UPDATE_FILTER_LIST',
      filterList: filterList
    });
  }

  function addFilterItem() {
    filterList.push('');
    renderFilterList();
    const inputs = filterListEl.querySelectorAll('.filter-input');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  }

  function renderApiList(apiDataList, serverConnected) {
    updateServerStatusUI(serverConnected);
    apiCountEl.textContent = `共 ${apiDataList.length} 条`;

    if (apiDataList.length === 0) {
      apiListEl.innerHTML = '<div class="api-list-empty">暂无捕获的接口数据</div>';
      return;
    }

    apiListEl.innerHTML = '';

    apiDataList.forEach(api => {
      const apiItem = document.createElement('div');
      apiItem.className = 'api-item';

      const statusClass = api.status >= 200 && api.status < 400 ? 'success' : 'error';
      const methodClass = getMethodClass(api.method);

      apiItem.innerHTML = `
        <div class="api-item-header">
          <span class="api-method ${methodClass}">${api.method}</span>
          <span class="api-time">${formatTime(api.capture_time)}</span>
        </div>
        <div class="api-url">${api.url}</div>
        <span class="api-status ${statusClass}">${api.status || 'Failed'}</span>
      `;

      apiListEl.appendChild(apiItem);
    });
  }

  function loadApiList() {
    chrome.runtime.sendMessage({
      type: 'GET_API_LIST',
      tabId: currentTabId
    }, (response) => {
      if (response) {
        renderApiList(response.apiList || [], response.serverConnected);
      }
    });
  }

  function clearApiList() {
    chrome.runtime.sendMessage({
      type: 'CLEAR_API_LIST',
      tabId: currentTabId
    }, () => {
      loadApiList();
    });
  }

  function toggleRecording(e) {
    const isRecording = e.target.checked;
    updateRecordingUI(isRecording);
    chrome.runtime.sendMessage({
      type: 'TOGGLE_RECORDING',
      isRecording: isRecording
    });
  }

  function init() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        currentTabId = tabs[0].id;
      }
    });

    chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATE' }, (response) => {
      if (response) {
        updateRecordingUI(response.isRecording);
      }
    });

    chrome.runtime.sendMessage({ type: 'GET_FILTER_LIST' }, (response) => {
      if (response && response.filterList) {
        filterList = response.filterList;
        renderFilterList();
      }
    });

    loadApiList();

    recordingSwitch.addEventListener('change', toggleRecording);
    addFilterBtn.addEventListener('click', addFilterItem);
    clearBtn.addEventListener('click', clearApiList);

    setInterval(loadApiList, 1000);
  }

  init();

})();
