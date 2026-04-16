import { Deck } from './deck.js';
import { Player } from './player.js';
import { Renderer } from './renderer.js';
import { CardValidator } from './validator.js';
import { COLORS, GAME_STATES, ROLES, CARD_WIDTH, CARD_HEIGHT, CARD_OVERLAP } from './config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.deck = new Deck();
        this.players = [];
        this.currentIndex = 0;
        this.state = GAME_STATES.WAITING;
        this.lastPlay = null;
        this.lastPlayPlayer = -1;
        this.passCount = 0;
        this.selectedCards = [];
        this.emperorIndex = -1;
        this.guardIndex = -1;

        this._init();
    }

    _init() {
        this.canvas.width = 1000;
        this.canvas.height = 750;
        this._render();
    }

    start() {
        this.deck.shuffle();

        this.players = [
            new Player(0, '你', false),
            new Player(1, '电脑1', true),
            new Player(2, '电脑2', true),
            new Player(3, '电脑3', true),
            new Player(4, '电脑4', true)
        ];

        let cardIndex = 0;
        while (this.deck.cards.length > 0) {
            this.players[cardIndex % 5].addCard(this.deck.deal());
            cardIndex++;
        }

        for (const player of this.players) {
            player.sortCards();
        }

        this.emperorIndex = Math.floor(Math.random() * 5);
        this.players[this.emperorIndex].role = ROLES.EMPEROR;

        do {
            this.guardIndex = Math.floor(Math.random() * 5);
        } while (this.guardIndex === this.emperorIndex);
        this.players[this.guardIndex].role = ROLES.GUARD;

        for (let i = 0; i < 5; i++) {
            if (i !== this.emperorIndex && i !== this.guardIndex) {
                this.players[i].role = ROLES.REBEL;
            }
        }

        this.state = GAME_STATES.PLAYING;
        this.currentIndex = this.emperorIndex;
        this.lastPlay = null;
        this.lastPlayPlayer = -1;
        this.passCount = 0;
        this.selectedCards = [];

        this._render();

        if (this.players[this.currentIndex].isAI) {
            setTimeout(() => this._aiPlay(), 800);
        }
    }

    handleClick(x, y) {
        if (this.state === GAME_STATES.WAITING) {
            if (this._isButtonClicked(x, y, this.canvas.width / 2 - 60, this.canvas.height / 2 - 20, 120, 40)) {
                this.start();
            }
            return;
        }

        if (this.state === GAME_STATES.PLAYING && !this.players[this.currentIndex].isAI) {
            const player = this.players[0];
            const startX = this.canvas.width / 2 - (player.cards.length * CARD_OVERLAP) / 2;

            for (let i = player.cards.length - 1; i >= 0; i--) {
                const cardX = startX + i * CARD_OVERLAP;
                const cardY = this.canvas.height - CARD_HEIGHT - 60;
                const isSelected = this.selectedCards.includes(i);

                if (x >= cardX && x <= cardX + CARD_WIDTH && y >= cardY - (isSelected ? 20 : 0) && y <= cardY + CARD_HEIGHT) {
                    if (this.selectedCards.includes(i)) {
                        this.selectedCards = this.selectedCards.filter(idx => idx !== i);
                    } else {
                        this.selectedCards.push(i);
                    }
                    this._render();
                    return;
                }
            }

            if (this._isButtonClicked(x, y, this.canvas.width / 2 - 130, this.canvas.height - 35, 120, 40)) {
                this.playSelected();
            } else if (this._isButtonClicked(x, y, this.canvas.width / 2 + 10, this.canvas.height - 35, 120, 40)) {
                this.pass();
            }
        }

        if (this.state === GAME_STATES.GAME_OVER) {
            if (this._isButtonClicked(x, y, this.canvas.width / 2 - 60, this.canvas.height / 2 + 30, 120, 40)) {
                this.restart();
            }
        }
    }

    _isButtonClicked(x, y, bx, by, bw, bh) {
        return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }

    playSelected() {
        if (this.state !== GAME_STATES.PLAYING || this.players[this.currentIndex].isAI) return;
        if (this.selectedCards.length === 0) return;

        const player = this.players[0];
        const cards = this.selectedCards.map(i => player.cards[i]).sort((a, b) => a.value - b.value);

        const type = CardValidator.getType(cards);
        if (!type) return;

        if (this.lastPlay && this.lastPlayPlayer !== this.currentIndex) {
            if (!CardValidator.canBeat(cards, type, this.lastPlay, this.lastPlayType)) {
                return;
            }
        }

        this._playCards(this.currentIndex, cards, type);
    }

    _playCards(playerIndex, cards, type) {
        const player = this.players[playerIndex];

        if (playerIndex === 0) {
            player.cards = player.cards.filter((_, i) => !this.selectedCards.includes(i));
            this.selectedCards = [];
        } else {
            player.cards = player.cards.filter(c => !cards.includes(c));
        }

        this.lastPlay = cards;
        this.lastPlayType = type;
        this.lastPlayPlayer = playerIndex;
        this.passCount = 0;

        if (player.cards.length === 0) {
            this._gameOver(playerIndex);
            return;
        }

        this._nextPlayer();
    }

    _gameOver(winnerIndex) {
        this.state = GAME_STATES.GAME_OVER;
        const winner = this.players[winnerIndex];

        if (winner.role === ROLES.EMPEROR || winner.role === ROLES.GUARD) {
            this.winnerTeam = '皇帝方';
        } else {
            this.winnerTeam = '平民方';
        }

        this._render();
    }

    pass() {
        if (this.state !== GAME_STATES.PLAYING || this.players[this.currentIndex].isAI) return;
        if (!this.lastPlay || this.lastPlayPlayer === this.currentIndex) return;

        this.passCount++;
        if (this.passCount >= 4) {
            this.lastPlay = null;
            this.lastPlayType = null;
            this.passCount = 0;
        }

        this._nextPlayer();
    }

    _nextPlayer() {
        let nextIndex = (this.currentIndex + 1) % 5;
        let attempts = 0;

        while (this.players[nextIndex].cards.length === 0 && attempts < 5) {
            nextIndex = (nextIndex + 1) % 5;
            attempts++;
        }

        if (attempts >= 5) {
            this.state = GAME_STATES.GAME_OVER;
            this._render();
            return;
        }

        this.currentIndex = nextIndex;
        this._render();

        if (this.players[this.currentIndex].isAI) {
            setTimeout(() => this._aiPlay(), 600);
        }
    }

    _aiPlay() {
        if (this.state !== GAME_STATES.PLAYING) return;

        const player = this.players[this.currentIndex];
        const cards = this._findPlayableCards(player);

        if (cards && cards.length > 0) {
            const type = CardValidator.getType(cards);
            this._playCards(this.currentIndex, cards, type);
        } else {
            this.passCount++;
            if (this.passCount >= 4) {
                this.lastPlay = null;
                this.lastPlayType = null;
                this.passCount = 0;
            }
            this._nextPlayer();
        }
    }

    _findPlayableCards(player) {
        if (!this.lastPlay || this.lastPlayPlayer === this.currentIndex) {
            return [player.cards[0]];
        }

        for (let count = 1; count <= player.cards.length; count++) {
            for (let i = 0; i <= player.cards.length - count; i++) {
                const cards = player.cards.slice(i, i + count);
                const type = CardValidator.getType(cards);
                if (type && CardValidator.canBeat(cards, type, this.lastPlay, this.lastPlayType)) {
                    return cards;
                }
            }
        }

        return null;
    }

    restart() {
        this.state = GAME_STATES.WAITING;
        this.deck = new Deck();
        this.players = [];
        this.currentIndex = 0;
        this.lastPlay = null;
        this.lastPlayPlayer = -1;
        this.passCount = 0;
        this.selectedCards = [];
        this.emperorIndex = -1;
        this.guardIndex = -1;
        this._render();
    }

    _render() {
        this.renderer.clear();
        this.renderer.drawBackground();

        if (this.state === GAME_STATES.WAITING) {
            this.renderer.drawTitle('保皇 - 山东扑克');
            this.renderer.drawInfo('皇帝+保皇派 vs 平民');
            this.renderer.drawButton(this.canvas.width / 2 - 60, this.canvas.height / 2 - 20, 120, 40, '开始游戏');
            return;
        }

        this.renderer.drawPlayers(this.players, this.currentIndex, this.emperorIndex, this.guardIndex);

        if (this.lastPlay) {
            this.renderer.drawLastPlay(this.lastPlay, this.lastPlayPlayer);
        }

        if (this.state === GAME_STATES.PLAYING && !this.players[this.currentIndex].isAI) {
            const player = this.players[0];
            const startX = this.canvas.width / 2 - (player.cards.length * CARD_OVERLAP) / 2;
            this.renderer.drawPlayerCards(player.cards, startX, this.canvas.height - CARD_HEIGHT - 60, this.selectedCards);
            this.renderer.drawButton(this.canvas.width / 2 - 130, this.canvas.height - 35, 120, 40, '出牌');
            this.renderer.drawButton(this.canvas.width / 2 + 10, this.canvas.height - 35, 120, 40, '不出');
        }

        if (this.state === GAME_STATES.GAME_OVER) {
            this.renderer.drawGameOver(`${this.winnerTeam}获胜！`);
            this.renderer.drawButton(this.canvas.width / 2 - 60, this.canvas.height / 2 + 30, 120, 40, '再来一局');
        }
    }
}
