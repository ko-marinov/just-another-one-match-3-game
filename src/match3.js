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
                    let gem = Math.floor(Math.random() * this.ngems);
                    this.m[row][col] = gem;
                } while (this.hasMatch(row, col));
            }
        }
    }

    get(i, j) {
        return this.m[i][j];
    }

    hasMatch(row, col) {
        let m = this.m;
        let orig = this.m[row][col];
        if (row > 1) {
            if (orig == m[row - 1][col] && orig == m[row - 2][col]) {
                return true;
            }
        }
        if (col > 1) {
            if (orig == m[row][col - 1] && orig == m[row][col - 2]) {
                return true;
            }
        }
        return false;
    }
}