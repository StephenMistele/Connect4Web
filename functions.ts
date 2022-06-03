//High-Priority TODO's:
//implement expirations on old games/players

//NICE TO HAVES:
//matchmaking
//implement single-player mode
//user accounts

//Types
type gamevals = {
    board: number[][];
    hostid: string;
    guestid: string;
    hostturn: boolean;
    winner: string;
    lastused: string;
};

type playervals = {
    lastused: string;
    gameid: string;
};

//Globals
var games: Map<string, gamevals> = new Map();
var players: Map<string, playervals> = new Map();

module.exports = {

    //****** EXTERNAL FUNCTIONS ******

    //Returns unique gameid
    generateGameID: function (playerid: string) {
        let counter: number = 0;
        let id: string = (Math.floor(Math.random() * 8999) + 1000).toString();
        while (games.has(id)) {
            id = (Math.floor(Math.random() * 8999) + 1000).toString();
            counter++;
            //if total concurrent games approaching 10000, fail
            if (counter > 9999 * 2)
                return -1
        }
        players.get(playerid).gameid = id;
        return id.toString();
    },

    //Returns unique playerid
    generatePlayerID: function () {
        let counter: number = 0;
        let id: string = (Math.floor(Math.random() * 899999) + 100000).toString();
        while (players.has(id)) {
            id = (Math.floor(Math.random() * 899999) + 100000).toString();
            counter++;
            if (counter > 999999 * 2)
                return -1
        }
        let values: playervals = {
            lastused: new Date().toLocaleString(),
            gameid: "0"
        }
        players.set(id.toString(), values);
        return id.toString();
    },

    //handles a player joining a game room. Creates new room if gameid not yet present.
    //joins existing game if gameid already present with one player
    joinGame: function (playerid: string, gameid: string) {
        //if game room already exists
        if (games.has(gameid)) {
            // console.log(games.get(gameid))
            //if game room only has 1 player, join successfully
            if (games.get(gameid).guestid == "0") {
                games.get(gameid).guestid = playerid
                return "game joined"
            }
            //if game room has 2 players already, fail
            else if (games.get(gameid).guestid == playerid || games.get(gameid).hostid == playerid)
                return "already in game"
            else
                return "game full"
        }
        //if game room doesn't exist, create new board
        else {
            let newboard: number[][] = [];
            for (let x: number = 0; x < 6; x++) {
                newboard[x] = [];
                for (let y: number = 0; y < 7; y++) {
                    newboard[x][y] = 0;
                }
            }
            let values: gamevals = {
                board: newboard,
                hostid: playerid,
                guestid: "0",
                hostturn: false,
                winner: "0",
                lastused: Date.now().toLocaleString()
            }
            games.set(gameid, values)
            return "new game created"
        }
    },

    //Returns information on gamestate relevent to given player/game. Queried repeatedly by players
    checkTurn: function (playerid: string, gameid: string) {
        //if game doesn't exist, return -3
        if (!games.has(gameid))
            return [-3, 0]

        //if game over (you lost) return -2 along with winning move and winning player
        if (games.get(gameid).winner != "0")
            return [-2, games.get(gameid).board, games.get(gameid).winner]

        //only one person in game return -1
        if (games.get(gameid).guestid == '0')
            return [-1, 0]

        //return [1, board] for 'your move', or 0 for not
        if (playerid == games.get(gameid).hostid) {
            //player is host
            if (games.get(gameid).hostturn)
                return [1, games.get(gameid).board]
            return [0, 0]
        }
        else {
            //player is guest
            if (games.get(gameid).hostturn)
                return [0, 0]
            return [1, games.get(gameid).board]
        }
    },

    //Attempts to insert a piece to given board/col by given player
    insert: function (col: number, playerid: string, gameid: string) {
        //Assign 'piece' info to relevant player
        let piece: number = -1;
        if (games.get(gameid).hostid == playerid)
            piece = 1;
        else
            piece = 2;
        let successful: boolean = true;
        //Full Col
        if (games.get(gameid).board[0][col] != 0)
            successful = false;
        //Empty Col
        else if (games.get(gameid).board[5][col] == 0) {
            games.get(gameid).board[5][col] = piece;
            successful = true;
        } //Regular insert
        else {
            for (let i: number = 0; i < 5; i++) {
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
            return ["Bad insert"]
    },

    //Prints out info on board state to console and Json. Triggered by hitting 'debug' API endpoint
    debug: function () {
        for (let item in games)
            console.log(item)
        console.log("GAMES*****************************************************", games, "\n")
        console.log("PLAYERS*****************************************************", players, "\n")
        return [games, players]
    },

    //****** HELPER FUNCTIONS ******

    //Changes turn or ends game
    modifyBoardState: function (gameid: string, playerid: string, winner: boolean) {
        //Flag game as over if playerid is passed in
        if (playerid != "0") {
            //Set winner to playerid passed in because they won
            if (winner)
                games.get(gameid).winner = playerid;
            //Set winner to other player, because player passed in forefit
            else {
                if (games.get(gameid).hostid == playerid)
                    games.get(gameid).winner = games.get(gameid).guestid
                else
                    games.get(gameid).winner = games.get(gameid).hostid
            }
            return
        }
        //Else, rotate hostturn bool to enable turn change
        if (games.get(gameid).hostturn == true)
            games.get(gameid).hostturn = false;
        else
            games.get(gameid).hostturn = true;
    },

    //Returns location of highest played piece 
    getTop: function (gameid: string, col: number) {
        for (let i: number = 0; i < 5; i++)
            if (games.get(gameid).board[i][col] != 0)
                return i
        return 5
    },

    //Takes a game out of memory. Gone. Forever.
    deleteGame: function (gameid: string) {
        games.delete(gameid);
        // let hostid: string = games.get(gameid).hostid;
        // let guestid: string = games.get(gameid).guestid;
        // players.delete(hostid);
        // players.delete(guestid);
    },

    //Given a board and the most recent piece played, checks if a win exists around that piece.
    checkWin: function (gameid: string, player: number, col: number, row: number) {
        //check if horizontal win on row of most recent piece played
        let count: number = 0;
        for (let i: number = 0; i < 7; i++) {
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
        for (let i: number = 0; i < 6; i++) {
            if (games.get(gameid).board[i][col] == player) {
                count += 1;
                if (count == 4)
                    return true;
            }
            else
                count = 0;
        }

        //check if diagonal decreasing win on row/col of most recent piece played
        count = 0
        let tempcol: number = col;
        let temprow: number = row
        //start by moving cursor to top left most value on relevent diagonal
        while (temprow > 0 && tempcol > 0) {
            temprow -= 1;
            tempcol -= 1;
        }
        //move cursor down/right checking for win
        while (temprow < 6 && tempcol < 7) {
            if (games.get(gameid).board[temprow][tempcol] == player) {
                count += 1
                if (count == 4)
                    return true;
            }
            else
                count = 0;
            temprow += 1;
            tempcol += 1;
        }

        //check if diagonal increasing win on row/col of most recent piece played
        count = 0
        tempcol = col;
        temprow = row
        //start by moving cursor to top right most value on relevent diagonal
        while (temprow > 0 && tempcol < 6) {
            temprow -= 1;
            tempcol += 1;
        }
        //move cursor down/left checking for win
        while (temprow < 6 && tempcol >= 0) {
            if (games.get(gameid).board[temprow][tempcol] == player) {
                count += 1
                if (count == 4)
                    return true;
            }
            else
                count = 0;
            temprow += 1;
            tempcol -= 1;
        }
        return false
    }
}

//Below code can be used to implement matchmaking. For now, leave commented

// class Queue {
//     items: string[];
//     constructor(...params: any[]) {
//         // console.log(params);
//         this.items = [...params];
//     }
//     enqueue(item: any) {
//         this.items.push(item);
//     }
//     dequeue() {
//         return this.items.shift();
//     }
//     len() {
//         return this.items.length;
//     }
// }
// var playerqueue: Queue = new Queue();
// queue: function (playerid: string) {
//     playerqueue.enqueue(playerid);
//     if (playerqueue.len() > 1){
//         let player1:string = playerqueue.dequeue();
//         let player2:string = playerqueue.dequeue();

//     }
//     return "meep"
// },
