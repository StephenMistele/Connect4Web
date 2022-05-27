var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Queue = /** @class */ (function () {
    function Queue() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        console.log(params);
        this.items = __spreadArray([], params, true);
    }
    Queue.prototype.enqueue = function (item) {
        this.items.push(item);
    };
    Queue.prototype.dequeue = function () {
        return this.items.shift();
    };
    Queue.prototype.len = function () {
        return this.items.length;
    };
    return Queue;
}());
var games = new Map();
var players = new Map();
var playerqueue = new Queue();
module.exports = {
    //****** EXTERNAL FUNCTIONS ******
    createBoard: function (playerid, gameid) {
        //if player has another game associated, delete if over, over if running
        //if game room already exists
        if (games.has(gameid)) {
            console.log(games.get(gameid));
            //if game room only has 1 player
            if (games.get(gameid).guestid == "0") {
                games.get(gameid).guestid = playerid;
                return "game joined";
            }
            //if game room has 2 players already
            else if (games.get(gameid).guestid == playerid || games.get(gameid).hostid == playerid)
                return "already in game";
            else
                return "game full";
        }
        //if game room doesn't exist
        else {
            var newboard = [];
            for (var x = 0; x < 6; x++) {
                newboard[x] = [];
                for (var y = 0; y < 7; y++) {
                    newboard[x][y] = 0;
                }
            }
            var values = {
                board: newboard,
                hostid: playerid,
                guestid: "0",
                hostturn: false,
                winner: "0",
                lastused: Date.now().toLocaleString()
            };
            games.set(gameid, values);
            return "new game created";
        }
    },
    queue: function (playerid) {
        playerqueue.enqueue(playerid);
        if (playerqueue.len() > 1) {
            var player1 = playerqueue.dequeue();
            var player2 = playerqueue.dequeue();
        }
        return "meep";
    },
    debug: function () {
        for (var item in games)
            console.log(item);
        console.log("GAMES*****************************************************", games, "\n");
        console.log("PLAYERS*****************************************************", players, "\n");
        return [games, players];
    },
    checkTurn: function (playerid, gameid) {
        //if game doesn't exist, return -3
        if (!games.has(gameid))
            return [-3, 0];
        //if game over (you lost) return -2 along with winning move and winning player
        if (games.get(gameid).winner != "0")
            return [-2, games.get(gameid).board, games.get(gameid).winner];
        //only one person in game return -1
        if (games.get(gameid).guestid == '0')
            return [-1, 0];
        //return [1, board] for 'your move' 0 for not
        if (playerid == games.get(gameid).hostid) {
            //player is host
            if (games.get(gameid).hostturn)
                return [1, games.get(gameid).board];
            return [0, 0];
        }
        else {
            //player is guest
            if (games.get(gameid).hostturn) {
                return [0, 0];
            }
            return [1, games.get(gameid).board];
        }
    },
    generateGameID: function (playerid) {
        var counter = 0;
        var id = (Math.floor(Math.random() * 899999) + 100000).toString();
        while (games.has(id)) {
            id = (Math.floor(Math.random() * 899999) + 100000).toString();
            counter++;
            if (counter > 999999 * 2)
                return -1;
        }
        players.get(playerid).gameid = id;
        return id.toString();
    },
    generatePlayerID: function () {
        var counter = 0;
        var id = (Math.floor(Math.random() * 999999) + 100000).toString();
        while (players.has(id)) {
            id = (Math.floor(Math.random() * 999999) + 100000).toString();
            counter++;
            if (counter > 999999 * 2)
                return -1;
        }
        var values = {
            lastused: new Date().toLocaleString(),
            gameid: "0"
        };
        players.set(id.toString(), values);
        return id.toString();
    },
    insert: function (col, playerid, gameid) {
        var piece = -1;
        if (games.get(gameid).hostid == playerid)
            piece = 1;
        else
            piece = 2;
        var successful = true;
        //Full Col
        if (games.get(gameid).board[0][col] != 0)
            successful = false;
        //Empty Col
        else if (games.get(gameid).board[5][col] == 0) {
            games.get(gameid).board[5][col] = piece;
            successful = true;
        } //Regular insert
        else {
            for (var i = 0; i < 5; i++) {
                if (games.get(gameid).board[i + 1][col] != 0) {
                    games.get(gameid).board[i][col] = piece;
                    successful = true;
                    break;
                }
            }
        }
        if (successful)
            return ["Good insert", piece, games.get(gameid).board];
        else
            return ["Bad insert"];
    },
    //****** INTERNAL FUNCTIONS ******
    modifyBoardState: function (gameid, playerid, winner) {
        //Flag game as over
        if (playerid != "0") {
            //Set winner to playerid passed in because they won
            if (winner)
                games.get(gameid).winner = playerid;
            //Set winner to other player, because player passed in forefit
            else {
                if (games.get(gameid).hostid == playerid)
                    games.get(gameid).winner = games.get(gameid).guestid;
                else
                    games.get(gameid).winner = games.get(gameid).hostid;
            }
            return;
        }
        //Rotate hostturn bool to enable turn change
        console.log("changing turn ", games.get(gameid));
        if (games.get(gameid).hostturn == true)
            games.get(gameid).hostturn = false;
        else
            games.get(gameid).hostturn = true;
        console.log("changing turn ", games.get(gameid));
    },
    getTop: function (gameid, col) {
        for (var i = 0; i < 5; i++)
            if (games.get(gameid).board[i][col] != 0)
                return i;
        return 5;
    },
    deleteGame: function (gameid) {
        games.delete(gameid);
        console.log("\n\n\n\n\n Just deleted", gameid);
        console.log(games);
        // let hostid: string = games.get(gameid).hostid;
        // let guestid: string = games.get(gameid).guestid;
        // players.delete(hostid);
        // players.delete(guestid);
    },
    checkWin: function (gameid, player, col, row) {
        //check if horizontal win on row of most recent piece played
        var count = 0;
        for (var i = 0; i < 7; i++) {
            if (games.get(gameid).board[row][i] == player) {
                count += 1;
                if (count == 4)
                    return true;
            }
            else
                count = 0;
        }
        //check if vertical win on row of most recent piece played
        count = 0;
        for (var i = 0; i < 6; i++) {
            if (games.get(gameid).board[i][col] == player) {
                count += 1;
                if (count == 4)
                    return true;
            }
            else
                count = 0;
        }
        //check if diagonal decreasing win on row/col of most recent piece played
        count = 0;
        var tempcol = col;
        var temprow = row;
        //move cursor to top left most value on relevent diagonal
        while (temprow > 0 && tempcol > 0) {
            temprow -= 1;
            tempcol -= 1;
        }
        //move cursor down/right checking for win
        while (temprow < 6 && tempcol < 7) {
            if (games.get(gameid).board[temprow][tempcol] == player) {
                count += 1;
                if (count == 4)
                    return true;
            }
            else
                count = 0;
            temprow += 1;
            tempcol += 1;
        }
        //check if diagonal increasing win on row/col of most recent piece played
        count = 0;
        tempcol = col;
        temprow = row;
        //move cursor to top right most value on relevent diagonal
        while (temprow > 0 && tempcol < 6) {
            temprow -= 1;
            tempcol += 1;
        }
        //move cursor down/left checking for win
        while (temprow < 6 && tempcol >= 0) {
            if (games.get(gameid).board[temprow][tempcol] == player) {
                count += 1;
                if (count == 4)
                    return true;
            }
            else
                count = 0;
            temprow += 1;
            tempcol -= 1;
        }
        return false;
    }
};
//# sourceMappingURL=functions.js.map