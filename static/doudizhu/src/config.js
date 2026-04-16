export const CARD_WIDTH = 60;
export const CARD_HEIGHT = 90;
export const CARD_OVERLAP = 25;

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
    BUTTON_HOVER: '#2980b9'
};

export const GAME_STATES = {
    WAITING: 'waiting',
    BIDDING: 'bidding',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export const CARD_TYPES = {
    SINGLE: 'single',
    PAIR: 'pair',
    TRIPLE: 'triple',
    TRIPLE_ONE: 'triple_one',
    TRIPLE_TWO: 'triple_two',
    BOMB: 'bomb',
    ROCKET: 'rocket',
    STRAIGHT: 'straight',
    STRAIGHT_PAIR: 'straight_pair',
    PLANE: 'plane',
    FOUR_TWO: 'four_two'
};
