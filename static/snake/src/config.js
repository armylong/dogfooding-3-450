/**
 * 游戏配置模块
 * 定义游戏的全局常量和配置项
 */

export const CELL_SIZE = 20;
export const GAME_SPEED = 150;
export const INITIAL_SNAKE_LENGTH = 3;

export const COLORS = {
    SNAKE_HEAD: '#2e7d32',
    SNAKE_BODY: '#81c784',
    FOOD: '#e53935',
    BACKGROUND: '#1a1a2e',
    GRID: '#16213e'
};

export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

export const GAME_STATES = {
    IDLE: 'idle',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};
