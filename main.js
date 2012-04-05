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

/*
var newGame = function(width, height, numMines) {
    return {
        width: width,
        height: height,
        numMines: numMines,
        isMine: isMine,
        isRevealed: isRevlead,
        isFlagged: isFlagged,
        mineCount: mineCount,
        isOver: isOver
    }
};
*/

Game.prototype.toggleFlag = function (idx) {
    this.isFlagged[idx] = this.isFlagged[idx] ? false : true;
}

Game.prototype.neighbors = function (idx) {
    var r, c, nr, nc, neighbors, offsets;
    r = Math.floor(idx / this.width);
    c = idx % this.width;
    offsets = [ [-1,-1], [ 0,-1], [ 1,-1]
              , [-1, 0],          [ 1, 0]
              , [-1, 1], [ 0, 1], [ 1, 1]
              ];
    neighbors = [];
    for (var i=0; i<offsets.length; i++) {
        nr = r + offsets[i][0];
        nc = c + offsets[i][1];
        if ((0 <= nc && nc < this.width) && (0 <= nr && nr < this.height)) {
            neighbors.push(nr * this.width + nc);
        }
    }
    return neighbors;
}

Game.prototype.end = function () {
    this.isOver = true;
}

Game.prototype.clear = function(idx) {
    if (this.isFlagged[idx]) {
        return;
    }
    
    this.recursiveClear(idx);

    // fail if they clicked a mine
    
    // show result if game over
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
            cells[idx].innerHTML = getIconFor(idx);
        }
        else { // no idx was given, so update the entire table
            for (idx=0; idx<game.numCells; idx++) {
                cells[idx].innerHTML = getIconFor(idx);
            }
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

    // right-clicking on the borders would trigger context menu, we disable that here
    $('table').on('contextmenu', function(e) {
        e.preventDefault();
    });

    newGame();
});
