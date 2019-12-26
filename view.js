/* The view-controller separation isn't too hot in this version of the program.
 * The controller has some view-code directly in it. I may clean that up in
 * later releases.
 */

var createView = ((game, $table) => {
    var cells = []; //a quick way to look up the DOM cell given its index

    // create a new table to fit the game
    var init = () => {
        var r;
        var c;
        var contents;
        var idx;
        var row;
        var cell;
        contents = document.createDocumentFragment();
        for (r=0; r<game.height; r++) {
            row = document.createElement('tr');
            for (c=0; c<game.width; c++) {
                cell = document.createElement('td');
                idx = r * game.width + c;
                cell.id = "cell-" + idx;
                cells[idx] = cell;
                row.appendChild(cell);
            }
            contents.appendChild(row);
        }
        $table.html(contents);

        // reset the win/lose header status
        $('#header').removeClass();
    };

    // update all table cells to match the game state
    var update = () => {
        for (var idx=0; idx<game.numCells; idx++) {
            updateCell(idx);
        }

        if (game.isOver()) {
            $('#header').removeClass();
            $('#header').addClass(game.isWon() ? 'win' : 'lose');
        }
    };

    var updateCell = idx => {
        var $cell = $(cells[idx]);
        $cell.removeClass();

        if (game.isRevealed(idx)) {
            $cell.addClass('open');
        } else {
            $cell.addClass('closed');
        }

        if (game.getExplodedIdx() === idx) {
            $cell.addClass('explosion');
        } else if (game.isFlagged(idx)) {
            if (game.isOver()) {
                $cell.addClass(game.isMine(idx) ? 'goodflag' : 'badflag');
            } else {
                $cell.addClass('flag');
            }
        } else if (game.isOver() && game.isMine(idx)) {
            $cell.addClass('mine');
        } else if (game.isRevealed(idx)) {
            var count = game.mineCount(idx);
            $cell.html(count === 0 ? ' ' : count);
        }
    };

    return { init
           , update
           };
});
