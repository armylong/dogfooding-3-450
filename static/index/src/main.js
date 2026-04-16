const APPS = [
    { name: 'gomoku', label: '五子棋', icon: '⚫', about: '经典黑白对弈，五子连珠获胜', url: 'gomoku/index.html' },
    { name: 'chinese-chess', label: '中国象棋', icon: '♔', about: '楚河汉界，红黑对弈', url: 'chinese-chess/index.html' },
    { name: 'go', label: '围棋', icon: '◯', about: '黑白之道，纵横十九路', url: 'go/index.html' },
    { name: 'doudizhu', label: '斗地主', icon: '🃏', about: '经典扑克游戏，叫地主、炸牌、火箭', url: 'doudizhu/index.html' },
    { name: 'gouji', label: '够级', icon: '🎴', about: '山东特色扑克，6人3对3团队对抗', url: 'gouji/index.html' },
    { name: 'baohuang', label: '保皇', icon: '👑', about: '山东特色扑克，皇帝+保皇派 vs 平民', url: 'baohuang/index.html' },
    { name: 'snake', label: '贪吃蛇', icon: '🐍', about: '经典小游戏，控制蛇吃食物不断成长', url: 'snake/index.html' },
    { name: 'tetris', label: '俄罗斯方块', icon: '🧱', about: '经典益智游戏，旋转消除方块得分', url: 'tetris/index.html' },
    { name: 'yangfen', label: '氧分管理', icon: '💨', about: '氧分充值、消费、转账、查询', url: 'yangfen/index.html' },
    { name: 'sqlite-manager', label: 'SQLite管理', icon: '🗃️', about: '数据库表结构查看、数据浏览', url: 'sqlite-manager/index.html' }
];

const APP_MAP = {};
APPS.forEach(app => APP_MAP[app.name] = app);

let state = {
    uid: null,
    user: null,
    token: null,
    desktopApps: [],
    dockApps: [],
    selectedIcon: null,
    dragData: null,
    loginTab: 'login',
    loginError: ''
};

function fetchWithAuth(url, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
        headers['Authorization'] = state.token;
    }
    return fetch(url, { ...options, headers });
}

async function init() {
    loadTokenFromStorage();
    await loadDesktopOs();
    render();
    bindEvents();
    startClock();
}

function loadTokenFromStorage() {
    state.token = localStorage.getItem('auth_token');
}

