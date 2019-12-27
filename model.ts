export const createGame = (width, height, numMines) => {
  let idx;
  const numCells = width * height;
  const isMine = [];
  const isFlagged = [];
  const isRevealed = [];
  const mineCount = [];
  const indices = [];
  let explodedIdx;
  let isOver = false;
  let minesArePlaced = false;
  let isWon;

  for (idx = 0; idx < numCells; idx++) {
    isMine[idx] = false;
    isFlagged[idx] = false;
    isRevealed[idx] = false;
    indices[idx] = idx;
    mineCount[idx] = 0;
  }

  /* Place mines on the board and calculate the neighboring mine counts. */
  const placeMines = avoidIdx => {
    // Mines are placed with some friendliness; there is a mine-free zone
    // under and around the user's first click.
    //
    // To do this, we shuffle mines evenly into all the cells except the
    // last few (saving space equal to the size of the mine-free zone).  We
    // then place any mines that are in the mine-free zone in the empty
    // spaces we left during the shuffle.
    let idx;

    // figure out which fields to avoid
    const avoidIdxs = [avoidIdx].concat(neighbors(avoidIdx));

    // add mines to the beginning of the board
    for (idx = 0; idx < numMines; idx++) {
      isMine[idx] = true;
    }

    // evenly distribute the mines, leaving enough empty space at the end
    // to displace the mines placed in the mine-free zone
    for (idx = numCells - 1 - avoidIdxs.length; idx >= 0; idx--) {
      const rand = Math.floor(Math.random() * (idx + 1));
      const tmp = isMine[idx];
      isMine[idx] = isMine[rand];
      isMine[rand] = tmp;
    }

    // Put the mines in the mine-free zone into the empty fields at the end
    for (let i = 0; i < avoidIdxs.length; i++) {
      isMine[numCells - 1 - i] = isMine[avoidIdxs[i]];
      isMine[avoidIdxs[i]] = false; // clear the mine-free zone
    }

    // add the neighbor counts
    const isMineFn = idx => isMine[idx];
    for (idx = 0; idx < numCells; idx++) {
      mineCount[idx] = neighbors(idx).filter(isMineFn).length;
    }
  };

  const clear = idx => {
    if (isFlagged[idx] || isOver) {
      return;
    }

    if (minesArePlaced === false) {
      placeMines(idx);
      minesArePlaced = true;
    }

    if (isMine[idx]) {
      end(idx);
    } else {
      recursiveClear(idx);
    }

    if (isWin()) {
      end();
    }
  };

  const surroundClear = idx => {
    if (isRevealed[idx]) {
      // go ahead if the user has flagged the right amount of surrounding
      // mines
      const neighIdxs = neighbors(idx);
      const flagCount = neighIdxs.filter(idx => isFlagged[idx]).length;

      if (flagCount === mineCount[idx]) {
        neighIdxs.forEach(clear);
      }
    }
  };

  var recursiveClear = idx => {
    if (isRevealed[idx]) {
      return;
    }

    isRevealed[idx] = true;
    isFlagged[idx] = false;
    if (!isMine[idx] && mineCount[idx] === 0) {
      neighbors(idx).map(recursiveClear);
    }
  };

  var isWin = () => {
    const numRevealed = indices.filter(idx => isRevealed[idx]).length;
    return numRevealed + numMines === numCells;
  };

  var end = idx => {
    if (isOver) {
      return;
    }
    isOver = true;
    explodedIdx = idx;

    isWon = isWin();
  };

  const toggleFlag = idx => {
    if (isOver || isRevealed[idx]) {
      return;
    }
    isFlagged[idx] = isFlagged[idx] ? false : true;
  };

  // return list of cell's neighbors
  var neighbors = idx => {
    let r;
    let c;
    let newR;
    let newC;
    let neighbors;
    let offsets;
    r = Math.floor(idx / width);
    c = idx % width;
    offsets = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
    neighbors = [];
    for (let i = 0; i < offsets.length; i++) {
      newR = r + offsets[i][0];
      newC = c + offsets[i][1];
      if (0 <= newC && newC < width && 0 <= newR && newR < height) {
        neighbors.push(newR * width + newC);
      }
    }
    return neighbors;
  };

  // we expose the things needed by the controller and the view
  return {
    toggleFlag,
    clear,
    neighbors,
    end,
    surroundClear,
    width,
    height,
    numMines,
    numCells,
    getExplodedIdx() {
      return explodedIdx;
    },
    isOver() {
      return isOver;
    },
    isMine(idx) {
      return isMine[idx];
    },
    isRevealed(idx) {
      return isRevealed[idx];
    },
    isFlagged(idx) {
      return isFlagged[idx];
    },
    mineCount(idx) {
      return mineCount[idx];
    },
    isWon(idx) {
      return isWon;
    },
  };
};
