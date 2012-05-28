'use strict';

$(document).ready(function () {
    var settings = { 'small':  [ 8,  8, 10]
                   , 'medium': [16, 16, 40]
                   , 'large':  [32, 16, 80]
                   };
    var game, view;
    var depressedCells = [];
    // keypresses go into the buffer. We check for when it equals the cheat word.
    var cheating = false;

    function newGame() {
        var setting = settings[$('#setting').val()];
        game = createGame.apply(this, setting);
        view = createView(game, $('table'));
        view.init();
        view.update();
    }

    function tdToIdx(cell) {
        return parseInt(cell.id.slice('cell-'.length));
    }

    $('#new-game').on('click', function (e) {
        newGame();
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

    $(document).on('mouseup', function (e) {
        $(depressedCells).removeClass('depressed');
        depressedCells = [];
    });


    $('table').on('mouseout', 'td', function (e) {
        if (e.target === depressedCells[0]) {
            $(depressedCells).removeClass('depressed');
        }
        $('#cheat-pixel').hide();
    });

    $('table').on('mouseenter', 'td', function (e) {
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

    /* turn on cheating when the user types 'xyzzy' */
    var cheatWord = [88, 89, 90, 90, 89]; // xyzzy
    var cheatBuffer = new Array(cheatWord.length);
    $(document).on('keydown', function (e) {
        cheatBuffer.push(e.which);
        cheatBuffer.shift();

        for (var i = 0; i < cheatBuffer.length; i++) {
            if (cheatBuffer[i] !== cheatWord[i]) {
                return; // happens when cheat code failed
            }
        }

        if (cheating) {
            cheating = false;
            $('#title').css('transform', 'none');
            $('#title').css('-webkit-transform', 'none');
            $('#title').css('-moz-transform', 'none');
        } else {
            cheating = true;
            $('#title').css('transform', 'rotate(180deg)');
            $('#title').css('-webkit-transform', 'rotate(180deg)');
            $('#title').css('-moz-transform', 'rotate(180deg)');
        }
    });

    newGame();
});
