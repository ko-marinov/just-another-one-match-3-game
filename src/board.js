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

export class Board extends Phaser.Scene {
    constructor() {
        super("BoardScene");
        this.selectedGem = null;
        this.processingMatches = false;
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
        this.match3 = new Match3(nrows, ncols, ngems);
        this.match3.generateField();

        let width = this.game.config.width;
        let height = this.game.config.height;
        this.add.sprite(width / 2, height / 2, 'bg');
        this.board = this.add.sprite(width / 2, height / 2, 'board');
        this.board.setDisplaySize(boardSize, boardSize);
        this.leftTopPos = {
            x: (width - boardSize) / 2 + cellSize / 2,
            y: (height - boardSize) / 2 + cellSize / 2
        };
        for (let row = 0; row < nrows; row++) {
            for (let col = 0; col < ncols; col++) {
                let pos = this.getPosByRowCol(row, col);
                let gem = this.createGem(pos.x, pos.y, this.match3.getId(row, col));
                this.match3.setGem(row, col, gem);
            }
        }
    }

    createGem(x, y, id) {
        let gem = this.add.sprite(x, y, 'gems', id);
        let context = {
            gem: gem,
            scene: this
        };
        gem.setDisplaySize(gemSize, gemSize);
        gem.setInteractive();
        gem.on("pointerover", onGemOver, context);
        gem.on("pointerout", onGemOut, context);
        gem.on("pointerdown", onGemDown, context);
        return gem;
    }

    getPosByRowCol(row, col) {
        return {
            x: this.leftTopPos.x + col * cellSize,
            y: this.leftTopPos.y + row * cellSize
        };
    }

    swapGems(gem1, gem2, callback) {
        gem1.setDisplaySize(gemSize, gemSize);
        gem2.setDisplaySize(gemSize, gemSize);

        let target1 = this.getPosByRowCol(gem2.row, gem2.col);
        let target2 = this.getPosByRowCol(gem1.row, gem1.col);

        this.tweens.add({
            targets: gem1,
            duration: 300,
            x: target1.x,
            y: target1.y,
            onComplete: callback,
            onCompleteParams: [gem1, gem2],
            onCompleteScope: this
        });
        this.tweens.add({
            targets: gem2,
            duration: 300,
            x: target2.x,
            y: target2.y
        });
        this.match3.swapGems(gem1, gem2);
    }

    onCompleteSwapGems(tween, targets, gem1, gem2) {
        if (!this.match3.hasMatch()) {
            this.swapGems(gem1, gem2, null);
            return;
        }

        this.handleMatches();
    }

    handleMatches() {
        let match = this.match3.getMatchedGems();
        if (!match.length) {
            this.processingMatches = false;
            return;
        }
        this.processingMatches = true;
        this.tweens.add({
            targets: match,
            duration: 300,
            delay: 30,
            alpha: 0,
            onComplete: function (tween, targets) {
                this.destroyGems(targets);
            },
            onCompleteScope: this
        });
    }

    destroyGems(gems) {
        let velocity = 180;
        let height = this.game.config.height;
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
                let g = this.match3.getGem(row, col);
                if (g.toDestroy) {
                    shift += 1;
                }
                else {
                    gemTransfers.push({ gem: g, dist: shift, x: x, y: y });
                    this.match3.setId(targetRow, col, this.match3.getId(g.row, g.col));
                    this.match3.setGem(targetRow, targetCol, g);
                    y -= cellSize;
                    targetRow -= 1;
                }
            }
            let spawnX = x;
            let spawnY = topY;
            for (let i = 0; i < shift; i++) {
                let newGemId = Math.floor(Math.random() * ngems);
                let newGem = this.createGem(spawnX, spawnY, newGemId);
                gemTransfers.push({ gem: newGem, dist: shift, x: x, y: y });
                this.match3.setId(targetRow, col, newGemId);
                this.match3.setGem(targetRow, targetCol, newGem);
                y -= cellSize;
                spawnY -= cellSize;
                targetRow -= 1;
            }
        }

        let maxDuration = 0;
        gemTransfers.forEach(transfer => {
            this.tweens.add({
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

        this.time.delayedCall(maxDuration, this.handleMatches, null, this);

        gems.forEach(gem => { gem.destroy(); });
    }
}

function onGemOver(pointer) {
    if (!this.scene.processingMatches) {
        this.gem.setDisplaySize(gemSize + 6, gemSize + 6);
    }
}

function onGemOut(pointer) {
    if (this.gem != this.scene.selectedGem) {
        this.gem.setDisplaySize(gemSize, gemSize);
    }
}

function onGemDown(pointer) {
    let scene = this.scene;
    let gem = this.gem;
    if (scene.processingMatches) {
        return;
    }
    if (scene.selectedGem != null) {
        if (gem === scene.selectedGem) {
            scene.selectedGem = null;
            return;
        }
        if (scene.match3.getNeighbors(scene.selectedGem).indexOf(gem) != -1) {
            scene.swapGems(gem, scene.selectedGem, scene.onCompleteSwapGems);
            scene.selectedGem = null;
            return;
        }

        scene.selectedGem.setDisplaySize(gemSize, gemSize);
    }

    scene.selectedGem = gem;
}
