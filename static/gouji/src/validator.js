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

        if (cards.length >= 3 && countValues.every(c => c === countValues[0])) {
            if (countValues[0] >= 6) {
                return { type: CARD_TYPES.GOUJI, value: uniqueValues[0], count: countValues[0] };
            }
            if (countValues[0] === 3) {
                return { type: CARD_TYPES.TRIPLE, value: uniqueValues[0], count: cards.length };
            }
        }

        if (cards.length >= 4 && countValues[0] === 4) {
            return { type: CARD_TYPES.BOMB, value: uniqueValues[0] };
        }

        return null;
    }

    static canBeat(cards, type, lastCards, lastType) {
        if (!lastType) return true;

        if (type.type === CARD_TYPES.BOMB) {
            if (lastType.type !== CARD_TYPES.BOMB) return true;
            return type.value > lastType.value;
        }

        if (lastType.type === CARD_TYPES.BOMB) return false;

        if (type.type !== lastType.type) return false;

        if (type.type === CARD_TYPES.GOUJI) {
            return type.count === lastType.count && type.value > lastType.value;
        }

        if (type.count && lastType.count && type.count !== lastType.count) {
            return false;
        }

        return type.value > lastType.value;
    }
}
