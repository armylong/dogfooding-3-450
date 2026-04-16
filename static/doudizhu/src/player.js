export class Player {
    constructor(id, name, isAI) {
        this.id = id;
        this.name = name;
        this.isAI = isAI;
        this.cards = [];
        this.isLandlord = false;
    }

    addCard(card) {
        this.cards.push(card);
    }

    sortCards() {
        this.cards.sort((a, b) => b.value - a.value);
    }
}
