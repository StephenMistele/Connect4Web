class Queue {
    items: string[];

    constructor(...params: any[]) {
        console.log(params);
        this.items = [...params];
    }
    enqueue(item: any) {
        this.items.push(item);
    }
    dequeue() {
        return this.items.shift();
    }
    len() {
        return this.items.length;
    }
}
var games: Map<string, gamevals> = new Map();
var players: Map<string, playervals> = new Map();
var playerqueue: Queue = new Queue();
//matchmaking
//implement expirations on old games/players

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

module.exports = {

    //****** EXTERNAL FUNCTIONS ******
    createBoard: function (playerid: string, gameid: string) {
        //if player has another game associated, delete if over, over if running

        //if game room already exists
        if (games.has(gameid)) {
            console.log(games.get(gameid))
            //if game room only has 1 player
            if (games.get(gameid).guestid == "0") {
                games.get(gameid).guestid = playerid
                return "game joined"
            }
            //if game room has 2 players already
            else if (games.get(gameid).guestid == playerid || games.get(gameid).hostid == playerid)
                return "already in game"
            else
                return "game full"
        }
        //if game room doesn't exist
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

    queue: function (playerid: string) {
        playerqueue.enqueue(playerid);
        if (playerqueue.len() > 1){
            let player1:string = playerqueue.dequeue();
            let player2:string = playerqueue.dequeue();

        }
        return "meep"
    },

    debug: function (gameid: string) {
        for (let item in games)
            console.log(item)
        console.log("GAMES*****************************************************", games, "\n")
        console.log("PLAYERS*****************************************************", players, "\n")
    },

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

        //return [1, board] for 'your move' 0 for not
        if (playerid == games.get(gameid).hostid) {
            //player is host
            if (games.get(gameid).hostturn)
                return [1, games.get(gameid).board]
            return [0, 0]
        }
        else {
            //player is guest
            if (games.get(gameid).hostturn) {
                return [0, 0]
            }
            return [1, games.get(gameid).board]
        }
    },

    generateGameID: function (playerid: string) {
        let counter: number = 0;
        let id: string = (Math.floor(Math.random() * 899999) + 100000).toString();
        while (games.has(id)) {
            id = (Math.floor(Math.random() * 899999) + 100000).toString();
            counter++;
            if (counter > 999999 * 2)
                return -1
        }
        console.log("HEHEHEHEHEH", id.toString(), playerid)
        players.get(playerid).gameid = id;
        return id.toString();
    },

    generatePlayerID: function () {
        let counter: number = 0;
        let id: string = (Math.floor(Math.random() * 999999) + 100000).toString();
        while (players.has(id)) {
            id = (Math.floor(Math.random() * 999999) + 100000).toString();
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

    insert: function (col: number, playerid: string, gameid: string) {
        let piece = -1;
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

    //****** INTERNAL FUNCTIONS ******
    modifyBoardState: function (gameid: string, playerid: string, winner: boolean) {
        //Flag game as over
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
        //Rotate hostturn bool to enable turn change
        console.log("changing turn ", games.get(gameid))
        if (games.get(gameid).hostturn == true)
            games.get(gameid).hostturn = false;
        else
            games.get(gameid).hostturn = true;
        console.log("changing turn ", games.get(gameid))
    },

    getTop: function (gameid: string, col: number) {
        for (let i: number = 0; i < 5; i++)
            if (games.get(gameid).board[i][col] != 0)
                return i
        return 5
    },

    deleteGame: function (gameid: string) {
        games.delete(gameid);
        console.log("\n\n\n\n\n Just deleted", gameid)
        console.log(games)
        // let hostid: string = games.get(gameid).hostid;
        // let guestid: string = games.get(gameid).guestid;
        // players.delete(hostid);
        // players.delete(guestid);
    },

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
        //move cursor to top left most value on relevent diagonal
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
        //move cursor to top right most value on relevent diagonal
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
