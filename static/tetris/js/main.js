/**
 * 游戏主入口
 * 负责初始化游戏、处理用户输入、游戏循环
 */
class TetrisGame {
    constructor() {
        this.game = new Game();
        this.renderer = new Renderer();
        this.isRunning = false;
        this.keysPressed = new Set();
        this.keyRepeatTimers = {};
        this.keyInitialDelay = 200; // 初始延迟
        this.keyRepeatInterval = 50; // 重复间隔

        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        this.bindEvents();
        this.updateUI();
        this.renderer.render(this.game.getState());
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 按钮事件
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.restart());
        document.getElementById('overlay-btn').addEventListener('click', () => this.handleOverlayButton());
    }

    /**
     * 处理键盘按下
     */
    handleKeyDown(e) {
        // 防止重复触发（系统级）
        if (e.repeat) return;

        const key = e.key;

        switch (key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.startKeyRepeat(key, () => this.game.moveLeft());
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.startKeyRepeat(key, () => this.game.moveRight());
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.game.setSoftDropping(true);
                this.keysPressed.add(key);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.game.rotate();
                break;
            case ' ':
                e.preventDefault();
                this.game.hardDrop();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }

    /**
     * 开始按键重复
     */
    startKeyRepeat(key, action) {
        // 立即执行一次
        action();
        this.keysPressed.add(key);

        // 清除之前的定时器
        this.clearKeyRepeat(key);

        // 设置初始延迟后开始重复
        this.keyRepeatTimers[key] = setTimeout(() => {
            action();
            this.keyRepeatTimers[key] = setInterval(() => {
                if (this.keysPressed.has(key)) {
                    action();
                } else {
                    this.clearKeyRepeat(key);
                }
            }, this.keyRepeatInterval);
        }, this.keyInitialDelay);
    }

    /**
     * 清除按键重复定时器
     */
    clearKeyRepeat(key) {
        if (this.keyRepeatTimers[key]) {
            clearTimeout(this.keyRepeatTimers[key]);
            clearInterval(this.keyRepeatTimers[key]);
            delete this.keyRepeatTimers[key];
        }
    }

    /**
     * 处理键盘释放
     */
    handleKeyUp(e) {
        const key = e.key;
        this.keysPressed.delete(key);

        if (key === 'ArrowDown') {
            this.game.setSoftDropping(false);
        }

        // 清除左右移动的重复定时器
        if (key === 'ArrowLeft' || key === 'ArrowRight') {
            this.clearKeyRepeat(key);
        }
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.game.state === GAME_STATE.READY || this.game.state === GAME_STATE.GAME_OVER) {
            this.game.start();
            this.isRunning = true;
            this.renderer.hideOverlay();
            this.gameLoop();
        }
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (this.game.state === GAME_STATE.PLAYING) {
            this.game.togglePause();
            this.renderer.showPause();
            this.updateUI();
        } else if (this.game.state === GAME_STATE.PAUSED) {
            this.game.togglePause();
            this.renderer.hideOverlay();
            this.lastTime = performance.now();
        }
    }

    /**
     * 重新开始游戏
     */
    restart() {
        this.game.restart();
        this.isRunning = true;
        this.renderer.hideOverlay();
        this.gameLoop();
    }

    /**
     * 处理覆盖层按钮点击
     */
    handleOverlayButton() {
        const state = this.game.state;
        if (state === GAME_STATE.PAUSED) {
            this.togglePause();
        } else if (state === GAME_STATE.GAME_OVER) {
            this.restart();
        }
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.isRunning) return;

        const timestamp = performance.now();

        // 更新游戏状态
        this.game.update(timestamp);

        // 渲染游戏画面
        const state = this.game.getState();
        this.renderer.render(state);
        this.renderer.updateUI(state);

        // 检查游戏结束
        if (state.gameState === GAME_STATE.GAME_OVER) {
            this.isRunning = false;
            const isNewRecord = state.score >= state.highScore && state.score > 0;
            this.renderer.showGameOver(state.score, state.highScore, isNewRecord);
            return;
        }

        // 继续循环
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 更新UI
     */
    updateUI() {
        this.renderer.updateUI(this.game.getState());
    }
}

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});
