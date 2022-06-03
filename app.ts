const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const functions = require('./functions.js');
const app = express()
const port: number = 3000;
app.use(bodyParser.json());
app.use(cors());

//Lets players generate unique gameid
app.post('/generategameid', (req, res) => {
  let playerid: string = req.body.playerid;
  let out: string = functions.generateGameID(playerid);
  // console.log(out, "gameid")
  res.json([{
    data: out
  }])
})

//Lets players generate unique playerid
app.post('/generateplayerid', (req, res) => {
  let out: string = functions.generatePlayerID();
  // console.log(out, "playerid")
  res.json([{
    data: out
  }])
})

//Allows players to create/join game rooms
app.post('/createboard', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = req.body.gameid;
  let out: string = functions.joinGame(playerid, gameid);
  // console.log(out, "createboard")
  res.json([{
    data: out
  }])
})

//Allows players to check gamestate, like turn and game status
app.post('/checkturn', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = req.body.gameid;
  let out: number[] = functions.checkTurn(playerid, gameid);
  // console.log(out, "checkturn")

  if (out[0] == -2)
    functions.deleteGame(gameid);
  res.json([{
    data: out
  }])
})

//Player request to insert piece
app.post('/move', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = req.body.gameid;
  let col: number = req.body.col;
  let out: [string, number, []];

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
      let row: number = functions.getTop(gameid, col);
      if (functions.checkWin(gameid, out[1], col, row)){
        out[0] = "Game won";
        functions.modifyBoardState(gameid, playerid, true)
        //functions.deleteGame(gameid);
      }
    }
    else
      out[0] = "Bad insert";
  }
  // console.log("move:", out, playerid);
  res.json([{
    data: out
  }])
})

//Ends game for given player
app.post('/quit', (req, res) => {
  let gameid: string = req.body.gameid;
  functions.deleteGame(gameid);
  res.json([{
    data: "quit successful"
  }])
})

//Allows logging and returning of all game and player data (nothing sensitive). Not essential for operation
app.post('/debug', (req, res) => {
  let out: string = functions.debug();
  res.json([{
    data: out
  }])
})

//Allows simple get request to check if API is alive. Not essential for operation
app.get('/healthcheck', (req, res) => {
  res.status(200).json([{
    data: 'Still Alive'
  }])
})

//Can be used for matchmaking in future
// app.post('/queue', (req, res) => {
//   let playerid: string = req.body.playerid;
//   let out: string = functions.queue(playerid);
//   res.json([{
//     data: out
//   }])
// })

app.listen(port, () => console.log(`Listening on port ${port}`));
module.exports = app;