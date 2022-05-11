const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const functions = require('./functions.js');
const app = express()
app.use(bodyParser.json());
app.use(cors());
const port = 3000;

app.get('/healthcheck', (req, res) => {
  res.status(200).json([{
    data: 'Still Alive'
  }])
})

app.post('/createboard', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = req.body.gameid;
  let out: string = functions.createBoard(playerid, gameid);
  res.json([{
    data: out
  }])
})

app.post('/checkturn', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = req.body.gameid;
  let out: number[] = functions.checkTurn(playerid, gameid);
  if (out[0] == -2)
    functions.deleteGame(gameid);
  res.json([{
    data: out
  }])
})

app.post('/debug', (req, res) => {
  let gameid: string = req.body.gameid;
  let out: string = functions.debug(gameid);
  res.json([{
    data: out
  }])
})

app.post('/generategameid', (req, res) => {
  let out: string = functions.generateGameID();
  res.json([{
    data: out
  }])
})

app.post('/generateplayerid', (req, res) => {
  let out: string = functions.generatePlayerID();
  res.json([{
    data: out
  }])
})

app.post('/move', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = req.body.gameid;
  let col: number = req.body.col;
  let out: [string, number, []];

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
      let row: number = functions.getTop(gameid, col);
      if (functions.checkWin(gameid, out[1], col, row)){
        out[0] = "Game won";
        functions.changeTurn(gameid, true)
        //functions.deleteGame(gameid);
      }
    }
    else
      out[0] = "Bad insert";
  }
  console.log("move:", out, playerid);
  res.json([{
    data: out
  }])
})

app.listen(port, () => console.log(`Listening on port ${port}`));