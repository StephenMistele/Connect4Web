var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var functions = require('./functions.js');
var app = express();
app.use(bodyParser.json());
app.use(cors());
var port = 3000;
app.get('/healthcheck', function (req, res) {
    res.status(200).json([{
            data: 'Still Alive'
        }]);
});
app.post('/createboard', function (req, res) {
    var playerid = req.body.playerid;
    var gameid = req.body.gameid;
    var out = functions.createBoard(playerid, gameid);
    res.json([{
            data: out
        }]);
});
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
app.post('/debug', function (req, res) {
    var gameid = req.body.gameid;
    var out = functions.debug(gameid);
    res.json([{
            data: out
        }]);
});
app.post('/generategameid', function (req, res) {
    var out = functions.generateGameID();
    res.json([{
            data: out
        }]);
});
app.post('/generateplayerid', function (req, res) {
    var out = functions.generatePlayerID();
    res.json([{
            data: out
        }]);
});
app.post('/move', function (req, res) {
    var playerid = req.body.playerid;
    var gameid = req.body.gameid;
    var col = req.body.col;
    var out;
    //Game doesn't exist
    if (functions.checkTurn(playerid, gameid) == -2)
        out = ["Game doesn't exist", 0, []];
    //Not your turn
    else if (!Array.isArray(functions.checkTurn(playerid, gameid)))
        out = ["Not your turn", 0, []];
    //Your turn
    else {
        out = functions.insert(col, playerid, gameid);
        if (out[0] == "Good insert") {
            functions.changeTurn(gameid, false);
            var row = functions.getTop(gameid, col);
            if (functions.checkWin(gameid, out[1], col, row)) {
                out[0] = "Game won";
                functions.changeTurn(gameid, true);
                //functions.deleteGame(gameid);
            }
        }
        else
            out[0] = "Bad insert";
    }
    console.log("move:", out, playerid);
    res.json([{
            data: out
        }]);
});
app.listen(port, function () { return console.log("Listening on port ".concat(port)); });
module.exports = app;
//# sourceMappingURL=app.js.map