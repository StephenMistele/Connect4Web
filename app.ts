const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const md5 = require("md5");
const functions = require('./functions.js');
const app = express()
const port: number = 3000;
app.use(bodyParser.json());
app.use(cors());
expireLoop();

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
      functions.changeTurn(gameid);
      let row: number = functions.getTop(gameid, col);
      if (functions.checkWin(gameid, out[1], col, row)) {
        out[0] = "Game won";
        functions.updatePlayerScore(playerid, "", false, 1);
        let otherplayerid = functions.getOtherPlayer(gameid, playerid);
        functions.updatePlayerScore(otherplayerid, "", false, 0);
        functions.endGame(gameid, playerid)
      }
    }
    else
      out[0] = "Bad insert";
  }
  res.json([{
    data: out
  }])
})

//Ends game for given player
app.post('/quit', (req, res) => {
  let gameid: string = req.body.gameid;
  let playerid: string = req.body.playerid;
  let intentional: number = req.body.col
  if (intentional) {
    functions.updatePlayerScore(playerid, "", false, 0);
    let otherplayerid = functions.getOtherPlayer(gameid, playerid);
    functions.updatePlayerScore(otherplayerid, "", false, 1);
  }
  functions.deleteGame(gameid);
  res.json([{
    data: "quit successful"
  }])
})

//Allows logging and returning current game and player data (nothing sensitive). Not essential for operation
app.get('/debug', (req, res) => {
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

//Submits request for matchmaking
app.post('/matchmake', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = functions.generateGameID(playerid);
  let otherplayerdata: string[] = functions.matchmake(playerid, gameid);
  let startgame = otherplayerdata[0];
  let out: string[] = [];
  if (startgame == "0") {
    let concurrentPlayerCount = otherplayerdata[1];
    let message = functions.joinGame(playerid, gameid);
    out = [startgame, message, gameid, concurrentPlayerCount];
  }
  else {
    let newgameid = otherplayerdata[1];
    functions.deleteGame(gameid)
    let message = functions.joinGame(playerid, newgameid);
    out = [startgame, message, newgameid];
  }
  res.json([{
    data: out
  }])
})

//Removes a player from the matchmaking queue
app.post('/dequeue', (req, res) => {
  let playerid: string = req.body.playerid;
  let gameid: string = req.body.gameid;
  let out: string = functions.dequeue(playerid, gameid);
  res.json([{
    data: out
  }])
})

//Pings are used to determine if players are still using the site
app.post('/ping', (req, res) => {
  let playerid: string = req.body.playerid;
  let out: string = functions.registerPing(playerid);
  res.json([{
    data: out
  }])
})

//Inserts new player data into the mongo db
app.post('/signup', async (req, res) => {
  let username: string = req.body.playerid;
  let password: string = req.body.gameid;
  let hash = md5(password);
  let playerid = functions.generatePlayerID();
  let success: string = await functions.signUpUser(username, hash, playerid);
  let out: string[] = [success, playerid];
  res.json([{
    data: out
  }])
})

//Inserts new player data into the mongo db
app.post('/login', async (req, res) => {
  let username: string = req.body.playerid;
  let password: string = req.body.gameid;
  let hash = md5(password);
  let playerid = functions.generatePlayerID();
  let out: JSON = await functions.loginUser(username, hash, playerid);
  console.log("login info", out);
  res.json([{
    data: out
  }])
})

//Runs every 10s to check for unresponsive players
async function expireLoop() {
  while (true) {
    //Wait 10s
    await new Promise(resolve => setTimeout(resolve, 10000));
    let expiredPlayersInGames: changeplayerscorevals[] = functions.expirePlayers();
    for (let i: number = 0; i < expiredPlayersInGames.length; i++) {
      functions.updatePlayerScore(expiredPlayersInGames[i].playerid, expiredPlayersInGames[i].username, true, 0);
      functions.updatePlayerScore(expiredPlayersInGames[i].otherplayerid, expiredPlayersInGames[i].otherplayerusername, true, 1);
    }
  }
}

app.listen(port, () => console.log(`Listening on port ${port}`));
module.exports = app;