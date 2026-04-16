export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 75;
export const CARD_OVERLAP = 20;

export const SUITS = ['♠', '♥', '♣', '♦'];
export const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const RANK_VALUES = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, '小王': 16, '大王': 17
};

export const COLORS = {
    BACKGROUND: '#1a5f3c',
    CARD: '#ffffff',
    CARD_BACK: '#2c3e50',
    RED: '#c0392b',
    BLACK: '#2c3e50',
    SELECTED: '#f1c40f',
    TEXT: '#ffffff',
    BUTTON: '#3498db',
    TEAM_A: '#e74c3c',
    TEAM_B: '#3498db'
};

export const GAME_STATES = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export const CARD_TYPES = {
    SINGLE: 'single',
    PAIR: 'pair',
    TRIPLE: 'triple',
    GOUJI: 'gouji',
    STRAIGHT: 'straight',
    BOMB: 'bomb'
};
