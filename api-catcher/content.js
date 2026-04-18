(function() {
  'use strict';

  let isRecording = false;
  let filterList = [];
  let isHookInjected = false;

  /**
   * 获取扩展的chrome-extension:// URL
   * 用于加载hook.js文件
   */
  function getExtensionUrl(path) {
    return chrome.runtime.getURL(path);
  }

  /**
   * 注入Hook脚本到页面上下文
   * 通过创建script标签加载外部脚本文件，遵守CSP策略
   */
  function injectHookScript() {
    if (isHookInjected) {
      console.log('[API Catcher] Hook already injected, skipping...');
      return;
    }

    // 检查是否已存在hook脚本
    if (document.querySelector('script[data-api-catcher="true"]')) {
      console.log('[API Catcher] Hook script already exists in page');
      isHookInjected = true;
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-api-catcher', 'true');
    // 使用chrome-extension://协议加载外部脚本，遵守CSP
    script.src = getExtensionUrl('hook.js');
    
    script.onload = function() {
      console.log('[API Catcher] Hook script loaded successfully');
      isHookInjected = true;
      
      // 脚本加载完成后，发送当前状态到页面
      setTimeout(() => {
        window.postMessage({
          type: 'API_CATCHER_UPDATE_STATE',
          isRecording: isRecording,
          filterList: filterList
        }, '*');
      }, 100);
    };
    
    script.onerror = function(error) {
      console.error('[API Catcher] Failed to load hook script:', error);
    };

    // 将脚本添加到页面
    const parent = document.head || document.documentElement;
    if (parent) {
      parent.appendChild(script);
      console.log('[API Catcher] Content script loaded, injecting hook...');
    } else {
      console.error('[API Catcher] Failed to find parent element for script injection');
    }
  }

  /**
   * 从background script获取初始状态
   */
  function initFromBackground() {
    chrome.runtime.sendMessage({ type: 'GET_INITIAL_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[API Catcher] Failed to get initial state:', chrome.runtime.lastError);
        // 即使没有响应也注入hook，使用默认状态
        injectHookScript();
        return;
      }
      
      if (response) {
        isRecording = response.isRecording || false;
        filterList = response.filterList || [];
        console.log('[API Catcher] Got initial state:', { isRecording, filterList });
      }
      
      injectHookScript();
    });
  }

  /**
   * 监听来自background script的消息
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_RECORDING_STATE') {
      isRecording = request.isRecording;
      window.postMessage({
        type: 'API_CATCHER_UPDATE_STATE',
        isRecording: isRecording,
        filterList: filterList
      }, '*');
      sendResponse({ success: true });
    } else if (request.type === 'UPDATE_FILTER_LIST') {
      filterList = request.filterList || [];
      window.postMessage({
        type: 'API_CATCHER_UPDATE_STATE',
        isRecording: isRecording,
        filterList: filterList
      }, '*');
      sendResponse({ success: true });
    }
  });

  /**
   * 监听来自页面的消息（捕获的API数据）
   */
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'API_CATCHER_CAPTURED') {
      console.log('[API Catcher] Received captured data from page:', event.data.apiData.url);
      chrome.runtime.sendMessage({
        type: 'CAPTURED_API',
        data: event.data.apiData
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[API Catcher] Failed to send captured data:', chrome.runtime.lastError);
        }
      });
    }
  }, false);

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromBackground);
  } else {
    initFromBackground();
  }

})();
