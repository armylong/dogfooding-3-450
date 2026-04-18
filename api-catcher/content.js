(function() {
  'use strict';

  let isRecording = false;
  let filterList = [];

  function injectHookScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('hook.js');
    script.onload = function() {
      window.postMessage({
        type: 'API_CATCHER_UPDATE_STATE',
        isRecording: isRecording,
        filterList: filterList
      }, '*');
      console.log('[API Catcher] Hook script loaded!');
    };
    script.onerror = function() {
      console.error('[API Catcher] Failed to load hook script!');
    };
    (document.head || document.documentElement).appendChild(script);
  }

  chrome.runtime.sendMessage({ type: 'GET_INITIAL_STATE' }, (response) => {
    if (response) {
      isRecording = response.isRecording || false;
      filterList = response.filterList || [];
      injectHookScript();
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_RECORDING_STATE') {
      isRecording = request.isRecording;
      window.postMessage({
        type: 'API_CATCHER_UPDATE_STATE',
        isRecording: isRecording,
        filterList: filterList
      }, '*');
    } else if (request.type === 'UPDATE_FILTER_LIST') {
      filterList = request.filterList || [];
      window.postMessage({
        type: 'API_CATCHER_UPDATE_STATE',
        isRecording: isRecording,
        filterList: filterList
      }, '*');
    }
  });

  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'API_CATCHER_CAPTURED') {
      chrome.runtime.sendMessage({
        type: 'CAPTURED_API',
        data: event.data.apiData
      });
    }
  }, false);

  console.log('[API Catcher] Content script loaded!');
})();
