//NICE TO HAVES:
//web sockets or hooks
//responsive

const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

//Types
type gamevals = {
    board: number[][];
    hostid: string;
    guestid: string;
    hostturn: boolean;
    winner: string;
};

type playervals = {
    pinged: boolean;
    gameid: string;
    hasaccount: boolean;
    username: string;
};

type changeplayerscorevals = {
    playerid: string;
    username: string;
    otherplayerid: string;
    otherplayerusername: string;
};

//Globals
var games: Map<string, gamevals> = new Map();
var players: Map<string, playervals> = new Map();
var playerqueue = [];
const mongoPassword = encodeURIComponent(process.env.MONGO_PASSWORD);
const uri: string = `mongodb+srv://serveraccess:${mongoPassword}@connect4instance.zux23.mongodb.net/?retryWrites=true&w=majority`;
var dbo;
MongoClient.connect(uri, async function (err, db) {
    if (err) {
        console.log("error connecting to db", err);
    }
    dbo = db.db("playerdatadb");
});

module.exports = {

    getOtherPlayer(gameid: string, playerid: string) {
        console.log(games.get(gameid), games, gameid)
        let otherplayerid: string;
        if (games.get(gameid).guestid == playerid)
            otherplayerid = games.get(gameid).hostid;
        else
            otherplayerid = games.get(gameid).guestid;
        return otherplayerid;
    },

    //Updates an existing user's score
    updatePlayerScore: async function (playerid: string, uname: string, deleted: boolean, incrementwon: number) {
        let username: string;
        if (deleted)
            username = uname;
        else {
            if (!players.has(playerid)) {
                console.log("can't find player to update score", playerid)
                return;
            }
            if (!players.get(playerid).hasaccount) {
                console.log("Player doesn't have account to update score", playerid)
                return;
            }
            username = players.get(playerid).username;
        }
        new Promise(async function (resolve, reject) {
            let searchParam = { _id: username };
            dbo.collection("playerdatacollection").updateOne(searchParam, { $inc: { gamesplayed: 1, gameswon: incrementwon } });
            console.log(`updated ${username}'s scores. Won = ${incrementwon}`)
            resolve(1);
        });
    },

    //Logs user in
    loginUser: async function (username: string, hash: string, playerid: string) {
        return new Promise(async function (resolve, reject) {
            let searchParam = { _id: username, hash: hash };
            await dbo.collection("playerdatacollection").find(searchParam).toArray(function (err, result) {
                if (err) {
                    console.log("error reading from db");
                    resolve(["-2"]);
                }
                else if (result.length == 0) {
                    resolve(["-3"]);
                }
                else {
                    let data = {
                        gamesplayed: result[0].gamesplayed,
                        gameswon: result[0].gameswon,
                        playerid: playerid
                    }
                    let values: playervals = {
                        pinged: true,
                        gameid: "0",
                        hasaccount: true,
                        username: username
                    }
                    players.set(playerid, values);
                    console.log("Logged in player");
                    resolve(["1", data]);
                }
            });
        });
    },

    //Writes a new user to mongo
    signUpUser: async function (username: string, hash: string, playerid: string) {
        let playerinfo = { _id: username, hash: hash, gamesplayed: 0, gameswon: 0 };
        return new Promise(async function (resolve, reject) {
            await dbo.collection("playerdatacollection").insertOne(playerinfo, function (err, result) {
                if (err) {
                    console.log("error inserting document");
                    resolve("-2");
                }
                else {
                    let values: playervals = {
                        pinged: true,
                        gameid: "0",
                        hasaccount: true,
                        username: username
                    }
                    players.set(playerid, values);
                    console.log("Signed up player");
                    resolve("1");
                }
            });
        });
    },

    //Depricates any players/games that haven't pinged in 10s
    expirePlayers: function () {
        let keys: string[] = Array.from(players.keys());
        let expiredPlayersInGames: changeplayerscorevals[] = [];
        let expiredPlayers: number = 0;
        for (let i: number = 0; i < keys.length; i++) {
            if (players.get(keys[i]).pinged == false) {
                let gameid: string = players.get(keys[i]).gameid;
                //If dissconnected player was in game, end their game and mark them for score reduction
                if (gameid != "0" && games.has(gameid)) {
                    let otherplayerid: string;
                    console.log(games, gameid, keys[i], players)
                    if (games.get(gameid).guestid == keys[i])
                        otherplayerid = games.get(gameid).hostid;
                    else
                        otherplayerid = games.get(gameid).guestid;
                    games.delete(gameid);
                    let vals: changeplayerscorevals = {
                        playerid: keys[i],
                        username: players.get(keys[i]).username,
                        otherplayerid: otherplayerid,
                        otherplayerusername: players.get(otherplayerid).username
                    }
                    expiredPlayersInGames.push(vals);
                }
                expiredPlayers++;
                players.delete(keys[i]);
                for (let j: number = 0; j < playerqueue.length; j++) {
                    if (playerqueue[j][0] == keys[i]) {
                        playerqueue.splice(j, 1);
                        break;
                    }
                }
            }
            else {
                players.get(keys[i]).pinged = false;
            }
        }
        if (expiredPlayers > 0)
            console.log(`Expired ${expiredPlayers} players`)
        return expiredPlayersInGames;
    },

    //Pings on behalf of a player to note continued connection
    registerPing: function (playerid: string) {
        if (!players.has(playerid))
            return "disconnected";
        else {
            players.get(playerid).pinged = true;
            return "connected";
        }
    },

    //adds player to matchmaking queue or returns other player in queue
    matchmake: function (playerid: string, gameid: string) {
        if (playerqueue.length > 0) {
            let otherplayerdata = playerqueue.shift();
            players.get(playerid).gameid = otherplayerdata[1];
            return ["1", otherplayerdata[1]];
        }
        else {
            playerqueue.push([playerid, gameid]);
            return ["0", players.size.toString()];
        }
    },

    //removes a player from the matchmaking queue
    dequeue: function (playerid: string, gameid: string) {
        games.delete(gameid);
        for (let i = 0; i < playerqueue.length; i++) {
            if (playerqueue[i][0] == playerid) {
                playerqueue.splice(i, 1);
                return "removed";
            }
        }
        return "failed to remove";
    },

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
            pinged: true,
            gameid: "0",
            hasaccount: false,
            username: ""
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
                winner: "0"
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

    //Changes turn
    changeTurn: function (gameid: string) {
        //Rotate hostturn bool to enable turn change
        if (games.get(gameid).hostturn == true)
            games.get(gameid).hostturn = false;
        else
            games.get(gameid).hostturn = true;
    },

    //Ends game
    endGame: function (gameid: string, winningplayerid: string) {
        games.get(gameid).winner = winningplayerid;
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