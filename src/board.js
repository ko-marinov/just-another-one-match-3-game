import 'phaser';
import { Match3 } from "./match3.js";
// assets
import bgImg from '../assets/background.png';
import boardImg from '../assets/board_9x9_dark_grey.png';
import gemsSpritesheet from '../assets/Gems6colours_big.png';

const nrows = 9;
const ncols = 9;
const ngems = 6;

const boardSize = 504;
const cellSize = boardSize / 9;
const gemSize = cellSize - 16;

var match3 = new Match3(nrows, ncols, ngems);
var scene;
var leftTopPos;

function getPosByRowCol(row, col) {
    return {
        x: leftTopPos.x + col * cellSize,
        y: leftTopPos.y + row * cellSize
    };
}

export class Board extends Phaser.Scene {
    constructor() {
        super("BoardScene");
    }

    preload() {
        this.load.image("bg", bgImg);
        this.load.image("board", boardImg);
        this.load.spritesheet("gems", gemsSpritesheet, {
            frameWidth: 16,
            frameHeight: 16,
            spacing: 1
        });
    }

    create() {
        scene = this;
        match3.generateField();

        let width = this.game.config.width;
        let height = this.game.config.height;
        this.add.sprite(width / 2, height / 2, 'bg');
        this.board = this.add.sprite(width / 2, height / 2, 'board');
        this.board.setDisplaySize(boardSize, boardSize);
        leftTopPos = {
            x: (width - boardSize) / 2 + cellSize / 2,
            y: (height - boardSize) / 2 + cellSize / 2
        };
        for (let row = 0; row < nrows; row++) {
            for (let col = 0; col < ncols; col++) {
                let pos = getPosByRowCol(row, col);
                let gem = this.createGem(pos.x, pos.y, match3.getId(row, col));
                match3.setGem(row, col, gem);
            }
        }
    }

    createGem(x, y, id) {
        let gem = this.add.sprite(x, y, 'gems', id);
        gem.setDisplaySize(gemSize, gemSize);
        gem.setInteractive();
        gem.on("pointerover", onGemOver);
        gem.on("pointerout", onGemOut);
        gem.on("pointerdown", onGemDown);
        return gem;
    }
}

var selectedGem = null;
var processingMatches = false;

function onGemOver(pointer) {
    this.setDisplaySize(gemSize + 6, gemSize + 6);
}

function onGemOut(pointer) {
    if (this != selectedGem) {
        this.setDisplaySize(gemSize, gemSize);
    }
}

function onGemDown(pointer) {
    if (processingMatches) {
        return;
    }
    if (selectedGem != null) {
        if (this === selectedGem) {
            selectedGem = null;
            return;
        }
        if (match3.getNeighbors(selectedGem).indexOf(this) != -1) {
            swapGems(this, selectedGem, onCompleteSwapGems);
            selectedGem = null;
            return;
        }

        selectedGem.setDisplaySize(gemSize, gemSize);
    }

    selectedGem = this;
}

function swapGems(gem1, gem2, callback) {
    gem1.setDisplaySize(gemSize, gemSize);
    gem2.setDisplaySize(gemSize, gemSize);

    let target1 = getPosByRowCol(gem2.row, gem2.col);
    let target2 = getPosByRowCol(gem1.row, gem1.col);

    scene.tweens.add({
        targets: gem1,
        duration: 300,
        x: target1.x,
        y: target1.y,
        onComplete: callback,
        onCompleteParams: [gem1, gem2]
    });
    scene.tweens.add({
        targets: gem2,
        duration: 300,
        x: target2.x,
        y: target2.y
    });
    match3.swapGems(gem1, gem2);
}

function onCompleteSwapGems(tween, targets, gem1, gem2) {
    if (!match3.hasMatch()) {
        swapGems(gem1, gem2, null);
        return;
    }

    handleMatches(gem1.scene);
}

function handleMatches(scene) {
    let match = match3.getMatchedGems();
    if (!match.length) {
        processingMatches = false;
        return;
    }
    processingMatches = true;
    scene.tweens.add({
        targets: match,
        duration: 300,
        delay: 30,
        alpha: 0,
        onComplete: function (tween, targets) {
            destroyGems(targets);
        }
    });
}

function destroyGems(gems) {
    let velocity = 180;
    let height = scene.game.config.height;
    let topY = (height - boardSize) / 2 - cellSize / 2;
    let gemTransfers = [];

    let deepestGemInCol = [];
    gems.forEach(gem => {
        gem.toDestroy = true;
        let c = gem.col;
        if (!deepestGemInCol[c] || gem.row > deepestGemInCol[c].row) {
            deepestGemInCol[c] = gem;
        }
    });
    for (let col = 0; col < ncols; col++) {
        if (!deepestGemInCol[col]) { continue; }
        let gem = deepestGemInCol[col]
        let shift = 1;
        let row = gem.row;
        let x = gem.x;
        let y = gem.y;
        let targetRow = row;
        let targetCol = col;
        while (row > 0) {
            row -= 1;
            let g = match3.getGem(row, col);
            if (g.toDestroy) {
                shift += 1;
            }
            else {
                gemTransfers.push({ gem: g, dist: shift, x: x, y: y });
                match3.setId(targetRow, col, match3.getId(g.row, g.col));
                match3.setGem(targetRow, targetCol, g);
                y -= cellSize;
                targetRow -= 1;
            }
        }
        let spawnX = x;
        let spawnY = topY;
        for (let i = 0; i < shift; i++) {
            let newGemId = Math.floor(Math.random() * ngems);
            let newGem = scene.createGem(spawnX, spawnY, newGemId);
            gemTransfers.push({ gem: newGem, dist: shift, x: x, y: y });
            match3.setId(targetRow, col, newGemId);
            match3.setGem(targetRow, targetCol, newGem);
            y -= cellSize;
            spawnY -= cellSize;
            targetRow -= 1;
        }
    }

    let maxDuration = 0;
    gemTransfers.forEach(transfer => {
        scene.tweens.add({
            targets: transfer.gem,
            duration: transfer.dist * velocity,
            x: transfer.x,
            y: transfer.y,
            ease: "Power1"
        });
        if (transfer.dist * velocity > maxDuration) {
            maxDuration = transfer.dist * velocity;
        }
    });

    scene.time.delayedCall(maxDuration, handleMatches, [scene]);

    gems.forEach(gem => { gem.destroy(); });
}