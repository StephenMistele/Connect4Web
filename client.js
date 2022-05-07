const fetch = require("node-fetch");

// async function runScript(path, gameid, playerid, col) {
  
//   var requestBody = {
//     method: 'POST',
    // gameid: gameid,
    // playerid: playerid,
    // col: col
//   }
//   const response = await fetch("http://localhost:3000/" + path, requestBody);     
//   const pageText = await response.text();
//   if (!response.ok) {
//     throw new Error('non-200 response');
//   }
//   return pageText
// };
// runScript("createboard", 10, 1, 0)
// runScript("createboard", 10, 2, 0)
// var res1 = runScript("move", 10, 1, 0)


// setTimeout(function(){
//   console.log(res1);
// }, 1000);

const json = require("json")
const prompt = require('prompt-sync')();


function query(path, gameid, playerid, col) {
  //Set up URL to query
  var url = "http://localhost:3000/" + path
  //Set up query method
  var requestOptions = {
    method: 'POST',
    redirect: 'follow',
    gameid: gameid,
    playerid: playerid,
    col: col
  };
  //Make query using fetch
  var output = fetch(url, requestOptions)
  .then(response => response.text())
  .then(result => handleOutput(result))
    .catch(error => console.log('error', error));
    //Process output
    function handleOutput(value) {
      console.log(value)
    }
  }
  

query("createboard", 10, 1, 0)
query("createboard", 10, 2, 0)
let inp = 0
let turn = 1
while (inp != -1){
  inp = prompt('Move');
  console.log(query("move", 10, 1, inp))
  if (turn == 1)
    turn = 0
  else
    turn = 1
}