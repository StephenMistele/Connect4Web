var games: Map<string, gamevals> = new Map()
var gametimes: Map<string, string> = new Map()
var players: Map<string, string> = new Map()

type gamevals = {
    board: number[][];
    hostid: string;
    guestid: string;
    hostturn: boolean;
};

module.exports = {

    //****** EXTERNAL FUNCTIONS ******
    createBoard: function (playerid: string, gameid: string) {
        if (games.has(gameid)) {                    //if game room already exists
            console.log(games.get(gameid))
            if (games.get(gameid).guestid == "0") { //if game room only has 1 player
                games.get(gameid).guestid = playerid
                return "game joined"
            }
            else                                    //if game room has 2 players already
                return "game full"
        }
        else {                                      //if game room doesn't exist
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
                hostturn: true
            }
            games.set(gameid, values)
            gametimes[gameid] = new Date().toLocaleString()
            return "new game created"
        }
    },

    debug: function (gameid: string) {
        for (let item in games)
            console.log(item)
        console.log("GAMES*****************************************************", games, "\n")
        console.log("PLAYERS*****************************************************", players, "\n")
        console.log("GAMETIMES*****************************************************", gametimes, "\n")
    },

    checkTurn: function (playerid: string, gameid: string) {
        //if game doesn't exist (you lost) return -1
        if (!games.has(gameid))
            return -1

        //return 1 for 'your move' 0 for not
        if (playerid == games.get(gameid).hostid) {
            //player is host
            if (games.get(gameid).hostturn)
                return 1
            return 0
        }
        else {
            //player is guest
            if (games.get(gameid).hostturn)
                return 0
            return 1
        }
    },

    generateGameID: function () {
        let counter: number = 0;
        let id: string = (Math.floor(Math.random() * 999999) + 100000).toString();
        while (games.has(id)) {
            id = (Math.floor(Math.random() * 999999) + 100000).toString();
            counter++;
            if (counter > 999999 * 2)
                return -1
        }
        gametimes.set(id.toString(), new Date().toLocaleString());
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
        players.set(id.toString(), new Date().toLocaleString());
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
        console.log(games.get(gameid).board)
        if (successful)
            return ["Good insert", piece];
        else
            return "Bad insert"
    },

    //****** INTERNAL FUNCTIONS ******
    changeTurn: function (gameid: string) {
        if (games.get(gameid).hostturn == true)
            games.get(gameid).hostturn = false;
        else
            games.get(gameid).hostturn = true
    },

    getTop: function (gameid: string, col: number) {
        for (let i: number = 0; i < 5; i++)
            if (games.get(gameid).board[i][col] != 0)
                return i
        return 5
    },

    checkWin: function (gameid: string, player: number, col: number, row: number) {
        //check if horizontal win on row of most recent piece played
        let count: number = 0;
        for (let i:number = 0; i < 7; i++){
            if (games.get(gameid).board[row][i] == player){
                count+=1;
                if (count == 4)
                    return true;
            }
            else
                count = 0;
        }
        //check if vertical win on row of most recent piece played
        count = 0;
        for (let i:number = 0; i < 6; i++){
            if (games.get(gameid).board[i][col] == player){
                count+=1;
                if (count == 4)
                    return true;
            }
            else
                count = 0;
        }

        //check if diagonal decreasing win on row/col of most recent piece played
        count = 0
        let tempcol:number = col;
        let temprow:number = row
        //move cursor to top left most value on relevent diagonal
        while (temprow > 0 && tempcol > 0){
            temprow-=1;
            tempcol-=1;
        }
        //move cursor down/right checking for win
        while (temprow < 5 && tempcol < 6){
            if (games.get(gameid).board[temprow][tempcol] == player){
                count+=1
                if (count == 4)
                    return true;
            }
            else
                count = 0;
            temprow+=1;
            tempcol+=1;
        }

        //check if diagonal increasing win on row/col of most recent piece played
        count = 0
        tempcol = col;
        temprow = row
        //move cursor to top right most value on relevent diagonal
        while (temprow > 0 && tempcol < 6){
            temprow-=1;
            tempcol+=1;
        }
        //move cursor down/left checking for win
        while (temprow < 5 && tempcol > 0){
            if (games.get(gameid).board[temprow][tempcol] == player){
                count+=1
                if (count == 4)
                    return true;
            }
            else
                count = 0;
            temprow+=1;
            tempcol-=1;
        }
    }
}
