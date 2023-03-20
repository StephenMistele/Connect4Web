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
var _this = this;
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var md5 = require("md5");
var functions = require('./functions.js');
var app = express();
var port = 3000;
app.use(bodyParser.json());
app.use(cors());
expireLoop();
//Lets players generate unique gameid
app.post('/generategameid', function (req, res) {
    var playerid = req.body.playerid;
    var out = functions.generateGameID(playerid);
    // console.log(out, "gameid")
    res.json([{
            data: out
        }]);
});
//Lets players generate unique playerid
app.post('/generateplayerid', function (req, res) {
    var out = functions.generatePlayerID();
    // console.log(out, "playerid")
    res.json([{
            data: out
        }]);
});
//Allows players to create/join game rooms
app.post('/createboard', function (req, res) {
    var playerid = req.body.playerid;
    var gameid = req.body.gameid;
    var out = functions.joinGame(playerid, gameid);
    // console.log(out, "createboard")
    res.json([{
            data: out
        }]);
});
//Allows players to check gamestate, like turn and game status
app.post('/checkturn', function (req, res) {
    var playerid = req.body.playerid;
    var gameid = req.body.gameid;
    var out = functions.checkTurn(playerid, gameid);
    if (out[0] == -2)
        functions.deleteGame(gameid);
    res.json([{
            data: out
        }]);
});
//Player request to insert piece
app.post('/move', function (req, res) {
    var playerid = req.body.playerid;
    var gameid = req.body.gameid;
    var col = req.body.col;
    var out;
    //Game doesn't exist
    if (functions.checkTurn(playerid, gameid) == -2)
        out = ["Game doesn't exist", 0, []];
    //Not your turn
    else if (functions.checkTurn(playerid, gameid)[0] != 1)
        out = ["Not your turn", 0, []];
    //Your turn
    else {
        out = functions.insert(col, playerid, gameid);
        if (out[0] == "Good insert") {
            functions.changeTurn(gameid);
            var row = functions.getTop(gameid, col);
            if (functions.checkWin(gameid, out[1], col, row)) {
                out[0] = "Game won";
                functions.updatePlayerScore(playerid, "", false, 1);
                var otherplayerid = functions.getOtherPlayer(gameid, playerid);
                functions.updatePlayerScore(otherplayerid, "", false, 0);
                functions.endGame(gameid, playerid);
            }
        }
        else
            out[0] = "Bad insert";
    }
    res.json([{
            data: out
        }]);
});
//Ends game for given player
app.post('/quit', function (req, res) {
    var gameid = req.body.gameid;
    var playerid = req.body.playerid;
    var intentional = req.body.col;
    if (intentional) {
        functions.updatePlayerScore(playerid, "", false, 0);
        var otherplayerid = functions.getOtherPlayer(gameid, playerid);
        functions.updatePlayerScore(otherplayerid, "", false, 1);
    }
    functions.deleteGame(gameid);
    res.json([{
            data: "quit successful"
        }]);
});
//Allows logging and returning current game and player data (nothing sensitive). Not essential for operation
app.get('/debug', function (req, res) {
    var out = functions.debug();
    res.json([{
            data: out
        }]);
});
//Allows simple get request to check if API is alive. Not essential for operation
app.get('/healthcheck', function (req, res) {
    res.status(200).json([{
            data: 'Still Alive'
        }]);
});
//Submits request for matchmaking
app.post('/matchmake', function (req, res) {
    var playerid = req.body.playerid;
    var gameid = functions.generateGameID(playerid);
    var otherplayerdata = functions.matchmake(playerid, gameid);
    var startgame = otherplayerdata[0];
    var out = [];
    if (startgame == "0") {
        var concurrentPlayerCount = otherplayerdata[1];
        var message = functions.joinGame(playerid, gameid);
        out = [startgame, message, gameid, concurrentPlayerCount];
    }
    else {
        var newgameid = otherplayerdata[1];
        functions.deleteGame(gameid);
        var message = functions.joinGame(playerid, newgameid);
        out = [startgame, message, newgameid];
    }
    res.json([{
            data: out
        }]);
});
//Removes a player from the matchmaking queue
app.post('/dequeue', function (req, res) {
    var playerid = req.body.playerid;
    var gameid = req.body.gameid;
    var out = functions.dequeue(playerid, gameid);
    res.json([{
            data: out
        }]);
});
//Pings are used to determine if players are still using the site
app.post('/ping', function (req, res) {
    var playerid = req.body.playerid;
    var out = functions.registerPing(playerid);
    res.json([{
            data: out
        }]);
});
//Inserts new player data into the mongo db
app.post('/signup', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var username, password, hash, playerid, success, out;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                username = req.body.playerid;
                password = req.body.gameid;
                hash = md5(password);
                playerid = functions.generatePlayerID();
                return [4 /*yield*/, functions.signUpUser(username, hash, playerid)];
            case 1:
                success = _a.sent();
                out = [success, playerid];
                res.json([{
                        data: out
                    }]);
                return [2 /*return*/];
        }
    });
}); });
//Inserts new player data into the mongo db
app.post('/login', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var username, password, hash, playerid, out;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                username = req.body.playerid;
                password = req.body.gameid;
                hash = md5(password);
                playerid = functions.generatePlayerID();
                return [4 /*yield*/, functions.loginUser(username, hash, playerid)];
            case 1:
                out = _a.sent();
                console.log("login info", out);
                res.json([{
                        data: out
                    }]);
                return [2 /*return*/];
        }
    });
}); });
//Runs every 10s to check for unresponsive players
function expireLoop() {
    return __awaiter(this, void 0, void 0, function () {
        var expiredPlayersInGames, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 2];
                    //Wait 10s
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10000); })];
                case 1:
                    //Wait 10s
                    _a.sent();
                    expiredPlayersInGames = functions.expirePlayers();
                    for (i = 0; i < expiredPlayersInGames.length; i++) {
                        functions.updatePlayerScore(expiredPlayersInGames[i].playerid, expiredPlayersInGames[i].username, true, 0);
                        functions.updatePlayerScore(expiredPlayersInGames[i].otherplayerid, expiredPlayersInGames[i].otherplayerusername, true, 1);
                    }
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    });
}
app.listen(port, function () { return console.log("Listening on port ".concat(port)); });
module.exports = app;
//# sourceMappingURL=app.js.map