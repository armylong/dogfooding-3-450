(function() {
  'use strict';

  let isRecording = false;
  let filterList = [];

  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'API_CATCHER_UPDATE_STATE') {
      isRecording = event.data.isRecording;
      filterList = event.data.filterList || [];
    }
  }, false);

  function shouldCapture(url) {
    if (!isRecording) return false;
    if (!url) return false;
    if (filterList.length === 0) return true;
    return filterList.some(keyword => url.toLowerCase().includes(keyword.toLowerCase()));
  }

  function generateId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function parseUrlParams(url) {
    const params = {};
    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch (e) {}
    return params;
  }

  function parseHeaders(xhr) {
    const headers = {};
    try {
      const headerStr = xhr.getAllResponseHeaders();
      if (headerStr) {
        headerStr.trim().split(/[\r\n]+/).forEach(line => {
          const parts = line.split(': ');
          if (parts.length === 2) {
            headers[parts[0]] = parts[1];
          }
        });
      }
    } catch (e) {}
    return headers;
  }

  function safeParseJson(str) {
    if (typeof str !== 'string') return str;
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  function sendCapturedData(apiData) {
    window.postMessage({
      type: 'API_CATCHER_CAPTURED',
      apiData: apiData
    }, '*');
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._apiCatcherUrl = url;
    this._apiCatcherMethod = method;
    this._apiCatcherStartTime = Date.now();
    this._apiCatcherRequestHeaders = {};
    return originalOpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    this._apiCatcherRequestHeaders[header] = value;
    return originalSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const url = this._apiCatcherUrl || '';
    
    if (!shouldCapture(url)) {
      return originalSend.apply(this, arguments);
    }

    const startTime = this._apiCatcherStartTime || Date.now();
    const method = this._apiCatcherMethod || 'GET';

    this.addEventListener('load', function() {
      const duration = Date.now() - startTime;
      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        headers: parseHeaders(this),
        params: parseUrlParams(url),
        request_body: safeParseJson(body),
        response_body: safeParseJson(this.responseText),
        status: this.status,
        capture_time: Date.now(),
        duration: duration
      };
      sendCapturedData(apiData);
    });

    this.addEventListener('error', function() {
      const duration = Date.now() - startTime;
      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        headers: {},
        params: parseUrlParams(url),
        request_body: safeParseJson(body),
        response_body: null,
        status: 0,
        capture_time: Date.now(),
        duration: duration
      };
      sendCapturedData(apiData);
    });

    return originalSend.apply(this, arguments);
  };

  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const input = args[0];
    const url = typeof input === 'string' ? input : input.url;
    const options = args[1] || {};
    const method = options.method || 'GET';

    if (!shouldCapture(url)) {
      return originalFetch.apply(this, args);
    }

    const startTime = Date.now();

    return originalFetch.apply(this, args).then(async (response) => {
      const clonedResponse = response.clone();
      const duration = Date.now() - startTime;
      
      let responseBody = null;
      try {
        const contentType = clonedResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          responseBody = await clonedResponse.json();
        } else {
          responseBody = await clonedResponse.text();
        }
      } catch (e) {
        responseBody = null;
      }

      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let requestBody = options.body;
      if (requestBody && typeof requestBody === 'string') {
        requestBody = safeParseJson(requestBody);
      }

      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        headers: headers,
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
      const apiData = {
        id: generateId(),
        url: url,
        method: method.toUpperCase(),
        headers: {},
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
