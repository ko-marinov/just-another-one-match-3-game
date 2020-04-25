import 'phaser'

export class Match3 {
    constructor(nrows, ncols, ngems) {
        this.nrows = nrows;
        this.ncols = ncols;
        this.ngems = ngems;
    }

    generateField() {
        this.m = [];
        for (let row = 0; row < this.nrows; row++) {
            this.m[row] = [];
            for (let col = 0; col < this.ncols; col++) {
                do {
                    let gemId = Math.floor(Math.random() * this.ngems);
                    this.m[row][col] = { id: gemId };
                } while (this.hasMatch(row, col));
            }
        }
    }

    get(i, j) {
        return this.m[i][j];
    }

    getId(i, j) {
        return this.get(i, j).id;
    }

    setGem(i, j, gem) {
        gem.row = i;
        gem.col = j;
        this.get(i, j).gem = gem;
    }

    getGem(i, j) {
        return this.get(i, j).gem;
    }

    hasMatch(row, col) {
        let m = this.m;
        let orig = this.m[row][col].id;
        if (row > 1) {
            if (orig == m[row - 1][col].id && orig == m[row - 2][col].id) {
                return true;
            }
        }
        if (col > 1) {
            if (orig == m[row][col - 1].id && orig == m[row][col - 2].id) {
                return true;
            }
        }
        return false;
    }

    getNeighbors(gem) {
        let i = gem.row;
        let j = gem.col;
        let neighbors = [];
        if (i > 0) { neighbors.push(this.getGem(i - 1, j)); }
        if (i < this.nrows - 1) { neighbors.push(this.getGem(i + 1, j)); }
        if (j > 0) { neighbors.push(this.getGem(i, j - 1)); }
        if (j < this.ncols - 1) { neighbors.push(this.getGem(i, j + 1)); }
        return neighbors;
    }
}