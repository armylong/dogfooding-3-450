import { COLORS, CARD_WIDTH, CARD_HEIGHT, CARD_OVERLAP, ROLES } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawTitle(text) {
        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 80);
    }

    drawInfo(text) {
        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 40);
    }

    drawCard(x, y, card, faceUp = true, selected = false) {
        const drawY = selected ? y - 20 : y;

        this.ctx.fillStyle = faceUp ? COLORS.CARD : COLORS.CARD_BACK;
        this.ctx.fillRect(x, drawY, CARD_WIDTH, CARD_HEIGHT);

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, drawY, CARD_WIDTH, CARD_HEIGHT);

        if (faceUp && card) {
            const isRed = card.suit === '♥' || card.suit === '♦' || card.rank === '大王';
            this.ctx.fillStyle = isRed ? COLORS.RED : COLORS.BLACK;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';

            const displayRank = card.rank === '小王' ? '小' : card.rank === '大王' ? '大' : card.rank;
            this.ctx.fillText(displayRank, x + 3, drawY + 3);

            if (card.suit) {
                this.ctx.font = '16px Arial';
                this.ctx.fillText(card.suit, x + 3, drawY + 18);
            }
        }
    }

    drawPlayers(players, currentIndex, emperorIndex, guardIndex) {
        const positions = [
            { x: this.canvas.width / 2, y: this.canvas.height - 100, labelY: this.canvas.height - CARD_HEIGHT - 130 },
            { x: 120, y: this.canvas.height / 2, labelY: this.canvas.height / 2 - 50 },
            { x: this.canvas.width / 2, y: 80, labelY: 40 },
            { x: this.canvas.width - 120, y: this.canvas.height / 2, labelY: this.canvas.height / 2 - 50 },
            { x: this.canvas.width / 2 + 200, y: this.canvas.height / 2 - 100, labelY: this.canvas.height / 2 - 150 }
        ];

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const pos = positions[i];

            let roleColor = COLORS.REBEL;
            let roleText = '';
            if (i === emperorIndex) {
                roleColor = COLORS.EMPEROR;
                roleText = ' [皇]';
            } else if (i === guardIndex) {
                roleColor = COLORS.GUARD;
                roleText = ' [保]';
            }

            this.ctx.fillStyle = roleColor;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            let label = player.name + roleText;
            if (currentIndex === i) {
                label = '▶ ' + label;
            }

            this.ctx.fillText(label, pos.x, pos.labelY);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`剩余: ${player.cards.length}张`, pos.x, pos.labelY + 18);

            if (i !== 0 && player.cards.length > 0) {
                const cardCount = Math.min(player.cards.length, 8);
                const startX = pos.x - (cardCount * 6) / 2;
                for (let j = 0; j < cardCount; j++) {
                    this.drawCard(startX + j * 6, pos.y - CARD_HEIGHT / 2, null, false);
                }
            }
        }
    }

    drawPlayerCards(cards, startX, y, selectedIndices) {
        for (let i = 0; i < cards.length; i++) {
            const isSelected = selectedIndices.includes(i);
            this.drawCard(startX + i * CARD_OVERLAP, y, cards[i], true, isSelected);
        }
    }

    drawLastPlay(cards, playerIndex) {
        const positions = [
            { x: this.canvas.width / 2, y: this.canvas.height - 200 },
            { x: 220, y: this.canvas.height / 2 },
            { x: this.canvas.width / 2, y: 180 },
            { x: this.canvas.width - 220, y: this.canvas.height / 2 },
            { x: this.canvas.width / 2 + 200, y: this.canvas.height / 2 - 30 }
        ];

        const pos = positions[playerIndex];
        const startX = pos.x - (cards.length * CARD_OVERLAP) / 2;

        for (let i = 0; i < cards.length; i++) {
            this.drawCard(startX + i * CARD_OVERLAP, pos.y, cards[i], true);
        }
    }

    drawButton(x, y, width, height, text) {
        this.ctx.fillStyle = COLORS.BUTTON;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    drawGameOver(message) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 20);
    }
}
