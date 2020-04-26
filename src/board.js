import 'phaser';
import { Match3 } from "./match3.js";
// assets
import boardImg from '../assets/board_9x9_dark_grey.png';
import gemsSpritesheet from '../assets/Gems6colours_big.png';

const nrows = 9;
const ncols = 9;
const ngems = 6;

const boardSize = 504;
const cellSize = boardSize / 9;
const gemSize = cellSize - 16;

var match3 = new Match3(nrows, ncols, ngems);

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
        match3.generateField();

        let width = this.game.config.width;
        let height = this.game.config.height;
        this.board = this.add.sprite(width / 2, height / 2, 'board');
        this.board.setDisplaySize(boardSize, boardSize);
        let leftTopPos = {
            x: (width - boardSize) / 2 + cellSize / 2,
            y: (height - boardSize) / 2 + cellSize / 2
        };
        for (let row = 0; row < nrows; row++) {
            for (let col = 0; col < ncols; col++) {
                let x = leftTopPos.x + col * cellSize;
                let y = leftTopPos.y + row * cellSize;
                let gem = this.add.sprite(x, y, 'gems', match3.getId(row, col));
                gem.setDisplaySize(gemSize, gemSize);
                gem.setInteractive();
                this.input.on("gameobjectover", onGemOver);
                this.input.on("gameobjectout", onGemOut);
                this.input.on("gameobjectdown", onGemDown);
                match3.setGem(row, col, gem);
            }
        }
    }
}

var selectedGem = null;

function onGemOver(pointer, gem) {
    gem.setDisplaySize(gemSize + 6, gemSize + 6);
}

function onGemOut(pointer, gem) {
    if (gem != selectedGem) {
        gem.setDisplaySize(gemSize, gemSize);
    }
}

function onGemDown(pointer, gem) {
    if (selectedGem != null) {
        if (gem === selectedGem) {
            selectedGem = null;
            return;
        }
        if (match3.getNeighbors(selectedGem).indexOf(gem) != -1) {
            swapGems(gem, selectedGem, onCompleteSwapGems);
            selectedGem = null
            return;
        }

        selectedGem.setDisplaySize(gemSize, gemSize);
    }

    selectedGem = gem;
}

function swapGems(gem1, gem2, callback) {
    gem1.setDisplaySize(gemSize, gemSize);
    gem2.setDisplaySize(gemSize, gemSize);

    let scene = gem1.scene;
    scene.tweens.add({
        targets: gem1,
        duration: 300,
        x: gem2.x,
        y: gem2.y,
        onComplete: callback,
        onCompleteParams: [gem1, gem2]
    });
    scene.tweens.add({
        targets: gem2,
        duration: 300,
        x: gem1.x,
        y: gem1.y
    });
    match3.swapGems(gem1, gem2);
}

function onCompleteSwapGems(tween, targets, gem1, gem2) {
    if (!match3.hasMatch()) {
        swapGems(gem1, gem2, null);
    }
}