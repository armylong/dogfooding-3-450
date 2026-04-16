export const CELL_SIZE = 32;
export const BOARD_SIZE = 19;

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
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export const PLAYERS = {
    BLACK: 'black',
    WHITE: 'white'
};

export const STAR_POINTS = [
    [3, 3], [3, 9], [3, 15],
    [9, 3], [9, 9], [9, 15],
    [15, 3], [15, 9], [15, 15]
];
