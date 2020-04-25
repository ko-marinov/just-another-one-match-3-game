import 'phaser';
import boardImg from '../assets/board_9x9_dark_grey.png';
import gemsSpritesheet from '../assets/Gems6colours_big.png';

const nrows = 9;
const ncols = 9;
const ngems = 6;

const boardSize = 504;
const cellSize = boardSize / 9;
const gemSize = cellSize - 16;

export class Board extends Phaser.Scene {
    constructor() {
        super("BoardScene");
    }

    preload() {
        this.load.image("board", boardImg);
        this.load.spritesheet("gems", gemsSpritesheet, {
            frameWidth: 16,
            frameHeight: 16,
            spacing: 1
        });
    }

    create() {
        this.m = []
        let width = this.game.config.width;
        let height = this.game.config.height;
        this.board = this.add.sprite(width / 2, height / 2, 'board');
        this.board.setDisplaySize(boardSize, boardSize);
        let leftTopPos = {
            x: (width - boardSize) / 2 + cellSize / 2,
            y: (height - boardSize) / 2 + cellSize / 2
        };
        for (let row = 0; row < nrows; row++) {
            this.m[row] = [];
            for (let col = 0; col < ncols; col++) {
                let x = leftTopPos.x + row * cellSize;
                let y = leftTopPos.y + col * cellSize;
                let gem = this.add.sprite(x, y, 'gems', Math.floor(Math.random() * ngems));
                gem.setDisplaySize(gemSize, gemSize);
                gem.setInteractive();
                this.m[row][col] = gem;
            }
        }

        this.input.on("gameobjectover", function (pointer, go) {
            go.setDisplaySize(gemSize + 6, gemSize + 6);
        });
        this.input.on("gameobjectout", function (pointer, go) {
            go.setDisplaySize(gemSize, gemSize);
        })
    }
}
