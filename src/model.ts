export class Game {
  numCells: number;
  isMine: boolean[] = [];
  isFlagged: boolean[] = [];
  isRevealed: boolean[] = [];
  mineCount: number[] = [];
  isWon = false;
  isOver = false;
  explodedIdx: number | undefined;

  private minesArePlaced = false;

  constructor(
    public width: number,
    public height: number,
    private numMines: number,
  ) {
    this.numCells = width * height;
    for (let idx = 0; idx < this.numCells; idx++) {
      this.isFlagged[idx] = false;
      this.isMine[idx] = false;
      this.isRevealed[idx] = false;
      this.mineCount[idx] = 0;
    }
  }

  /* Place mines on the board and calculate the neighboring mine counts. */
  private placeMines(avoidIdx: number) {
    // Mines are placed with some friendliness; there is a mine-free zone
    // under and around the user's first click.
    //
    // To do this, we shuffle mines evenly into all the cells except the
    // last few (saving space equal to the size of the mine-free zone).  We
    // then place any mines that are in the mine-free zone in the empty
    // spaces we left during the shuffle.
    let idx: number;

    // figure out which fields to avoid
    const avoidIdxs = [avoidIdx].concat(this.neighbors(avoidIdx));

    // add mines to the beginning of the board
    for (idx = 0; idx < this.numMines; idx++) {
      this.isMine[idx] = true;
    }

    // evenly distribute the mines, leaving enough empty space at the end
    // to displace the mines placed in the mine-free zone
    for (idx = this.numCells - 1 - avoidIdxs.length; idx >= 0; idx--) {
      const rand = Math.floor(Math.random() * (idx + 1));
      const tmp = this.isMine[idx];
      this.isMine[idx] = this.isMine[rand];
      this.isMine[rand] = tmp;
    }

    // Put the mines in the mine-free zone into the empty fields at the end
    for (let i = 0; i < avoidIdxs.length; i++) {
      this.isMine[this.numCells - 1 - i] = this.isMine[avoidIdxs[i]];
      this.isMine[avoidIdxs[i]] = false; // clear the mine-free zone
    }

    // add the neighbor counts
    for (idx = 0; idx < this.numCells; idx++) {
      this.mineCount[idx] = this.neighbors(idx)
        .filter(idx => this.isMine[idx]).length;
    }
  }

  clear(idx: number) {
    if (this.isFlagged[idx] || this.isOver) {
      return;
    }

    if (this.minesArePlaced === false) {
      this.placeMines(idx);
      this.minesArePlaced = true;
    }

    if (this.isMine[idx]) {
      this.end(idx);
    } else {
      this.recursiveClear(idx);
    }

    if (this.isWin()) {
      this.end(undefined);
    }
  }

  surroundClear(idx: number) {
    if (this.isRevealed[idx]) {
      // go ahead if the user has flagged the right amount of surrounding
      // mines
      const neighIdxs = this.neighbors(idx);
      const flagCount = neighIdxs.filter(idx => this.isFlagged[idx]).length;

      if (flagCount === this.mineCount[idx]) {
        for (const idx of neighIdxs) {
          this.clear(idx);
        }
      }
    }
  }

  private recursiveClear(idx: number) {
    if (this.isRevealed[idx]) {
      return;
    }

    this.isRevealed[idx] = true;
    this.isFlagged[idx] = false;
    if (!this.isMine[idx] && this.mineCount[idx] === 0) {
      for (const neighborIdx of this.neighbors(idx)) {
        this.recursiveClear(neighborIdx);
      }
    }
  }

  private isWin() {
    const numRevealed = this.isRevealed.filter(revealed => revealed).length;
    return numRevealed + this.numMines === this.numCells;
  }

  private end(idx: number | undefined) {
    if (this.isOver) {
      return;
    }
    this.isOver = true;
    this.explodedIdx = idx;

    this.isWon = this.isWin();
  }

  toggleFlag(idx: number) {
    if (this.isOver || this.isRevealed[idx]) {
      return;
    }
    this.isFlagged[idx] = !this.isFlagged[idx];
  }

  // return list of cell's neighbors
  neighbors(idx: number) {
    const neighbors: number[] = [];
    const r = Math.floor(idx / this.width);
    const c = idx % this.width;
    const offsets = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    for (const [rOffset, cOffset] of offsets) {
      const newR = r + rOffset;
      const newC = c + cOffset;
      if (0 <= newC && newC < this.width && 0 <= newR && newR < this.height) {
        neighbors.push(newR * this.width + newC);
      }
    }
    return neighbors;
  }
}
