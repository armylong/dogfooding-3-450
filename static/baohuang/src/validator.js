import { CARD_TYPES } from './config.js';

export class CardValidator {
    static getType(cards) {
        if (!cards || cards.length === 0) return null;

        const values = cards.map(c => c.value).sort((a, b) => a - b);
        const counts = {};
        for (const v of values) {
            counts[v] = (counts[v] || 0) + 1;
        }

        const countValues = Object.values(counts).sort((a, b) => b - a);
        const uniqueValues = Object.keys(counts).map(Number).sort((a, b) => a - b);

        if (cards.length === 1) {
            return { type: CARD_TYPES.SINGLE, value: values[0] };
        }

        if (cards.length === 2 && countValues[0] === 2) {
            return { type: CARD_TYPES.PAIR, value: values[0] };
        }

        if (cards.length === 3 && countValues[0] === 3) {
            return { type: CARD_TYPES.TRIPLE, value: uniqueValues[0] };
        }

        if (cards.length === 4 && countValues[0] === 4) {
            return { type: CARD_TYPES.BOMB, value: uniqueValues[0] };
        }

        if (cards.length >= 5 && countValues.every(c => c === 1)) {
            if (this._isConsecutive(uniqueValues) && uniqueValues[uniqueValues.length - 1] <= 14) {
                return { type: CARD_TYPES.STRAIGHT, value: uniqueValues[uniqueValues.length - 1], length: cards.length };
            }
        }

        return null;
    }

    static _isConsecutive(values) {
        for (let i = 1; i < values.length; i++) {
            if (values[i] - values[i - 1] !== 1) {
                return false;
            }
        }
        return true;
    }

    static canBeat(cards, type, lastCards, lastType) {
        if (!lastType) return true;

        if (type.type === CARD_TYPES.BOMB) {
            if (lastType.type !== CARD_TYPES.BOMB) return true;
            return type.value > lastType.value;
        }

        if (lastType.type === CARD_TYPES.BOMB) return false;

        if (type.type !== lastType.type) return false;

        if (type.type === CARD_TYPES.STRAIGHT) {
            return type.length === lastType.length && type.value > lastType.value;
        }

        return type.value > lastType.value;
    }
}
