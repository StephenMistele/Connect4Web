import { kill } from "process";

var games: Map<string, gamevals> = new Map()
var gametimes: Map<string, string> = new Map()
var players: Map<string, string> = new Map()
//check if player left
//matchmaking
//wipe old games

type gamevals = {
    board: number[][];
    hostid: string;
    guestid: string;
    hostturn: boolean;
    over: boolean;
};

module.exports = {

    //****** EXTERNAL FUNCTIONS ******
    createBoard: function (playerid: string, gameid: string) {
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
                over: false
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
        //if game doesn't exist, return -3
        if (!games.has(gameid))
            return [-3, 0]

        //if game over (you lost) return -2 along with winning move
        if (games.get(gameid).over)
            return [-2, games.get(gameid).board]
        
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
            if (games.get(gameid).hostturn){
                return [0, 0]
            }
            return [1, games.get(gameid).board]
        }
    },

    generateGameID: function () {
        let counter: number = 0;
        let id: string = (Math.floor(Math.random() * 899999) + 100000).toString();
        while (games.has(id)) {
            id = (Math.floor(Math.random() * 899999) + 100000).toString();
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
        if (successful)
            return ["Good insert", piece, games.get(gameid).board];
        else
            return "Bad insert"
    },

    //****** INTERNAL FUNCTIONS ******
    changeTurn: function (gameid: string, killgame: boolean) {
        //Flag game as over
        if (killgame){
            games.get(gameid).over = true;
            return
        }
        //Rotate hostturn bool
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

    deleteGame: function(gameid: string){
        let hostid:string = games.get(gameid).hostid;
        let guestid:string = games.get(gameid).guestid;
        games.delete(gameid);
        players.delete(hostid);
        players.delete(guestid);
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
