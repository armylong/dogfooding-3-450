/**
 * API Catcher Hook Script
 * 注入到页面上下文中，用于拦截XHR和Fetch请求
 * 此文件需要作为独立文件注入，以遵守CSP策略
 */

(function() {
  'use strict';

  // 避免重复注入
  if (window.__apiCatcherHookInstalled) {
    console.log('[API Catcher Hook] Already installed, skipping...');
    return;
  }
  window.__apiCatcherHookInstalled = true;

  // 状态变量
  let isRecording = false;
  let filterList = [];

  /**
   * 监听来自content script的状态更新消息
   */
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'API_CATCHER_UPDATE_STATE') {
      isRecording = event.data.isRecording;
      filterList = event.data.filterList || [];
      console.log('[API Catcher Hook] State updated:', { isRecording, filterList });
    }
  }, false);

  /**
   * 判断是否应该捕获该URL的请求
   * @param {string} url - 请求URL
   * @returns {boolean} - 是否应该捕获
   */
  function shouldCapture(url) {
    if (!isRecording) {
      return false;
    }
    if (!url) return false;
    
    // 过滤掉扩展自身的请求
    if (url.includes('chrome-extension://')) return false;
    
    // 如果没有设置筛选条件，捕获所有请求
    if (filterList.length === 0) return true;
    
    // 检查URL是否包含任一筛选关键词
    return filterList.some(keyword => 
      url.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 生成唯一ID
   */
  function generateId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 解析URL参数
   */
  function parseUrlParams(url) {
    const params = {};
    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch (e) {
      console.error('[API Catcher Hook] Failed to parse URL params:', e);
    }
    return params;
  }

  /**
   * 解析响应头
   */
  function parseHeaders(xhr) {
    const headers = {};
    try {
      const headerStr = xhr.getAllResponseHeaders();
      if (headerStr) {
        headerStr.trim().split(/[\r\n]+/).forEach(line => {
          const parts = line.split(': ');
          if (parts.length >= 2) {
            headers[parts[0]] = parts.slice(1).join(': ');
          }
        });
      }
    } catch (e) {
      console.error('[API Catcher Hook] Failed to parse headers:', e);
    }
    return headers;
  }

  /**
   * 安全解析JSON
   */
  function safeParseJson(str) {
    if (str === null || str === undefined) return null;
    if (typeof str !== 'string') return str;
    if (str.trim() === '') return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  /**
   * 发送捕获的数据到content script
   */
  function sendCapturedData(apiData) {
    console.log('[API Catcher Hook] Captured API:', apiData.url);
    window.postMessage({
      type: 'API_CATCHER_CAPTURED',
      apiData: apiData
    }, '*');
  }

  // ==================== XHR Hook ====================
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  /**
   * Hook XMLHttpRequest.open
   */
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;
    this._startTime = Date.now();
    this._requestHeaders = {};
    this._requestBody = null;
    return originalOpen.apply(this, [method, url, ...args]);
  };

  /**
   * Hook XMLHttpRequest.setRequestHeader
   */
  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    if (!this._requestHeaders) {
      this._requestHeaders = {};
    }
    this._requestHeaders[header] = value;
    return originalSetRequestHeader.apply(this, arguments);
  };

  /**
   * Hook XMLHttpRequest.send
   */
  XMLHttpRequest.prototype.send = function(body) {
    const url = this._url || '';
    
    // 保存请求体供后续使用
    this._requestBody = body;
    
    // 如果不应该捕获，直接发送请求
    if (!shouldCapture(url)) {
      return originalSend.apply(this, arguments);
    }

    const startTime = this._startTime || Date.now();
    const method = this._method || 'GET';
    const requestBody = body;

    const xhr = this;
    
    const onLoad = function() {
      const duration = Date.now() - startTime;
      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        request_headers: xhr._requestHeaders || {},
        response_headers: parseHeaders(xhr),
        params: parseUrlParams(url),
        request_body: safeParseJson(requestBody),
        response_body: safeParseJson(xhr.responseText),
        status: xhr.status,
        capture_time: Date.now(),
        duration: duration
      };
      sendCapturedData(apiData);
    };

    const onError = function() {
      const duration = Date.now() - startTime;
      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        request_headers: xhr._requestHeaders || {},
        response_headers: {},
        params: parseUrlParams(url),
        request_body: safeParseJson(requestBody),
        response_body: null,
        status: 0,
        capture_time: Date.now(),
        duration: duration
      };
      sendCapturedData(apiData);
    };

    const onAbort = function() {
      const duration = Date.now() - startTime;
      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        request_headers: xhr._requestHeaders || {},
        response_headers: {},
        params: parseUrlParams(url),
        request_body: safeParseJson(requestBody),
        response_body: null,
        status: -1,
        capture_time: Date.now(),
        duration: duration
      };
      sendCapturedData(apiData);
    };

    // 添加事件监听器
    this.addEventListener('load', onLoad);
    this.addEventListener('error', onError);
    this.addEventListener('abort', onAbort);

    return originalSend.apply(this, arguments);
  };

  // ==================== Fetch Hook ====================
  const originalFetch = window.fetch;
  
  /**
   * Hook window.fetch
   */
  window.fetch = function(...args) {
    const input = args[0];
    const options = args[1] || {};
    
    // 获取URL
    let url;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = String(input);
    }
    
    const method = options.method || (input instanceof Request ? input.method : 'GET') || 'GET';

    // 如果不应该捕获，直接发送请求
    if (!shouldCapture(url)) {
      return originalFetch.apply(this, args);
    }

    const startTime = Date.now();

    return originalFetch.apply(this, args).then(async (response) => {
      // 克隆响应以便读取body
      const clonedResponse = response.clone();
      const duration = Date.now() - startTime;
      
      // 读取响应体
      let responseBody = null;
      try {
        const contentType = clonedResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          responseBody = await clonedResponse.json();
        } else {
          const text = await clonedResponse.text();
          responseBody = text.length > 0 ? text : null;
        }
      } catch (e) {
        console.error('[API Catcher Hook] Failed to read response body:', e);
        responseBody = null;
      }

      // 提取响应头
      const headers = {};
      try {
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } catch (e) {
        console.error('[API Catcher Hook] Failed to extract headers:', e);
      }

      // 处理请求体
      let requestBody = options.body;
      if (requestBody && typeof requestBody === 'string') {
        requestBody = safeParseJson(requestBody);
      } else if (input instanceof Request && input.body) {
        try {
          const clonedRequest = input.clone();
          const bodyText = await clonedRequest.text();
          requestBody = safeParseJson(bodyText);
        } catch (e) {
          requestBody = null;
        }
      }

      // 提取请求头
      const requestHeaders = {};
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((value, key) => {
            requestHeaders[key] = value;
          });
        } else if (typeof options.headers === 'object') {
          Object.assign(requestHeaders, options.headers);
        }
      } else if (input instanceof Request && input.headers) {
        input.headers.forEach((value, key) => {
          requestHeaders[key] = value;
        });
      }

      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        request_headers: requestHeaders,
        response_headers: headers,
        params: parseUrlParams(url),
        request_body: requestBody || null,
        response_body: responseBody,
        status: response.status,
        capture_time: Date.now(),
        duration: duration
      };
      sendCapturedData(apiData);

      return response;
    }).catch((error) => {
      const duration = Date.now() - startTime;
      
      // 提取请求头
      const requestHeaders = {};
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((value, key) => {
            requestHeaders[key] = value;
          });
        } else if (typeof options.headers === 'object') {
          Object.assign(requestHeaders, options.headers);
        }
      }

      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        request_headers: requestHeaders,
        response_headers: {},
        params: parseUrlParams(url),
        request_body: options.body ? safeParseJson(options.body) : null,
        response_body: null,
        status: 0,
        capture_time: Date.now(),
        duration: duration
      };
      sendCapturedData(apiData);
      
      throw error;
    });
  };

  console.log('[API Catcher] Hook injected successfully!');
})();
