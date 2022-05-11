var games = new Map();
var gametimes = new Map();
var players = new Map();
module.exports = {
    //****** EXTERNAL FUNCTIONS ******
    createBoard: function (playerid, gameid) {
        if (games.has(gameid)) { //if game room already exists
            console.log(games.get(gameid));
            if (games.get(gameid).guestid == "0") { //if game room only has 1 player
                games.get(gameid).guestid = playerid;
                return "game joined";
            }
            else //if game room has 2 players already
                return "game full";
        }
        else { //if game room doesn't exist
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
                hostturn: false
            };
            games.set(gameid, values);
            gametimes[gameid] = new Date().toLocaleString();
            return "new game created";
        }
    },
    debug: function (gameid) {
        for (var item in games)
            console.log(item);
        console.log("GAMES*****************************************************", games, "\n");
        console.log("PLAYERS*****************************************************", players, "\n");
        console.log("GAMETIMES*****************************************************", gametimes, "\n");
    },
    checkTurn: function (playerid, gameid) {
        //if game doesn't exist (you lost) return -2
        if (!games.has(gameid))
            return -2;
        //only one person in game return -1
        if (games.get(gameid).guestid == '0')
            return -1;
        //return board for 'your move' 0 for not
        if (playerid == games.get(gameid).hostid) {
            //player is host
            if (games.get(gameid).hostturn)
                return games.get(gameid).board;
            console.log("hostturn:", games.get(gameid).hostturn, "playerid: ", playerid, "playerid should be", games.get(gameid).guestid);
            return 0;
        }
        else {
            //player is guest
            if (games.get(gameid).hostturn) {
                console.log("hostturn:", games.get(gameid).hostturn, "playerid: ", playerid, "playerid should be", games.get(gameid).hostid);
                return 0;
            }
            return games.get(gameid).board;
        }
    },
    generateGameID: function () {
        var counter = 0;
        var id = (Math.floor(Math.random() * 999999) + 100000).toString();
        while (games.has(id)) {
            id = (Math.floor(Math.random() * 999999) + 100000).toString();
            counter++;
            if (counter > 999999 * 2)
                return -1;
        }
        gametimes.set(id.toString(), new Date().toLocaleString());
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
        players.set(id.toString(), new Date().toLocaleString());
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
            return "Bad insert";
    },
    //****** INTERNAL FUNCTIONS ******
    changeTurn: function (gameid) {
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
        var hostid = games.get(gameid).hostid;
        var guestid = games.get(gameid).guestid;
        games.delete(gameid);
        players.delete(hostid);
        players.delete(guestid);
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
        while (temprow < 5 && tempcol < 6) {
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
        while (temprow < 5 && tempcol > 0) {
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
    }
};
//# sourceMappingURL=functions.js.map