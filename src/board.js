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
                let gem = this.createGem(x, y, match3.getId(row, col));
                match3.setGem(row, col, gem);
            }
        }
    }

    createGem(x, y, id) {
        let gem = this.add.sprite(x, y, 'gems', id);
        gem.setDisplaySize(gemSize, gemSize);
        gem.setInteractive();
        this.input.on("gameobjectover", onGemOver);
        this.input.on("gameobjectout", onGemOut);
        this.input.on("gameobjectdown", onGemDown);
        return gem;
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
        return;
    }

    let match = match3.getMatchedGems();
    let scene = gem1.scene;
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
    let scene = gems[0].scene;
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

    gemTransfers.forEach(transfer => {
        scene.tweens.add({
            targets: transfer.gem,
            duration: transfer.dist * velocity,
            x: transfer.x,
            y: transfer.y,
            ease: "Power1"
        });
    });

    gems.forEach(gem => { gem.destroy(); });
}