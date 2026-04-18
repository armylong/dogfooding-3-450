(function() {
  'use strict';

  // 存储每个标签页捕获的API数据
  const tabDataMap = new Map();
  
  // 全局状态
  let isRecording = false;
  let filterList = [];
  let serverConnected = true;

  // 数据上传接口地址
  const UPLOAD_URL = 'http://localhost/api_catcher/upload';

  /**
   * 从存储中加载设置
   */
  function loadStoredSettings() {
    chrome.storage.local.get(['isRecording', 'filterList'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('[API Catcher BG] Failed to load settings:', chrome.runtime.lastError);
        return;
      }
      isRecording = result.isRecording || false;
      filterList = result.filterList || [];
      console.log('[API Catcher BG] Settings loaded:', { isRecording, filterList });
    });
  }

  /**
   * 保存录制状态到存储
   */
  function saveRecordingState() {
    chrome.storage.local.set({ isRecording }, () => {
      if (chrome.runtime.lastError) {
        console.error('[API Catcher BG] Failed to save recording state:', chrome.runtime.lastError);
      }
    });
  }

  /**
   * 保存筛选列表到存储
   */
  function saveFilterList() {
    chrome.storage.local.set({ filterList }, () => {
      if (chrome.runtime.lastError) {
        console.error('[API Catcher BG] Failed to save filter list:', chrome.runtime.lastError);
      }
    });
  }

  /**
   * 获取指定标签页的API列表
   * @param {number} tabId - 标签页ID
   * @returns {Array} - API数据列表
   */
  function getTabApiList(tabId) {
    if (!tabDataMap.has(tabId)) {
      tabDataMap.set(tabId, []);
    }
    return tabDataMap.get(tabId);
  }

  /**
   * 广播录制状态到所有标签页
   */
  function broadcastRecordingState() {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('[API Catcher BG] Failed to query tabs:', chrome.runtime.lastError);
        return;
      }
      
      tabs.forEach(tab => {
        // 跳过chrome://和chrome-extension://页面
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
          return;
        }
        
        chrome.tabs.sendMessage(tab.id, {
          type: 'UPDATE_RECORDING_STATE',
          isRecording: isRecording
        }).catch((err) => {
          // 忽略无法发送消息的错误（页面可能还没有content script）
          console.log(`[API Catcher BG] Could not send to tab ${tab.id}:`, err.message);
        });
      });
    });
  }

  /**
   * 广播筛选列表到所有标签页
   */
  function broadcastFilterList() {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('[API Catcher BG] Failed to query tabs:', chrome.runtime.lastError);
        return;
      }
      
      tabs.forEach(tab => {
        // 跳过chrome://和chrome-extension://页面
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
          return;
        }
        
        chrome.tabs.sendMessage(tab.id, {
          type: 'UPDATE_FILTER_LIST',
          filterList: filterList
        }).catch((err) => {
          console.log(`[API Catcher BG] Could not send filter list to tab ${tab.id}:`, err.message);
        });
      });
    });
  }

  /**
   * 上传API数据到服务器
   * @param {Object} apiData - API数据
   * @returns {Promise<boolean>} - 是否上传成功
   */
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
      console.error('[API Catcher BG] Failed to upload data:', error);
      serverConnected = false;
      return false;
    }
  }

  /**
   * 处理捕获到的API数据
   * @param {Object} apiData - API数据
   * @param {Object} sender - 消息发送者信息
   */
  function handleCapturedApi(apiData, sender) {
    if (!isRecording) {
      console.log('[API Catcher BG] Recording is off, ignoring captured API');
      return;
    }
    if (!sender.tab) {
      console.log('[API Catcher BG] No tab info, ignoring captured API');
      return;
    }

    const tabId = sender.tab.id;
    const apiList = getTabApiList(tabId);
    
    // 将新数据添加到列表开头
    apiList.unshift(apiData);
    
    console.log('[API Catcher BG] Captured API:', apiData.url, 'for tab:', tabId);

    // 异步上传到服务器
    uploadApiData(apiData);
  }

  /**
   * 处理来自content script和popup的消息
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[API Catcher BG] Received message:', request.type);
    
    switch (request.type) {
      case 'GET_INITIAL_STATE':
        // Content script请求初始状态
        sendResponse({
          isRecording: isRecording,
          filterList: filterList
        });
        break;

      case 'CAPTURED_API':
        // 收到捕获的API数据
        handleCapturedApi(request.data, sender);
        sendResponse({ success: true });
        break;

      case 'TOGGLE_RECORDING':
        // 切换录制状态
        isRecording = request.isRecording;
        saveRecordingState();
        broadcastRecordingState();
        sendResponse({ success: true, isRecording: isRecording });
        break;

      case 'UPDATE_FILTER_LIST':
        // 更新筛选列表
        filterList = request.filterList || [];
        saveFilterList();
        broadcastFilterList();
        sendResponse({ success: true });
        break;

      case 'GET_FILTER_LIST':
        // 获取筛选列表
        sendResponse({ filterList: filterList });
        break;

      case 'GET_RECORDING_STATE':
        // 获取录制状态
        sendResponse({ isRecording: isRecording });
        break;

      case 'GET_API_LIST':
        // 获取指定标签页的API列表
        const tabId = request.tabId;
        sendResponse({ 
          apiList: getTabApiList(tabId),
          serverConnected: serverConnected
        });
        break;

      case 'CLEAR_API_LIST':
        // 清空指定标签页的API列表
        const clearTabId = request.tabId;
        if (tabDataMap.has(clearTabId)) {
          tabDataMap.set(clearTabId, []);
        }
        sendResponse({ success: true });
        break;
        
      default:
        console.log('[API Catcher BG] Unknown message type:', request.type);
        sendResponse({ error: 'Unknown message type' });
    }
    
    // 返回true表示会异步发送响应
    return true;
  });

  /**
   * 监听标签页关闭事件，清理对应数据
   */
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabDataMap.has(tabId)) {
      tabDataMap.delete(tabId);
      console.log('[API Catcher BG] Cleaned up data for closed tab:', tabId);
    }
  });

  /**
   * 监听新标签页加载完成，发送当前状态
   */
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // 跳过chrome://和chrome-extension://页面
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
      }
      
      // 延迟发送，确保content script已加载
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          type: 'UPDATE_RECORDING_STATE',
          isRecording: isRecording
        }).catch(() => {});
        
        chrome.tabs.sendMessage(tabId, {
          type: 'UPDATE_FILTER_LIST',
          filterList: filterList
        }).catch(() => {});
      }, 500);
    }
  });

  // 初始化：加载存储的设置
  loadStoredSettings();
  
  console.log('[API Catcher BG] Background script initialized');

})();
