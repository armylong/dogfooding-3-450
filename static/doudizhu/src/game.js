import { Deck } from './deck.js';
import { Player } from './player.js';
import { Renderer } from './renderer.js';
import { CardValidator } from './validator.js';
import { COLORS, GAME_STATES, CARD_WIDTH, CARD_HEIGHT, CARD_OVERLAP } from './config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.deck = new Deck();
        this.players = [];
        this.landlordIndex = -1;
        this.currentIndex = 0;
        this.state = GAME_STATES.WAITING;
        this.lastPlay = null;
        self.lastPlayPlayer = -1;
        this.passCount = 0;
        this.bottomCards = [];
        this.selectedCards = [];

        this._init();
    }

    _init() {
        this.canvas.width = 1000;
        this.canvas.height = 700;
        this._render();
    }

    start() {
        this.deck.shuffle();
        
        this.players = [
            new Player(0, '你', false),
            new Player(1, '电脑1', true),
            new Player(2, '电脑2', true)
        ];

        for (let i = 0; i < 51; i++) {
            this.players[i % 3].addCard(this.deck.deal());
        }

        this.bottomCards = [this.deck.deal(), this.deck.deal(), this.deck.deal()];

        for (const player of this.players) {
            player.sortCards();
        }

        this.state = GAME_STATES.BIDDING;
        this.currentIndex = Math.floor(Math.random() * 3);
        this.landlordIndex = -1;
        this.lastPlay = null;
        this.lastPlayPlayer = -1;
        this.passCount = 0;
        this.selectedCards = [];

        this._render();

        if (this.players[this.currentIndex].isAI) {
            setTimeout(() => this._aiBid(), 500);
        }
    }

    _aiBid() {
        if (this.state !== GAME_STATES.BIDDING) return;

        const shouldBid = Math.random() > 0.5;
        if (shouldBid) {
            this._becomeLandlord(this.currentIndex);
        } else {
            this._nextBidder();
        }
    }

    _nextBidder() {
        this.currentIndex = (this.currentIndex + 1) % 3;
        this._render();

        if (this.players[this.currentIndex].isAI) {
            setTimeout(() => this._aiBid(), 500);
        }
    }

    _becomeLandlord(index) {
        this.landlordIndex = index;
        this.players[index].isLandlord = true;

        for (const card of this.bottomCards) {
            this.players[index].addCard(card);
        }
        this.players[index].sortCards();

        this.state = GAME_STATES.PLAYING;
        this.currentIndex = index;
        this._render();

        if (this.players[this.currentIndex].isAI) {
            setTimeout(() => this._aiPlay(), 1000);
        }
    }

    handleClick(x, y) {
        if (this.state === GAME_STATES.WAITING) {
            if (this._isButtonClicked(x, y, this.canvas.width / 2 - 60, this.canvas.height / 2 - 20, 120, 40)) {
                this.start();
            }
            return;
        }

        if (this.state === GAME_STATES.BIDDING && !this.players[this.currentIndex].isAI) {
            if (this._isButtonClicked(x, y, this.canvas.width / 2 - 130, this.canvas.height / 2 - 20, 120, 40)) {
                this._becomeLandlord(this.currentIndex);
            } else if (this._isButtonClicked(x, y, this.canvas.width / 2 + 10, this.canvas.height / 2 - 20, 120, 40)) {
                this._nextBidder();
            }
            return;
        }

        if (this.state === GAME_STATES.PLAYING && !this.players[this.currentIndex].isAI) {
            const player = this.players[0];
            const startX = this.canvas.width / 2 - (player.cards.length * CARD_OVERLAP) / 2;

            for (let i = player.cards.length - 1; i >= 0; i--) {
                const cardX = startX + i * CARD_OVERLAP;
                const cardY = this.canvas.height - CARD_HEIGHT - 80;
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

            if (this._isButtonClicked(x, y, this.canvas.width / 2 - 130, this.canvas.height - 50, 120, 40)) {
                this.playSelected();
            } else if (this._isButtonClicked(x, y, this.canvas.width / 2 + 10, this.canvas.height - 50, 120, 40)) {
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
        if (!type) {
            return;
        }

        if (this.lastPlay && this.lastPlayPlayer !== this.currentIndex) {
            if (!CardValidator.canBeat(cards, type, this.lastPlay, this.lastPlayType)) {
                return;
            }
        }

        this._playCards(this.currentIndex, cards, type);
    }

    _playCards(playerIndex, cards, type) {
        const player = this.players[playerIndex];
        
        player.cards = player.cards.filter((_, i) => !this.selectedCards.includes(i) || playerIndex !== 0);
        if (playerIndex === 0) {
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

    pass() {
        if (this.state !== GAME_STATES.PLAYING || this.players[this.currentIndex].isAI) return;
        if (!this.lastPlay || this.lastPlayPlayer === this.currentIndex) return;

        this.passCount++;
        if (this.passCount >= 2) {
            this.lastPlay = null;
            this.lastPlayType = null;
            this.passCount = 0;
        }

        this._nextPlayer();
    }

    _nextPlayer() {
        this.currentIndex = (this.currentIndex + 1) % 3;
        this._render();

        if (this.players[this.currentIndex].isAI) {
            setTimeout(() => this._aiPlay(), 800);
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
            if (this.passCount >= 2) {
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

        for (let i = 0; i < player.cards.length; i++) {
            for (let j = i + 1; j <= player.cards.length; j++) {
                const cards = player.cards.slice(i, j);
                const type = CardValidator.getType(cards);
                if (type && CardValidator.canBeat(cards, type, this.lastPlay, this.lastPlayType)) {
                    return cards;
                }
            }
        }

        return null;
    }

    _gameOver(winnerIndex) {
        this.state = GAME_STATES.GAME_OVER;
        this.winner = this.players[winnerIndex];
        this._render();
    }

    restart() {
        this.state = GAME_STATES.WAITING;
        this.deck = new Deck();
        this.players = [];
        this.landlordIndex = -1;
        this.currentIndex = 0;
        this.lastPlay = null;
        this.lastPlayPlayer = -1;
        this.passCount = 0;
        this.bottomCards = [];
        this.selectedCards = [];
        this._render();
    }

    _render() {
        this.renderer.clear();
        this.renderer.drawBackground();

        if (this.state === GAME_STATES.WAITING) {
            this.renderer.drawButton(this.canvas.width / 2 - 60, this.canvas.height / 2 - 20, 120, 40, '开始游戏');
            return;
        }

        this.renderer.drawPlayers(this.players, this.currentIndex, this.landlordIndex);

        if (this.bottomCards.length > 0) {
            this.renderer.drawBottomCards(this.bottomCards, this.state === GAME_STATES.PLAYING);
        }

        if (this.lastPlay) {
            this.renderer.drawLastPlay(this.lastPlay, this.lastPlayPlayer);
        }

        if (this.state === GAME_STATES.BIDDING) {
            if (!this.players[this.currentIndex].isAI) {
                this.renderer.drawButton(this.canvas.width / 2 - 130, this.canvas.height / 2 - 20, 120, 40, '叫地主');
                this.renderer.drawButton(this.canvas.width / 2 + 10, this.canvas.height / 2 - 20, 120, 40, '不叫');
            }
        }

        if (this.state === GAME_STATES.PLAYING && !this.players[this.currentIndex].isAI) {
            const player = this.players[0];
            const startX = this.canvas.width / 2 - (player.cards.length * CARD_OVERLAP) / 2;
            this.renderer.drawPlayerCards(player.cards, startX, this.canvas.height - CARD_HEIGHT - 80, this.selectedCards);
            this.renderer.drawButton(this.canvas.width / 2 - 130, this.canvas.height - 50, 120, 40, '出牌');
            this.renderer.drawButton(this.canvas.width / 2 + 10, this.canvas.height - 50, 120, 40, '不出');
        }

        if (this.state === GAME_STATES.GAME_OVER) {
            const msg = this.winner.isLandlord ? '地主获胜！' : '农民获胜！';
            this.renderer.drawGameOver(msg);
            this.renderer.drawButton(this.canvas.width / 2 - 60, this.canvas.height / 2 + 30, 120, 40, '再来一局');
        }
    }
}
