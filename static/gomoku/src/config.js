export const CELL_SIZE = 40;
export const BOARD_SIZE = 15;

export const COLORS = {
    BOARD: '#dcb35c',
    LINE: '#8b6914',
    BLACK: '#000000',
    WHITE: '#ffffff',
    LAST_MOVE: '#ff0000',
    BACKGROUND: '#1a1a2e',
    TEXT: '#ffffff',
    STAR_POINT: '#8b6914'
};

export const GAME_STATES = {
    IDLE: 'idle',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export const PLAYERS = {
    BLACK: 'black',
    WHITE: 'white'
};

export const STAR_POINTS = [
    [3, 3], [3, 7], [3, 11],
    [7, 3], [7, 7], [7, 11],
    [11, 3], [11, 7], [11, 11]
];
