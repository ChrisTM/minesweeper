import { createGame } from './model';

/* The view-controller separation isn't too hot in this version of the program.
 * The controller has some view-code directly in it. I may clean that up in
 * later releases.
 */

export function createView(
  game: ReturnType<typeof createGame>,
  table: HTMLTableElement
) {
  const cells: HTMLElement[] = []; //a quick way to look up the DOM cell given its index
  const header = document.querySelector('#header')!;

  // create a new table to fit the game
  function init() {
    const contents = document.createDocumentFragment();
    for (let r = 0; r < game.height; r++) {
      const row = document.createElement('tr');
      for (let c = 0; c < game.width; c++) {
        const cell = document.createElement('td');
        const idx = r * game.width + c;
        cell.id = `cell-${idx}`;
        cells[idx] = cell;
        row.appendChild(cell);
      }
      contents.appendChild(row);
    }
    table.innerHTML = '';
    table.appendChild(contents);

    // reset the win/lose header status
    header.className = '';
  }

  // update all table cells to match the game state
  function update() {
    for (let idx = 0; idx < game.numCells; idx++) {
      updateCell(idx);
    }

    if (game.isOver()) {
      header.className = '';
      header.classList.add(game.isWon() ? 'win' : 'lose');
    }
  }

  function updateCell(idx: number) {
    const cell = cells[idx];
    cell.className = '';

    if (game.isRevealed(idx)) {
      cell.classList.add('open');
    } else {
      cell.classList.add('closed');
    }

    if (game.getExplodedIdx() === idx) {
      cell.classList.add('explosion');
    } else if (game.isFlagged(idx)) {
      if (game.isOver()) {
        cell.classList.add(game.isMine(idx) ? 'goodflag' : 'badflag');
      } else {
        cell.classList.add('flag');
      }
    } else if (game.isOver() && game.isMine(idx)) {
      cell.classList.add('mine');
    } else if (game.isRevealed(idx)) {
      const count = game.mineCount(idx);
      cell.innerHTML = count === 0 ? ' ' : count.toString();
    }
  }

  return { init, update };
}
