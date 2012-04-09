'use strict';

var createView = (function (game, $table) {
    var cells = []; //a quick way to look up the DOM cell given its index

    // create a new table to fit the game
    var init = function () {
        var r, c, contents, row, cell;
        contents = document.createDocumentFragment();
        for (r=0; r<game.height; r++) {
            var row = document.createElement('tr');
            for (c=0; c<game.width; c++) {
                var cell = document.createElement('td');
                var idx = r * game.width + c;
                cell.id = "cell-" + idx;
                cells[idx] = cell;
                row.appendChild(cell);
            }
            contents.appendChild(row);
        }
        $table.html(contents);
    }

    // update all table cells to match the game state
    var update = function () {
        for (var idx=0; idx<game.numCells; idx++) {
            updateCell(idx);
        }
    }

    var updateCell = function (idx) {
        var $cell = $(cells[idx]);
        $cell.removeClass();

        if (game.isRevealed(idx)) {
            $cell.addClass('open');
        } else {
            $cell.addClass('closed');
        }

        if (game.getExplodedIdx() == idx) {
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
    }

    return { init: init
           , update: update
           };
});