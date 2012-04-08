'use strict';

/*
small:  new Setting(8, 8, 10) 
medium: new Setting(16, 16, 40) 
large:  new Setting(16, 32, 80)
*/

var Game = function(width, height, numMines) { 
    var idx;

    this.width = width; 
    this.height = height; 
    this.numCells = width * height; 
    this.numMines = numMines;
    this.isMine = []; 
    this.isFlagged = []; 
    this.isRevealed = []; 
    this.mineCount = []; 
    this.explodedIdx;
    this.isOver = false;
    this.minesArePlaced = false;

    for (idx = 0; idx < this.numCells; idx++) { 
        this.isMine[idx] = false; 
        this.isFlagged[idx] = false; 
        this.isRevealed[idx] = false; 
        this.mineCount[idx] = 0; 
    }
};


Game.prototype.placeMines = function (avoidIdx) {
    // a human mine-placement avoids placing mines at or around the user's
    // first clicked field.
    //
    // We approach this by shuffling the mines evenly into all the fields
    // except the last few (corresponding to the number of fields that will need
    // to be avoided).  We swap these empty fields with the actual fields that
    // are supposed to be avoided.
    var idx;

    // add the mines to the beginning of the board
    for (idx = 0; idx < this.numMines; idx++) { 
        this.isMine[idx] = true;
    }

    // figure out which fields to avoid
    var avoidIdxs = [avoidIdx].concat(this.neighbors(avoidIdx));

    // shuffle the mines in, leaving the last `avoidIdxs.length` fields alone/empty.
    for (idx = this.numCells - 1 - avoidIdxs.length; idx >= 0; idx--) {
        var rand = Math.floor(Math.random() * (idx + 1));
        var tmp = this.isMine[idx];
        this.isMine[idx] = this.isMine[rand];
        this.isMine[rand] = tmp;
    }

    // Put the mines that are in the avoid fields into the empty fields at the end
    for (var i = 0; i < avoidIdxs.length; i++) {
        this.isMine[this.numCells - 1 - i] = this.isMine[avoidIdxs[i]];
        this.isMine[avoidIdxs[i]] = false;
    }

    // add the neighbor counts
    for (idx = 0; idx < this.numCells; idx++) {
        // THOUGHT: this mapping and filtering is encouraging me to create
        // isMine, isFlagged, etc functions, and to store a single cells array
        // (bit flipping fun!) with values 0-7 representing the possible
        // states. There is also a mineCount array. But that's it.
        var that = this;
        var neighWithMines = this.neighbors(idx).filter(function (idx) { 
            return that.isMine[idx];
        });
        this.mineCount[idx] = neighWithMines.length;
    }
}

Game.prototype.toggleFlag = function (idx) {
    if (this.isOver || this.isRevealed[idx]) {
        return;
    }
    this.isFlagged[idx] = this.isFlagged[idx] ? false : true;
}

// return list of cell's neighbors
Game.prototype.neighbors = function (idx) {
    var r, c, newR, newC, neighbors, offsets;
    r = Math.floor(idx / this.width);
    c = idx % this.width;

    neighbors = [];
    for (var rDelta = -1; rDelta <= 1; rDelta++) {
        for (var cDelta = -1; cDelta <= 1; cDelta++) {
            if (rDelta === 0 && cDelta === 0) {
                continue; // don't count self as neighbor
            }
            newR = r + rDelta;
            newC = c + cDelta;
            if ((0 <= newC && newC < this.width) && (0 <= newR && newR < this.height)) {
                neighbors.push(newR * this.width + newC);
            }
        }
    }

    return neighbors;
}

Game.prototype.end = function (idx) {
    if (this.isOver) {
        return;
    }
    this.isOver = true;
    this.explodedIdx = idx;
}

Game.prototype.clear = function(idx) {
    if (this.minesArePlaced === false) {
        this.placeMines(idx);
        this.minesArePlaced = true;
    }

    if (this.isFlagged[idx] || this.isOver) {
        return;
    }
    
    this.recursiveClear(idx);

    // end game if they clicked a mine
    if (this.isMine[idx]) {
        this.end(idx);
    }
}

Game.prototype.surroundClear = function(idx) {
    if (this.isRevealed[idx]) {
        // go ahead if the user has flagged the right amount of surrounding mines
        var neighIdxs = this.neighbors(idx);
        var flagCount = 0;
        for (var i = 0; i < neighIdxs.length; i++) {
            if (this.isFlagged[neighIdxs[i]]) {
                flagCount++;
            }
        }
        if (flagCount === this.mineCount[idx]) {
            for (var i = 0; i < neighIdxs.length; i++) {
                this.clear(neighIdxs[i]);
            }
        }
    }
}

Game.prototype.recursiveClear = function(idx) {
    if (this.isRevealed[idx]) {
        return;
    }

    this.isRevealed[idx] = true;
    if (! this.isMine[idx] && this.mineCount[idx] === 0) {
        var neighIdxs = this.neighbors(idx);
        for (var i=0; i<neighIdxs.length; i++) {
            this.recursiveClear(neighIdxs[i]);
        }
    }

}


var view = (function () {
    var $table;
    var game;
    var cells = []; //a quick way to look up the DOM cell given its index

    function setTable($t) { $table = $t; } // the view will update this table
    function setGame(g) { game = g; } // the view uses this game for data

    // create a new table to fit the game
    function init() {
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
    function update(idx) {
        if (idx) {
            updateCell(idx);
        }
        else { // no idx was given, so update the entire table
            for (idx=0; idx<game.numCells; idx++) {
                updateCell(idx);
            }
        }
    }

    function updateCell(idx) {
        var $cell = $(cells[idx]);
        $cell.removeClass();

        if (game.isRevealed[idx]) {
            $cell.addClass('open');
        } else {
            $cell.addClass('closed');
        }

        if (game.explodedIdx == idx) {
            $cell.addClass('explosion');
        } else if (game.isFlagged[idx]) {
            if (game.isOver) {
                $cell.addClass(game.isMine[idx] ? 'goodflag' : 'badflag');
            } else {
                $cell.addClass('flag');
            }
        } else if (game.isOver && game.isMine[idx]) {
            $cell.addClass('mine');
        } else if (game.isRevealed[idx]) {
            $cell.html(game.mineCount[idx]);
        }
    }

    return { 
        init: init,
        update: update,
        setTable: setTable,
        setGame: setGame
    }
})();


// CONTROLLER
$(document).ready(function () {
    var game;
    var depressedCells = [];

    function newGame() {
        game = new Game(8, 8, 10);
        view.setGame(game);
        view.setTable($('table'));
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
        if (! game.isOver) {
            depressedCells = [e.target];
            if (e.which === 2) { // MMB
                var neighborIdxs = game.neighbors(tdToIdx(e.target));
                for (var i = 0; i < neighborIdxs.length; i++) {
                    depressedCells.push(
                        document.getElementById('cell-' + neighborIdxs[i])
                    );
                }
            }
            $(depressedCells).addClass('depressed');
        }
    });

    $('table').on('mouseup', 'td', function (e) {
        var idx = tdToIdx(e.target);
        if (e.target === depressedCells[0]) {
            switch(e.which) {
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


    $('table').on('mouseout', 'td', function(e) {
        if (e.target === depressedCells[0]) {
            $(depressedCells).removeClass('depressed');
        }
    });

    $('table').on('mouseenter', 'td', function(e) {
        if (e.target === depressedCells[0]) {
            $(depressedCells).addClass('depressed');
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