function saveTokenToStorage(token) {
    state.token = token;
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

async function loadDesktopOs() {
    if (!state.token) {
        initDefaultLayout();
        return;
    }
    
    try {
        const response = await fetchWithAuth('/index/desktopOs');
        const result = await response.json();
        
        if (result.errorCode === 0 && result.responseData) {
            state.user = result.responseData.user;
            state.uid = result.responseData.user?.uid;
            
            const setting = result.responseData.setting;
            if (setting) {
                state.desktopApps = setting.desktop?.app_list || [];
                state.dockApps = setting.dock?.app_list || [];
            }
            
            if (state.desktopApps.length === 0 && state.dockApps.length === 0) {
                initDefaultLayout();
            } else {
                mergeNewApps();
            }
        } else if (result.errorCode === 401) {
            saveTokenToStorage(null);
            initDefaultLayout();
        }
    } catch (e) {
        console.error('Failed to load desktop os:', e);
        initDefaultLayout();
    }
}

function initDefaultLayout() {
    const cols = 6;
    const startX = 2;
    const startY = 2;
    const gapX = 10;
    const gapY = 16;
    
    APPS.forEach((app, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        state.desktopApps.push({
            app_name: app.name,
            desc: app.about,
            x: startX + col * gapX,
            y: startY + row * gapY
        });
    });
}

function mergeNewApps() {
    const existingNames = new Set([
        ...state.desktopApps.map(a => a.app_name),
        ...state.dockApps.map(a => a.app_name)
    ]);
    
    const newApps = APPS.filter(app => !existingNames.has(app.name));
    if (newApps.length === 0) return;
    
    const maxY = state.desktopApps.reduce((max, app) => Math.max(max, app.y), 0);
    const cols = 5;
    const gapX = 6;
    const gapY = 12;
    const startX = 2;
    const startY = maxY + gapY;
    
    newApps.forEach((app, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        state.desktopApps.push({
            app_name: app.name,
            desc: app.about,
            x: startX + col * gapX,
            y: startY + row * gapY
        });
    });
    
    saveSettings();
}

async function saveSettings() {
    if (!state.uid) return;
    
    const settings = {
        desktop: { app_list: state.desktopApps },
        dock: { app_list: state.dockApps }
    };
    
    try {
        await fetchWithAuth('/settings/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: state.uid, settings })
        });
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

function render() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="statusbar">
            <div class="statusbar-left">
                <div class="apple-logo">🍎</div>
                <div class="site-name">阿米龙</div>
            </div>
            <div class="statusbar-right">
                <div class="datetime" id="datetime"></div>
            </div>
        </div>
        
        <div class="apple-menu" id="appleMenu">
            <div class="menu-item" data-action="about">
                <span class="menu-item-icon"></span>
                <span class="menu-item-text">关于阿米龙</span>
            </div>
            <div class="menu-divider"></div>
            <div class="user-section" id="userSection">
                ${renderUserSection()}
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item" data-action="settings">
                <span class="menu-item-icon">⚙️</span>
                <span class="menu-item-text">系统设置</span>
            </div>
            ${state.user ? `
            <div class="menu-divider"></div>
            <div class="menu-item" data-action="logout">
                <span class="menu-item-icon">🚪</span>
                <span class="menu-item-text">退出登录</span>
            </div>
            ` : ''}
        </div>
        
        <div class="desktop" id="desktop"></div>
        
        <div class="dock" id="dock"></div>
        
        <div class="dock-drop-zone" id="dockDropZone"></div>
        
        <div class="context-menu" id="contextMenu">
            <div class="menu-item" data-action="about-app">
                <span class="menu-item-text">关于</span>
            </div>
        </div>
        
        <div class="about-modal" id="aboutModal">
            <div class="about-modal-content">
                <div class="about-modal-icon" id="aboutModalIcon"></div>
                <div class="about-modal-title" id="aboutModalTitle"></div>
                <div class="about-modal-version" id="aboutModalVersion"></div>
                <div class="about-modal-description" id="aboutModalDescription"></div>
                <button class="about-modal-btn" onclick="closeAboutModal()">确定</button>
            </div>
        </div>
        
        <div class="login-modal" id="loginModal">
            <div class="login-modal-content">
                <button class="login-modal-close" onclick="closeLoginModal()">×</button>
                <div class="login-modal-header">
                    <div class="login-modal-title">阿米龙</div>
                </div>
                <div class="login-tabs">
                    <div class="login-tab ${state.loginTab === 'login' ? 'active' : ''}" data-tab="login">登录</div>
                    <div class="login-tab ${state.loginTab === 'register' ? 'active' : ''}" data-tab="register">注册</div>
                </div>
                <form class="login-form" id="loginForm" onsubmit="handleLoginSubmit(event)">
                    ${state.loginTab === 'login' ? `
                        <div class="login-form-group">
                            <label>账号</label>
                            <input type="text" name="account" placeholder="请输入账号" required>
                        </div>
                        <div class="login-form-group">
                            <label>密码</label>
                            <input type="password" name="password" placeholder="请输入密码" required>
                        </div>
                    ` : `
                        <div class="login-form-group">
                            <label>账号</label>
                            <input type="text" name="account" placeholder="请输入账号" required>
                        </div>
                        <div class="login-form-group">
                            <label>用户名</label>
                            <input type="text" name="name" placeholder="请输入用户名" required>
                        </div>
                        <div class="login-form-group">
                            <label>密码</label>
                            <input type="password" name="password" placeholder="请输入密码" required>
                        </div>
                    `}
                    <button type="submit" class="login-submit-btn">${state.loginTab === 'login' ? '登录' : '注册'}</button>
                    ${state.loginError ? `<div class="login-error">${state.loginError}</div>` : ''}
                </form>
            </div>
        </div>
    `;
    
    renderDesktop();
    renderDock();
}

function renderUserSection() {
    if (state.user) {
        return `
            <div class="user-avatar">👤</div>
            <div class="user-info">
                <div class="user-name">${state.user.name || '用户'}</div>
                <div class="user-account">${state.user.account || ''}</div>
            </div>
        `;
    } else {
        return `
            <div class="user-avatar">👤</div>
            <div class="user-info">
                <div class="user-name">未登录</div>
                <div class="user-account">点击登录使用更多功能</div>
            </div>
            <button class="user-login-btn" data-action="login">登录</button>
        `;
    }
}

function renderDesktop() {
    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    
    desktop.innerHTML = state.desktopApps.map((appData, index) => {
        const app = APP_MAP[appData.app_name];
        if (!app) return '';
        
        const x = (appData.x / 100) * desktopRect.width;
        const y = (appData.y / 100) * (desktopRect.height - 80);
        
        return `
            <div class="desktop-icon" 
                 data-name="${app.name}" 
                 data-index="${index}"
                 style="left: ${x}px; top: ${y}px;"
                 draggable="true">
                <div class="desktop-icon-image">${app.icon}</div>
                <div class="desktop-icon-label">${app.label}</div>
            </div>
        `;
    }).join('');
}

function renderDock() {
    const dock = document.getElementById('dock');
    
    dock.innerHTML = state.dockApps.map((appData, index) => {
        const app = APP_MAP[appData.app_name];
        if (!app) return '';
        
        return `
            <div class="dock-icon" 
                 data-name="${app.name}" 
                 data-index="${index}"
                 draggable="true">
                <div class="dock-tooltip">${app.label}</div>
                <div class="dock-icon-image">${app.icon}</div>
            </div>
        `;
    }).join('');
}

function bindEvents() {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dblclick', handleDoubleClick);
    
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);
    
    bindAppleLogoEvent();
}

function bindAppleLogoEvent() {
    const appleLogo = document.querySelector('.apple-logo');
    if (appleLogo) {
        appleLogo.onclick = (e) => {
            e.stopPropagation();
            toggleAppleMenu();
        };
    }
}

function handleGlobalClick(e) {
    const appleMenu = document.getElementById('appleMenu');
    const contextMenu = document.getElementById('contextMenu');
    const loginModal = document.getElementById('loginModal');
    
    if (!e.target.closest('.apple-logo') && !e.target.closest('.apple-menu')) {
        appleMenu.classList.remove('show');
    }
    
    contextMenu.classList.remove('show');
    
    if (e.target.closest('.desktop-icon')) {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.classList.remove('selected');
        });
        e.target.closest('.desktop-icon').classList.add('selected');
        state.selectedIcon = e.target.closest('.desktop-icon');
    } else if (!e.target.closest('.context-menu')) {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.classList.remove('selected');
        });
        state.selectedIcon = null;
    }
    
    if (e.target.closest('.menu-item')) {
        const action = e.target.closest('.menu-item').dataset.action;
        handleMenuAction(action);
    }
    
    if (e.target.closest('.user-login-btn')) {
        showLoginModal();
    }
    
    if (e.target.closest('.login-tab')) {
        const tab = e.target.closest('.login-tab').dataset.tab;
        switchLoginTab(tab);
    }
}

function handleContextMenu(e) {
    e.preventDefault();
    
    const desktopIcon = e.target.closest('.desktop-icon');
    const dockIcon = e.target.closest('.dock-icon');
    
    if (desktopIcon || dockIcon) {
        const contextMenu = document.getElementById('contextMenu');
        const rect = (desktopIcon || dockIcon).getBoundingClientRect();
        
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.dataset.targetName = (desktopIcon || dockIcon).dataset.name;
        contextMenu.classList.add('show');
    }
}

function handleDoubleClick(e) {
    const desktopIcon = e.target.closest('.desktop-icon');
    const dockIcon = e.target.closest('.dock-icon');
    
    if (desktopIcon || dockIcon) {
        const appName = (desktopIcon || dockIcon).dataset.name;
        const app = APP_MAP[appName];
        if (app) {
            window.open(app.url, '_blank');
        }
    }
}

async function handleMenuAction(action) {
    const contextMenu = document.getElementById('contextMenu');
    
    switch (action) {
        case 'about':
            showAboutModal({
                icon: '🍎',
                label: '阿米龙',
                about: '阿米龙是一个综合应用平台，提供棋牌游戏、休闲游戏等多种娱乐应用。'
            });
            break;
        case 'settings':
            alert('系统设置功能开发中...');
            break;
        case 'about-app':
            const appName = contextMenu.dataset.targetName;
            const app = APP_MAP[appName];
            if (app) {
                showAboutModal(app);
            }
            break;
        case 'login':
            showLoginModal();
            break;
        case 'logout':
            await handleLogout();
            break;
    }
    
    document.getElementById('appleMenu').classList.remove('show');
    contextMenu.classList.remove('show');
}

function showAboutModal(app) {
    document.getElementById('aboutModalIcon').textContent = app.icon || '📱';
    document.getElementById('aboutModalTitle').textContent = app.label || app.name;
    document.getElementById('aboutModalVersion').textContent = '版本 1.0.0';
    document.getElementById('aboutModalDescription').textContent = app.about || '';
    document.getElementById('aboutModal').classList.add('show');
}

function closeAboutModal() {
    document.getElementById('aboutModal').classList.remove('show');
}

function toggleAppleMenu() {
    const appleMenu = document.getElementById('appleMenu');
    appleMenu.classList.toggle('show');
}

function showLoginModal() {
    state.loginError = '';
    state.loginTab = 'login';
    render();
    document.getElementById('appleMenu').classList.remove('show');
    setTimeout(() => {
        document.getElementById('loginModal').classList.add('show');
    }, 10);
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    state.loginError = '';
}

function switchLoginTab(tab) {
    state.loginTab = tab;
    state.loginError = '';
    render();
    setTimeout(() => {
        document.getElementById('loginModal').classList.add('show');
    }, 10);
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    data.device_type = 'pc';
    
    const url = state.loginTab === 'login' ? '/auth/login' : '/auth/register';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.errorCode === 0 && result.responseData) {
            state.user = result.responseData.user;
            state.uid = result.responseData.user.uid;
            saveTokenToStorage(result.responseData.token);
            state.loginError = '';
            
            state.desktopApps = [];
            state.dockApps = [];
            
            closeLoginModal();
            await loadDesktopOs();
            render();
            bindAppleLogoEvent();
            renderDesktop();
            renderDock();
        } else {
            state.loginError = result.errorMsg || '操作失败，请重试';
            render();
            setTimeout(() => {
                document.getElementById('loginModal').classList.add('show');
            }, 10);
        }
    } catch (e) {
        state.loginError = '网络错误，请重试';
        render();
        setTimeout(() => {
            document.getElementById('loginModal').classList.add('show');
        }, 10);
    }
}

async function handleLogout() {
    try {
        await fetchWithAuth('/auth/logout', { method: 'POST' });
        
        state.user = null;
        state.uid = null;
        saveTokenToStorage(null);
        state.desktopApps = [];
        state.dockApps = [];
        
        await loadDesktopOs();
        render();
        renderDesktop();
        renderDock();
    } catch (e) {
        console.error('Logout failed:', e);
    }
}

function handleDragStart(e) {
    const desktopIcon = e.target.closest('.desktop-icon');
    const dockIcon = e.target.closest('.dock-icon');
    
    if (desktopIcon) {
        desktopIcon.classList.add('dragging');
        state.dragData = {
            type: 'desktop',
            name: desktopIcon.dataset.name,
            index: parseInt(desktopIcon.dataset.index, 10)
        };
        e.dataTransfer.effectAllowed = 'move';
    } else if (dockIcon) {
        dockIcon.classList.add('dragging');
        state.dragData = {
            type: 'dock',
            name: dockIcon.dataset.name,
            index: parseInt(dockIcon.dataset.index, 10)
        };
        e.dataTransfer.effectAllowed = 'move';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    
    const dockDropZone = document.getElementById('dockDropZone');
    const desktop = document.getElementById('desktop');
    
    if (e.clientY > window.innerHeight - 80) {
        dockDropZone.classList.add('active');
    } else {
        dockDropZone.classList.remove('active');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    
    if (!state.dragData) return;
    
    const dockDropZone = document.getElementById('dockDropZone');
    dockDropZone.classList.remove('active');
    
    const isDroppingToDock = e.clientY > window.innerHeight - 80;
    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    
    if (state.dragData.type === 'desktop' && isDroppingToDock) {
        const appData = state.desktopApps[state.dragData.index];
        state.desktopApps.splice(state.dragData.index, 1);
        state.dockApps.push({
            app_name: appData.app_name,
            desc: appData.desc
        });
        await saveSettings();
        renderDesktop();
        renderDock();
    } else if (state.dragData.type === 'dock' && !isDroppingToDock) {
        const appData = state.dockApps[state.dragData.index];
        state.dockApps.splice(state.dragData.index, 1);
        state.desktopApps.push({
            app_name: appData.app_name,
            desc: appData.desc,
            x: Math.round(((e.clientX - desktopRect.left) / desktopRect.width) * 100),
            y: Math.round(((e.clientY - desktopRect.top - 25) / (desktopRect.height - 80)) * 100)
        });
        await saveSettings();
        renderDesktop();
        renderDock();
    } else if (state.dragData.type === 'desktop' && !isDroppingToDock) {
        const appData = state.desktopApps[state.dragData.index];
        appData.x = Math.round(((e.clientX - desktopRect.left) / desktopRect.width) * 100);
        appData.y = Math.round(((e.clientY - desktopRect.top - 25) / (desktopRect.height - 80)) * 100);
        await saveSettings();
        renderDesktop();
    }
}

function handleDragEnd(e) {
    document.querySelectorAll('.desktop-icon.dragging, .dock-icon.dragging').forEach(el => {
        el.classList.remove('dragging');
    });
    
    const dockDropZone = document.getElementById('dockDropZone');
    dockDropZone.classList.remove('active');
    
    state.dragData = null;
}

function startClock() {
    function updateClock() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdays[now.getDay()];
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        const datetimeEl = document.getElementById('datetime');
        if (datetimeEl) {
            datetimeEl.textContent = `${month}月${day}日 ${weekday} ${hours}:${minutes}`;
        }
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

window.closeAboutModal = closeAboutModal;
window.closeLoginModal = closeLoginModal;
window.handleLoginSubmit = handleLoginSubmit;
window.switchLoginTab = switchLoginTab;

init();
