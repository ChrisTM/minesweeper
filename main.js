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
    this.isMine = []; 
    this.isFlagged = []; 
    this.isRevealed = []; 
    this.mineCount = []; 
    this.explodedIdx;
    this.isOver = false;

    for (idx = 0; idx < this.numCells; idx++) { 
        this.isMine[idx] = false; 
        this.isFlagged[idx] = false; 
        this.isRevealed[idx] = false; 
        this.mineCount[idx] = 0; 
    }

    // add the mines to the beginning of the board
    for (idx = 0; idx < numMines; idx++) { 
        this.isMine[idx] = true;
    }

    // shuffle the mines in
    for (idx = this.numCells - 1; idx >= 0; idx--) {
        var rand = Math.floor(Math.random() * (idx + 1));
        var tmp = this.isMine[idx];
        this.isMine[idx] = this.isMine[rand];
        this.isMine[rand] = tmp;
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
};

Game.prototype.toggleFlag = function (idx) {
    if (this.isOver || this.isRevealed[idx]) {
        return;
    }
    this.isFlagged[idx] = this.isFlagged[idx] ? false : true;
}

Game.prototype.neighbors = function (idx) {
    var r, c, newR, newC, neighbors, offsets;
    r = Math.floor(idx / this.width);
    c = idx % this.width;

    neighbors = [];
    for (var rDelta = -1; rDelta <= 1; rDelta++) {
        for (var cDelta = -1; cDelta <= 1; cDelta++) {
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
    if (this.isFlagged[idx] || this.isOver) {
        return;
    }
    
    this.recursiveClear(idx);

    // end game if they clicked a mine
    if (this.isMine[idx]) {
        this.end(idx);
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

    // return the character that represents the state that cell-idx is in.
    function getIconFor(idx) {
        /* Unrevealed icons...
         *   Unflagged: #
         *   Flagged: ? 
         * Revealed icons...
         *   No mine: <space> 1 2 3 4 5 6 7 8
         *   Unflagged mine: *
         *   Correctly flagged mine: +
         *   Incorrectly flagged mine: -
         *   Exploded mine: X
         */
        var icon = '';
        icon += game.isFlagged[idx] ? '?' : '&nbsp';
        icon += game.isMine[idx] ? '*' : '&nbsp';
        icon += game.isRevealed[idx] ? '.' : '#';
        icon += game.mineCount[idx];
        return icon;
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
    var depressedCell = null;

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
        // TODO: for now, this just reveals everything, doesn't score, etc.
        game.end();
        view.update();
    });

    // when user clicks a mine field
    $('table').on('click', 'td', function (e) {
        var idx = tdToIdx(e.target);
        game.clear(idx);
        view.update();
        // get status
    });

    // when user right-clicks on a mine field
    $('table').on('contextmenu', 'td', function (e) {
        var idx = tdToIdx(e.target);
        game.toggleFlag(idx);
        view.update(idx);
        e.preventDefault();
    });

    // right-clicking on the borders would trigger context menu -- an annoying
    // behavior that we disable here
    $('table').on('contextmenu', function(e) {
        e.preventDefault();
    });

    // these mousedown/up/out/enter handlers set and remove the 'depressed'
    // class so that the cells respond to clicks like traditional desktop GUI
    // buttons
    $('table').on('mousedown', 'td', function(e) {
        depressedCell = e.target.id;
        $(e.target).addClass('depressed');
    });

    $('table').on('mouseup', 'td', function(e) {
        depressedCell = null;
        $(e.target).removeClass('depressed');
    });

    $('table').on('mouseout', 'td', function(e) {
        $(e.target).removeClass('depressed');
    });

    $('table').on('mouseenter', 'td', function(e) {
        if (e.target.id === depressedCell) {
            $(e.target).addClass('depressed');
        }
    });

    newGame();
});
