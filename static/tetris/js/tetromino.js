/**
 * 俄罗斯方块类
 * 负责方块的创建、移动、旋转等操作
 */
class Tetromino {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type];
        this.color = COLORS[type];
        this.rotation = 0;
        this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0][0].length / 2);
        this.y = 0;
    }

    /**
     * 获取当前旋转状态的形状
     */
    getCurrentShape() {
        return this.shape[this.rotation];
    }

    /**
     * 获取旋转后的形状（不改变当前状态）
     */
    getRotatedShape() {
        const nextRotation = (this.rotation + 1) % 4;
        return this.shape[nextRotation];
    }

    /**
     * 旋转方块
     */
    rotate() {
        this.rotation = (this.rotation + 1) % 4;
    }

    /**
     * 逆时针旋转（用于回退）
     */
    rotateBack() {
        this.rotation = (this.rotation + 3) % 4;
    }

    /**
     * 向左移动
     */
    moveLeft() {
        this.x--;
    }

    /**
     * 向右移动
     */
    moveRight() {
        this.x++;
    }

    /**
     * 向下移动
     */
    moveDown() {
        this.y++;
    }

    /**
     * 向上移动（用于回退）
     */
    moveUp() {
        this.y--;
    }

    /**
     * 获取方块的所有格子位置
     */
    getPositions() {
        const shape = this.getCurrentShape();
        const positions = [];
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    positions.push({
                        x: this.x + col,
                        y: this.y + row
                    });
                }
            }
        }
        return positions;
    }

    /**
     * 克隆当前方块
     */
    clone() {
        const cloned = new Tetromino(this.type);
        cloned.rotation = this.rotation;
        cloned.x = this.x;
        cloned.y = this.y;
        return cloned;
    }
}

/**
 * 方块工厂类
 * 负责随机生成方块
 */
class TetrominoFactory {
    constructor() {
        this.types = Object.keys(TETROMINO_TYPES);
        this.bag = [];
        this.fillBag();
    }

    /**
     * 填充方块袋（使用7-bag随机算法，保证公平性）
     */
    fillBag() {
        this.bag = [...this.types];
        // Fisher-Yates 洗牌算法
        for (let i = this.bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
    }

    /**
     * 获取下一个方块类型
     */
    getNextType() {
        if (this.bag.length === 0) {
            this.fillBag();
        }
        return this.bag.pop();
    }

    /**
     * 创建新方块
     */
    create() {
        const type = this.getNextType();
        return new Tetromino(type);
    }
}
