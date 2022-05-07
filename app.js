var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
var port = 3000;
var functions = require('./functions.js');
app.get('/healthcheck', function (req, res) {
    res.status(200).json([{
            status: 'Still Alive'
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
    var out = "";
    //Not your turn
    if (functions.checkTurn(playerid, gameid) != 1)
        out = "Not your turn";
    //Your turn
    else {
        out = functions.insert(col, playerid, gameid);
        if (out[0] == "Good insert") {
            functions.changeTurn(gameid);
            var row = functions.getTop(gameid, col);
            if (functions.checkWin(gameid, out[1], col, row)) {
                out = "Game won";
                //delete entry from table
            }
        }
        else
            out = "Bad insert";
    }
    res.json([{
            data: out
        }]);
});
app.listen(port, function () { return console.log("Listening on port ".concat(port)); });
//# sourceMappingURL=app.js.map