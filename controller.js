'use strict';

$(document).ready(function () {
    var settings = { 'small':  [ 8,  8, 10]
                   , 'medium': [16, 16, 40]
                   , 'large':  [32, 16, 80]
                   };
    var game, view;
    var depressedCells = [];
    var cheating = false;

    function newGame() {
        /*
        small:  ( 8,  8, 10)
        medium: (16, 16, 40)
        large:  (16, 32, 80)
        */
        var setting = settings[$('#setting').val()];
        console.log(setting);
        game = createGame.apply(this, setting);
        view = createView(game, $('table'));
        view.init();
        view.update();
    }

    function tdToIdx(cell) {
        return parseInt(cell.id.slice('cell-'.length));
    }

    $('#new-game').on('click', function(e) {
        newGame();
    });

    $('#validate').on('click', function(e) {
        // TODO: add some feedback like win/loss/whatever
        game.end();
        view.update();
    });

    $('#cheat').on('click', function(e) {
        cheating = e.target.checked;
    });

    // right-clicking on the cell borders would trigger context menu -- an annoying
    // behavior that we disable here
    $('table').on('contextmenu', function (e) {
        e.preventDefault();
    });

    // We use these mousedown/up/out/enter handlers instead of just 'click'
    // because we also want to set and remove the 'depressed' class so that the
    // fields consistently behave (both in effect and visually) like desktop
    // GUI buttons.
    $('table').on('mousedown', 'td', function (e) {
        if (! game.isOver()) {
            depressedCells = [e.target];
            if (e.which === 2) { // MMB
                var neighborIdxs = game.neighbors(tdToIdx(e.target));
                neighborIdxs.forEach(function (idx) {
                    depressedCells.push(
                        document.getElementById('cell-' + idx)
                    );
                });

            }
            $(depressedCells).addClass('depressed');
        }
    });

    $('table').on('mouseup', 'td', function (e) {
        var idx = tdToIdx(e.target);
        // check if mouse is released on same field mouse was pressed
        if (e.target === depressedCells[0]) {
            switch(e.which) {
                case 1: // LMB clears a mine
                    console.log('LMB click');
                    game.clear(idx);
                    break;
                case 2: // MMB clears surrounding mines
                    console.log('MMB click');
                    game.surroundClear(idx);
                    break;
                case 3: // RMB toggles a flag
                    console.log('RMB click');
                    game.toggleFlag(idx);
                    e.preventDefault();
                    break;
            }
            view.update();
        }
        $(depressedCells).removeClass('depressed');
        depressedCells = [];
    });

    $(document).on('mouseup', function (e) {
        $(depressedCells).removeClass('depressed');
        depressedCells = [];
    });


    $('table').on('mouseout', 'td', function(e) {
        if (e.target === depressedCells[0]) {
            $(depressedCells).removeClass('depressed');
        }
        $('#cheat-pixel').hide();
    });

    $('table').on('mouseenter', 'td', function(e) {
        if (e.target === depressedCells[0]) {
            $(depressedCells).addClass('depressed');
        }

        if (cheating) {
            if (game.isMine(tdToIdx(e.target))) {
                $('#cheat-pixel').show();
            } else {
                $('#cheat-pixel').hide();
            }
        }
    });

    // clicking and dragging in the right spot of a cell will cause a drag
    // event, preventing the mouseup from firing, causing depressedCells not to
    // clear. We prevent the drag so that this doesn't happen.
    $('table').on('dragstart', function (e) {
        e.preventDefault();
    });

    newGame();
});
