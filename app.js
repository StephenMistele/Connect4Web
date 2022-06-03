var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var functions = require('./functions.js');
var app = express();
var port = 3000;
app.use(bodyParser.json());
app.use(cors());
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
    // console.log(out, "checkturn")
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
            functions.modifyBoardState(gameid, "0", true);
            var row = functions.getTop(gameid, col);
            if (functions.checkWin(gameid, out[1], col, row)) {
                out[0] = "Game won";
                functions.modifyBoardState(gameid, playerid, true);
                //functions.deleteGame(gameid);
            }
        }
        else
            out[0] = "Bad insert";
    }
    // console.log("move:", out, playerid);
    res.json([{
            data: out
        }]);
});
//Ends game for given player
app.post('/quit', function (req, res) {
    var gameid = req.body.gameid;
    functions.deleteGame(gameid);
    res.json([{
            data: "quit successful"
        }]);
});
//Allows logging and returning of all game and player data (nothing sensitive). Not essential for operation
app.post('/debug', function (req, res) {
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
//Can be used for matchmaking in future
// app.post('/queue', (req, res) => {
//   let playerid: string = req.body.playerid;
//   let out: string = functions.queue(playerid);
//   res.json([{
//     data: out
//   }])
// })
app.listen(port, function () { return console.log("Listening on port ".concat(port)); });
module.exports = app;
//# sourceMappingURL=app.js.map