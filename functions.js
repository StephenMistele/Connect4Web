//NICE TO HAVES:
//web sockets or hooks
//responsive
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a = require('mongodb'), MongoClient = _a.MongoClient, ServerApiVersion = _a.ServerApiVersion;
var dotenv = require('dotenv');
dotenv.config();
//Globals
var games = new Map();
var players = new Map();
var playerqueue = [];
var mongoPassword = encodeURIComponent(process.env.MONGO_PASSWORD);
var uri = "mongodb+srv://serveraccess:".concat(mongoPassword, "@connect4instance.zux23.mongodb.net/?retryWrites=true&w=majority");
var dbo;
MongoClient.connect(uri, function (err, db) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (err) {
                console.log("error connecting to db");
            }
            dbo = db.db("playerdatadb");
            return [2 /*return*/];
        });
    });
});
module.exports = {
    getOtherPlayer: function (gameid, playerid) {
        console.log(games.get(gameid), games, gameid);
        var otherplayerid;
        if (games.get(gameid).guestid == playerid)
            otherplayerid = games.get(gameid).hostid;
        else
            otherplayerid = games.get(gameid).guestid;
        return otherplayerid;
    },
    //Updates an existing user's score
    updatePlayerScore: function (playerid, uname, deleted, incrementwon) {
        return __awaiter(this, void 0, void 0, function () {
            var username;
            return __generator(this, function (_a) {
                if (deleted)
                    username = uname;
                else {
                    if (!players.has(playerid)) {
                        console.log("can't find player to update score", playerid);
                        return [2 /*return*/];
                    }
                    if (!players.get(playerid).hasaccount) {
                        console.log("Player doesn't have account to update score", playerid);
                        return [2 /*return*/];
                    }
                    username = players.get(playerid).username;
                }
                new Promise(function (resolve, reject) {
                    return __awaiter(this, void 0, void 0, function () {
                        var searchParam;
                        return __generator(this, function (_a) {
                            searchParam = { _id: username };
                            dbo.collection("playerdatacollection").updateOne(searchParam, { $inc: { gamesplayed: 1, gameswon: incrementwon } });
                            console.log("updated ".concat(username, "'s scores. Won = ").concat(incrementwon));
                            resolve(1);
                            return [2 /*return*/];
                        });
                    });
                });
                return [2 /*return*/];
            });
        });
    },
    //Logs user in
    loginUser: function (username, hash, playerid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        return __awaiter(this, void 0, void 0, function () {
                            var searchParam;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        searchParam = { _id: username, hash: hash };
                                        return [4 /*yield*/, dbo.collection("playerdatacollection").find(searchParam).toArray(function (err, result) {
                                                if (err) {
                                                    console.log("error reading from db");
                                                    resolve(["-2"]);
                                                }
                                                else if (result.length == 0) {
                                                    resolve(["-3"]);
                                                }
                                                else {
                                                    var data = {
                                                        gamesplayed: result[0].gamesplayed,
                                                        gameswon: result[0].gameswon,
                                                        playerid: playerid
                                                    };
                                                    var values = {
                                                        pinged: true,
                                                        gameid: "0",
                                                        hasaccount: true,
                                                        username: username
                                                    };
                                                    players.set(playerid, values);
                                                    console.log("Logged in player");
                                                    resolve(["1", data]);
                                                }
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    })];
            });
        });
    },
    //Writes a new user to mongo
    signUpUser: function (username, hash, playerid) {
        return __awaiter(this, void 0, void 0, function () {
            var playerinfo;
            return __generator(this, function (_a) {
                playerinfo = { _id: username, hash: hash, gamesplayed: 0, gameswon: 0 };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, dbo.collection("playerdatacollection").insertOne(playerinfo, function (err, result) {
                                            if (err) {
                                                console.log("error inserting document");
                                                resolve("-2");
                                            }
                                            else {
                                                var values = {
                                                    pinged: true,
                                                    gameid: "0",
                                                    hasaccount: true,
                                                    username: username
                                                };
                                                players.set(playerid, values);
                                                console.log("Signed up player");
                                                resolve("1");
                                            }
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    })];
            });
        });
    },
    //Depricates any players/games that haven't pinged in 10s
    expirePlayers: function () {
        var keys = Array.from(players.keys());
        var expiredPlayersInGames = [];
        var expiredPlayers = 0;
        for (var i = 0; i < keys.length; i++) {
            if (players.get(keys[i]).pinged == false) {
                var gameid = players.get(keys[i]).gameid;
                //If dissconnected player was in game, end their game and mark them for score reduction
                if (gameid != "0" && games.has(gameid)) {
                    var otherplayerid = void 0;
                    console.log(games, gameid, keys[i], players);
                    if (games.get(gameid).guestid == keys[i])
                        otherplayerid = games.get(gameid).hostid;
                    else
                        otherplayerid = games.get(gameid).guestid;
                    games.delete(gameid);
                    var vals = {
                        playerid: keys[i],
                        username: players.get(keys[i]).username,
                        otherplayerid: otherplayerid,
                        otherplayerusername: players.get(otherplayerid).username
                    };
                    expiredPlayersInGames.push(vals);
                }
                expiredPlayers++;
                players.delete(keys[i]);
                for (var j = 0; j < playerqueue.length; j++) {
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
            console.log("Expired ".concat(expiredPlayers, " players"));
        return expiredPlayersInGames;
    },
    //Pings on behalf of a player to note continued connection
    registerPing: function (playerid) {
        if (!players.has(playerid))
            return "disconnected";
        else {
            players.get(playerid).pinged = true;
            return "connected";
        }
    },
    //adds player to matchmaking queue or returns other player in queue
    matchmake: function (playerid, gameid) {
        if (playerqueue.length > 0) {
            var otherplayerdata = playerqueue.shift();
            players.get(playerid).gameid = otherplayerdata[1];
            return ["1", otherplayerdata[1]];
        }
        else {
            playerqueue.push([playerid, gameid]);
            return ["0", players.size.toString()];
        }
    },
    //removes a player from the matchmaking queue
    dequeue: function (playerid, gameid) {
        games.delete(gameid);
        for (var i = 0; i < playerqueue.length; i++) {
            if (playerqueue[i][0] == playerid) {
                playerqueue.splice(i, 1);
                return "removed";
            }
        }
        return "failed to remove";
    },
    //Returns unique gameid
    generateGameID: function (playerid) {
        var counter = 0;
        var id = (Math.floor(Math.random() * 8999) + 1000).toString();
        while (games.has(id)) {
            id = (Math.floor(Math.random() * 8999) + 1000).toString();
            counter++;
            //if total concurrent games approaching 10000, fail
            if (counter > 9999 * 2)
                return -1;
        }
        players.get(playerid).gameid = id;
        return id.toString();
    },
    //Returns unique playerid
    generatePlayerID: function () {
        var counter = 0;
        var id = (Math.floor(Math.random() * 899999) + 100000).toString();
        while (players.has(id)) {
            id = (Math.floor(Math.random() * 899999) + 100000).toString();
            counter++;
            if (counter > 999999 * 2)
                return -1;
        }
        var values = {
            pinged: true,
            gameid: "0",
            hasaccount: false,
            username: ""
        };
        players.set(id.toString(), values);
        return id.toString();
    },
    //handles a player joining a game room. Creates new room if gameid not yet present.
    //joins existing game if gameid already present with one player
    joinGame: function (playerid, gameid) {
        //if game room already exists
        if (games.has(gameid)) {
            // console.log(games.get(gameid))
            //if game room only has 1 player, join successfully
            if (games.get(gameid).guestid == "0") {
                games.get(gameid).guestid = playerid;
                return "game joined";
            }
            //if game room has 2 players already, fail
            else if (games.get(gameid).guestid == playerid || games.get(gameid).hostid == playerid)
                return "already in game";
            else
                return "game full";
        }
        //if game room doesn't exist, create new board
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
                winner: "0"
            };
            games.set(gameid, values);
            return "new game created";
        }
    },
    //Returns information on gamestate relevent to given player/game. Queried repeatedly by players
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
        //return [1, board] for 'your move', or 0 for not
        if (playerid == games.get(gameid).hostid) {
            //player is host
            if (games.get(gameid).hostturn)
                return [1, games.get(gameid).board];
            return [0, 0];
        }
        else {
            //player is guest
            if (games.get(gameid).hostturn)
                return [0, 0];
            return [1, games.get(gameid).board];
        }
    },
    //Attempts to insert a piece to given board/col by given player
    insert: function (col, playerid, gameid) {
        //Assign 'piece' info to relevant player
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
    //Prints out info on board state to console and Json. Triggered by hitting 'debug' API endpoint
    debug: function () {
        for (var item in games)
            console.log(item);
        console.log("GAMES*****************************************************", games, "\n");
        console.log("PLAYERS*****************************************************", players, "\n");
        return [games, players];
    },
    //Changes turn
    changeTurn: function (gameid) {
        //Rotate hostturn bool to enable turn change
        if (games.get(gameid).hostturn == true)
            games.get(gameid).hostturn = false;
        else
            games.get(gameid).hostturn = true;
    },
    //Ends game
    endGame: function (gameid, winningplayerid) {
        games.get(gameid).winner = winningplayerid;
    },
    //Returns location of highest played piece 
    getTop: function (gameid, col) {
        for (var i = 0; i < 5; i++)
            if (games.get(gameid).board[i][col] != 0)
                return i;
        return 5;
    },
    //Takes a game out of memory. Gone. Forever.
    deleteGame: function (gameid) {
        games.delete(gameid);
    },
    //Given a board and the most recent piece played, checks if a win exists around that piece.
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
        //start by moving cursor to top left most value on relevent diagonal
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
        //start by moving cursor to top right most value on relevent diagonal
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