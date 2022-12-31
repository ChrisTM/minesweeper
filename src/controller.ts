import { Game } from './model';
import { View } from './view';

const gameSizes: { [key: string]: [number, number, number]; } = {
  small: [8, 8, 10],
  medium: [16, 16, 40],
  large: [32, 16, 80],
};

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table')!;
  const title = document.querySelector('#title') as HTMLElement;
  const cheatPixel = document.querySelector('#cheat-pixel') as HTMLElement;
  const gameSize = document.querySelector('#game-size') as HTMLSelectElement;
  const newGameButton = document.querySelector(
    '#new-game',
  ) as HTMLButtonElement;

  let game: Game;
  let view: View;
  let depressedCells: HTMLElement[] = [];

  function newGame() {
    game = new Game(...gameSizes[gameSize.value]);
    view = new View(game, table);
    view.update();
  }

  function tdToIdx(cell: HTMLElement) {
    return parseInt(cell.dataset.idx!);
  }

  newGameButton.addEventListener('click', newGame);

  // right-clicking on the cell borders would trigger context menu -- an
  // annoying behavior that we disable here
  table.addEventListener('contextmenu', e => {
    e.preventDefault();
  });

  // We use these mousedown/up/out/enter handlers instead of just 'click'
  // because we also want to set and remove the 'depressed' class so that the
  // fields consistently behave (both in effect and visually) like desktop
  // GUI buttons.
  table.addEventListener('mousedown', e => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const innerEl = target.closest('td');
    if (!innerEl || !(e.currentTarget as Element).contains(innerEl)) {
      return;
    }
    if (!game.isOver) {
      depressedCells = [target];
      if (e.button === 1) {  // MMB
        const neighborIdxs = game.neighbors(tdToIdx(target));
        for (const idx of neighborIdxs) {
          depressedCells.push(view.cells[idx]);
        }
      }
      for (const cell of depressedCells) {
        cell.classList.add('depressed');
      }
    }
  });

  table.addEventListener('mouseup', e => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const innerEl = target.closest('td');
    if (!innerEl || !(e.currentTarget as Element).contains(innerEl)) {
      return;
    }
    const idx = tdToIdx(target);
    // check if mouse is released on same field mouse was pressed
    if (target === depressedCells[0]) {
      switch (e.button) {
        case 0: // LMB clears a mine
          game.clear(idx);
          break;
        case 1: // MMB clears surrounding mines
          game.surroundClear(idx);
          break;
        case 2: // RMB toggles a flag
          game.toggleFlag(idx);
          e.preventDefault();
          break;
      }
      view.update();
    }
    for (const cell of depressedCells) {
      cell.classList.remove('depressed');
    }
    depressedCells = [];
  });

  document.addEventListener('mouseup', e => {
    for (const cell of depressedCells) {
      cell.classList.remove('depressed');
    }
    depressedCells = [];
  });

  table.addEventListener('mouseout', e => {
    const target = e.target as HTMLElement;
    if (target === depressedCells[0]) {
      target.classList.remove('depressed');
    }
    cheatPixel.style.display = 'none';
  });

  table.addEventListener('mouseover', e => {
    const target = e.target as HTMLElement;
    const innerEl = (target as Element).closest('td');
    if (!innerEl || !(e.currentTarget as Element).contains(innerEl)) {
      return;
    }

    const clickedCell = depressedCells[0];
    if (clickedCell) {
      if (clickedCell === target) {
        target.classList.add('depressed');
      } else {
        target.classList.remove('depressed');
      }
    }

    if (cheating) {
      const isMine = game.isMine[tdToIdx(target)];
      cheatPixel.style.display = isMine ? 'block' : 'none';
    }
  });

  // clicking and dragging in the right spot of a cell will cause a drag
  // event, preventing the mouseup from firing, causing depressedCells not to
  // clear. We prevent the drag so that this doesn't happen.
  table.addEventListener('dragstart', e => {
    e.preventDefault();
  });

  // Turn on cheating when the user types 'xyzzy'.
  let cheating = false;
  // keypresses go into the buffer. We check for when it equals the cheat word.
  const cheatWord = ['x', 'y', 'z', 'z', 'y']; // xyzzy
  const cheatBuffer = new Array(cheatWord.length);
  document.addEventListener('keydown', e => {
    cheatBuffer.push(e.key.toLowerCase());
    cheatBuffer.shift();
    for (let i = 0; i < cheatBuffer.length; i++) {
      if (cheatBuffer[i] !== cheatWord[i]) {
        return; // happens when cheat code failed
      }
    }
    cheating = !cheating;
    title.style.transform = cheating ? 'rotate(180deg)' : 'none';
  });

  newGame();
});
