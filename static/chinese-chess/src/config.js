export const CELL_SIZE = 60;
export const COLS = 9;
export const ROWS = 10;

export const COLORS = {
    BOARD: '#f0d9b5',
    LINE: '#8b4513',
    RIVER: '#d4a574',
    RED: '#c0392b',
    BLACK: '#2c3e50',
    SELECTED: '#27ae60',
    VALID_MOVE: 'rgba(39, 174, 96, 0.5)',
    BACKGROUND: '#1a1a2e',
    TEXT: '#ffffff'
};

export const PIECES = {
    KING: 'king',
    ADVISOR: 'advisor',
    BISHOP: 'bishop',
    KNIGHT: 'knight',
    ROOK: 'rook',
    CANNON: 'cannon',
    PAWN: 'pawn'
};

export const PIECE_NAMES = {
    red: {
        king: '帅',
        advisor: '仕',
        bishop: '相',
        knight: '马',
        rook: '车',
        cannon: '炮',
        pawn: '兵'
    },
    black: {
        king: '将',
        advisor: '士',
        bishop: '象',
        knight: '马',
        rook: '车',
        cannon: '炮',
        pawn: '卒'
    }
};

export const GAME_STATES = {
    PLAYING: 'playing',
    RED_WIN: 'red_win',
    BLACK_WIN: 'black_win'
};

export const SIDES = {
    RED: 'red',
    BLACK: 'black'
};
