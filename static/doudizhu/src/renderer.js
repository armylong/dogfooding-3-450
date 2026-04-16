import { COLORS, CARD_WIDTH, CARD_HEIGHT, CARD_OVERLAP } from './config.js';

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
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';

            const displayRank = card.rank === '小王' ? '小' : card.rank === '大王' ? '大' : card.rank;
            this.ctx.fillText(displayRank, x + 5, drawY + 5);

            if (card.suit) {
                this.ctx.font = '20px Arial';
                this.ctx.fillText(card.suit, x + 5, drawY + 25);
            }

            if (card.rank === '小王' || card.rank === '大王') {
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(card.rank === '小王' ? '王' : '王', x + CARD_WIDTH / 2, drawY + CARD_HEIGHT / 2);
            }
        }
    }

    drawPlayers(players, currentIndex, landlordIndex) {
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            let x, y, labelY;

            if (i === 0) {
                x = this.canvas.width / 2;
                y = this.canvas.height - 30;
                labelY = this.canvas.height - CARD_HEIGHT - 110;
            } else if (i === 1) {
                x = 80;
                y = this.canvas.height / 2;
                labelY = y - 60;
            } else {
                x = this.canvas.width - 80;
                y = this.canvas.height / 2;
                labelY = y - 60;
            }

            this.ctx.fillStyle = currentIndex === i ? '#f1c40f' : COLORS.TEXT;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.name + (player.isLandlord ? ' (地主)' : ''), x, labelY);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`剩余: ${player.cards.length}张`, x, labelY + 20);

            if (i !== 0) {
                const cardCount = Math.min(player.cards.length, 10);
                const startX = x - (cardCount * 8) / 2;
                for (let j = 0; j < cardCount; j++) {
                    this.drawCard(startX + j * 8, y - CARD_HEIGHT / 2, null, false);
                }
            }
        }
    }

    drawBottomCards(cards, visible) {
        const startX = this.canvas.width / 2 - (3 * 30) / 2;
        for (let i = 0; i < cards.length; i++) {
            this.drawCard(startX + i * 30, 10, cards[i], visible);
        }
        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('底牌', this.canvas.width / 2, 110);
    }

    drawPlayerCards(cards, startX, y, selectedIndices) {
        for (let i = 0; i < cards.length; i++) {
            const isSelected = selectedIndices.includes(i);
            this.drawCard(startX + i * CARD_OVERLAP, y, cards[i], true, isSelected);
        }
    }

    drawLastPlay(cards, playerIndex) {
        let x, y;
        if (playerIndex === 0) {
            x = this.canvas.width / 2 - (cards.length * CARD_OVERLAP) / 2;
            y = this.canvas.height - CARD_HEIGHT - 180;
        } else if (playerIndex === 1) {
            x = 150;
            y = this.canvas.height / 2 - CARD_HEIGHT / 2;
        } else {
            x = this.canvas.width - 150 - cards.length * CARD_OVERLAP;
            y = this.canvas.height / 2 - CARD_HEIGHT / 2;
        }

        for (let i = 0; i < cards.length; i++) {
            this.drawCard(x + i * CARD_OVERLAP, y, cards[i], true);
        }
    }

    drawButton(x, y, width, height, text) {
        this.ctx.fillStyle = COLORS.BUTTON;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = 'bold 16px Arial';
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
