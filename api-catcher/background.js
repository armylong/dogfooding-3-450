(function() {
  'use strict';

  const tabDataMap = new Map();
  let isRecording = false;
  let filterList = [];
  let serverConnected = true;

  const UPLOAD_URL = 'http://localhost/api_catcher/upload';

  function loadStoredSettings() {
    chrome.storage.local.get(['isRecording', 'filterList'], (result) => {
      isRecording = result.isRecording || false;
      filterList = result.filterList || [];
    });
  }

  function saveRecordingState() {
    chrome.storage.local.set({ isRecording });
  }

  function saveFilterList() {
    chrome.storage.local.set({ filterList });
  }

  function getTabApiList(tabId) {
    if (!tabDataMap.has(tabId)) {
      tabDataMap.set(tabId, []);
    }
    return tabDataMap.get(tabId);
  }

  function broadcastRecordingState() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'UPDATE_RECORDING_STATE',
          isRecording: isRecording
        }).catch(() => {});
      });
    });
  }

  function broadcastFilterList() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'UPDATE_FILTER_LIST',
          filterList: filterList
        }).catch(() => {});
      });
    });
  }

  async function uploadApiData(apiData) {
    try {
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter_list: filterList,
          api_data: apiData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      serverConnected = true;
      return true;
    } catch (error) {
      serverConnected = false;
      return false;
    }
  }

  function handleCapturedApi(apiData, sender) {
    if (!isRecording) return;
    if (!sender.tab) return;

    const tabId = sender.tab.id;
    const apiList = getTabApiList(tabId);
    
    apiList.unshift(apiData);

    uploadApiData(apiData);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
      case 'GET_INITIAL_STATE':
        sendResponse({
          isRecording: isRecording,
          filterList: filterList
        });
        break;

      case 'CAPTURED_API':
        handleCapturedApi(request.data, sender);
        break;

      case 'TOGGLE_RECORDING':
        isRecording = request.isRecording;
        saveRecordingState();
        broadcastRecordingState();
        sendResponse({ success: true });
        break;

      case 'UPDATE_FILTER_LIST':
        filterList = request.filterList || [];
        saveFilterList();
        broadcastFilterList();
        sendResponse({ success: true });
        break;

      case 'GET_FILTER_LIST':
        sendResponse({ filterList: filterList });
        break;

      case 'GET_RECORDING_STATE':
        sendResponse({ isRecording: isRecording });
        break;

      case 'GET_API_LIST':
        const tabId = request.tabId;
        sendResponse({ 
          apiList: getTabApiList(tabId),
          serverConnected: serverConnected
        });
        break;

      case 'CLEAR_API_LIST':
        const clearTabId = request.tabId;
        if (tabDataMap.has(clearTabId)) {
          tabDataMap.set(clearTabId, []);
        }
        sendResponse({ success: true });
        break;
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    tabDataMap.delete(tabId);
  });

  loadStoredSettings();

})();
