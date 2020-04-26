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
                } while (this.hasMatchAt(row, col));
            }
        }
    }

    get(i, j) {
        return this.m[i][j];
    }

    setId(i, j, id) {
        this.m[i][j].id = id;
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

    getGemId(gem) {
        return this.getId(gem.row, gem.col);
    }

    hasMatch() {
        for (let row = 0; row < this.nrows; row++) {
            for (let col = 0; col < this.ncols; col++) {
                if (this.hasMatchAt(row, col)) {
                    return true;
                }
            }
        }
        return false;
    }

    hasMatchAt(row, col) {
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

    getMatchedGems() {
        let matched = new Set();
        for (let row = 0; row < this.nrows; row++) {
            for (let col = 0; col < this.ncols; col++) {
                this.getMatchAt(row, col).forEach(elem => {
                    matched.add(elem);
                });

            }
        }
        return Array.from(matched);
    }

    getMatchAt(row, col) {
        let matched = []
        let m = this.m;
        let orig = this.m[row][col].id;
        if (row > 1) {
            if (orig == m[row - 1][col].id && orig == m[row - 2][col].id) {
                matched.push(m[row][col].gem);
                matched.push(m[row - 1][col].gem);
                matched.push(m[row - 2][col].gem);
            }
        }
        if (col > 1) {
            if (orig == m[row][col - 1].id && orig == m[row][col - 2].id) {
                matched.push(m[row][col].gem);
                matched.push(m[row][col - 1].gem);
                matched.push(m[row][col - 2].gem);
            }
        }
        return matched;
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

    swapGems(gem1, gem2) {
        let temp = {
            r1: gem1.row, c1: gem1.col,
            r2: gem2.row, c2: gem2.col,
        }
        let m = this.m;

        // swap values
        // swap gems
        let tGem = m[temp.r1][temp.c1];
        m[temp.r1][temp.c1] = m[temp.r2][temp.c2];
        m[temp.r2][temp.c2] = tGem;

        // adjust gems data (rows&cols)
        gem1.row = temp.r2;
        gem1.col = temp.c2;
        gem2.row = temp.r1;
        gem2.col = temp.c1;
    }
}