import { createGame } from './model';
import { createView } from './view';

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table');
  const title: HTMLElement = document.querySelector('#title');
  const cheatPixel: HTMLElement = document.querySelector('#cheat-pixel');
  const newGameButton = document.querySelector('#new-game');

  const settings = {
    small: [8, 8, 10],
    medium: [16, 16, 40],
    large: [32, 16, 80],
  };
  let game;
  let view;
  let depressedCells = [];
  // keypresses go into the buffer. We check for when it equals the cheat word.
  let cheating = false;

  function newGame() {
    const settingEl: HTMLSelectElement = document.querySelector('#setting');
    const setting = settings[settingEl.value];
    game = createGame.apply(this, setting);
    view = createView(game, table);
    view.init();
    view.update();
  }

  function tdToIdx(cell) {
    return parseInt(cell.id.slice('cell-'.length));
  }

  newGameButton.addEventListener('click', e => {
    newGame();
  });

  // right-clicking on the cell borders would trigger context menu -- an annoying
  // behavior that we disable here
  table.addEventListener('contextmenu', e => {
    e.preventDefault();
  });

  // We use these mousedown/up/out/enter handlers instead of just 'click'
  // because we also want to set and remove the 'depressed' class so that the
  // fields consistently behave (both in effect and visually) like desktop
  // GUI buttons.
  table.addEventListener('mousedown', e => {
    const innerEl = (e.target as Element).closest('td');
    if (!innerEl || !(e.currentTarget as Element).contains(innerEl)) return;
    if (!game.isOver()) {
      depressedCells = [e.target];
      if (e.which === 2) {
        // MMB
        const neighborIdxs = game.neighbors(tdToIdx(e.target));
        neighborIdxs.forEach(idx => {
          depressedCells.push(document.getElementById(`cell-${idx}`));
        });
      }
      $(depressedCells).addClass('depressed');
    }
  });

  table.addEventListener('mouseup', e => {
    const innerEl = (e.target as Element).closest('td');
    if (!innerEl || !(e.currentTarget as Element).contains(innerEl)) return;
    const idx = tdToIdx(e.target);
    // check if mouse is released on same field mouse was pressed
    if (e.target === depressedCells[0]) {
      switch (e.which) {
        case 1: // LMB clears a mine
          game.clear(idx);
          break;
        case 2: // MMB clears surrounding mines
          game.surroundClear(idx);
          break;
        case 3: // RMB toggles a flag
          game.toggleFlag(idx);
          e.preventDefault();
          break;
      }
      view.update();
    }
    $(depressedCells).removeClass('depressed');
    depressedCells = [];
  });

  document.addEventListener('mouseup', e => {
    $(depressedCells).removeClass('depressed');
    depressedCells = [];
  });

  table.addEventListener('mouseout', e => {
    const target = e.target as HTMLElement;
    if (target === depressedCells[0]) {
      target.classList.remove('depressed');
    }
    cheatPixel.style.display = 'none';
  });

  table.addEventListener('mouseenter', e => {
    const target = e.target as HTMLElement;
    const innerEl = (target as Element).closest('td');
    if (!innerEl || !(e.currentTarget as Element).contains(innerEl)) return;
    if (target === depressedCells[0]) {
      target.classList.remove('depressed');
    }

    if (cheating) {
      if (game.isMine(tdToIdx(target))) {
        cheatPixel.style.display = 'block';
      } else {
        cheatPixel.style.display = 'none';
      }
    }
  });

  // clicking and dragging in the right spot of a cell will cause a drag
  // event, preventing the mouseup from firing, causing depressedCells not to
  // clear. We prevent the drag so that this doesn't happen.
  table.addEventListener('dragstart', e => {
    e.preventDefault();
  });

  /* turn on cheating when the user types 'xyzzy' */
  const cheatWord = [88, 89, 90, 90, 89]; // xyzzy
  const cheatBuffer = new Array(cheatWord.length);
  document.addEventListener('keydown', e => {
    cheatBuffer.push(e.which);
    cheatBuffer.shift();

    for (let i = 0; i < cheatBuffer.length; i++) {
      if (cheatBuffer[i] !== cheatWord[i]) {
        return; // happens when cheat code failed
      }
    }

    if (cheating) {
      cheating = false;
      title.style.transform = 'none';
    } else {
      cheating = true;
      title.style.transform = 'rotate(180deg)';
    }
  });

  newGame();
});
