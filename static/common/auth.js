const Auth = {
    getToken() {
        return localStorage.getItem('auth_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    },

    clearToken() {
        localStorage.removeItem('auth_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    fetchWithAuth(url, options = {}) {
        const headers = options.headers || {};
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = token;
        }
        return fetch(url, { ...options, headers, credentials: 'include' });
    },

    async fetchApi(baseUrl, action, params = {}, options = {}) {
        const url = `${baseUrl}/${action}`;
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(params),
            ...options
        };

        const response = await this.fetchWithAuth(url, fetchOptions);
        const result = await response.json();

        if (result.errorCode !== 0) {
            throw new Error(result.errorMsg || '请求失败');
        }

        return result.responseData;
    },

    async getUserInfo() {
        if (!this.getToken()) {
            return null;
        }
        try {
            const result = await this.fetchApi('http://localhost/index', 'desktopOs', {});
            return result.user;
        } catch (e) {
            return null;
        }
    }
};
