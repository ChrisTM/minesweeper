import { Game } from './model';

/* The view-controller separation isn't too hot in this version of the program.
 * The controller has some view-code directly in it. I may clean that up in
 * later releases.
 */

export class View {
  // a quick way to look up the DOM cell given its index
  cells: HTMLElement[] = [];
  private header = document.querySelector('#header')!;

  constructor(private game: Game, table: HTMLTableElement) {
    const contents = document.createDocumentFragment();
    for (let r = 0; r < this.game.height; r++) {
      const row = document.createElement('tr');
      for (let c = 0; c < this.game.width; c++) {
        const cell = document.createElement('td');
        const idx = r * this.game.width + c;
        cell.dataset.idx = idx.toString();
        this.cells[idx] = cell;
        row.appendChild(cell);
      }
      contents.appendChild(row);
    }
    table.innerHTML = '';
    table.appendChild(contents);

    // reset the win/lose header status
    this.header.className = '';
  }

  // update all table cells to match the game state
  update() {
    for (let idx = 0; idx < this.game.numCells; idx++) {
      this.updateCell(idx);
    }

    if (this.game.isOver) {
      this.header.className = '';
      this.header.classList.add(this.game.isWon ? 'win' : 'lose');
    }
  }

  private updateCell(idx: number) {
    const cell = this.cells[idx];
    cell.className = '';

    if (this.game.isRevealed[idx]) {
      cell.classList.add('open');
    } else {
      cell.classList.add('closed');
    }

    if (this.game.explodedIdx === idx) {
      cell.classList.add('explosion');
    } else if (this.game.isFlagged[idx]) {
      if (this.game.isOver) {
        cell.classList.add(this.game.isMine[idx] ? 'goodflag' : 'badflag');
      } else {
        cell.classList.add('flag');
      }
    } else if (this.game.isOver && this.game.isMine[idx]) {
      cell.classList.add('mine');
    } else if (this.game.isRevealed[idx]) {
      const count = this.game.mineCount[idx];
      cell.innerHTML = count === 0 ? ' ' : count.toString();
    }
  }
}
