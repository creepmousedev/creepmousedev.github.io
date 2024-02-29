const socket = io();

var playerOneName = "";
var playerTwoName = "";
var currentPlayer = "";
var spacesPlayed = [];
var xArray = [];
var oArray = []; 


//PLAYERS ENTER THEIR NAMES
document.getElementById("playerName").addEventListener("keydown", function(event){
    
    if(event.key === "Enter"){
        document.getElementById("playerOne").innerText = document.getElementById("playerName").value;
        document.getElementById("playerOne").style.display = "inline";

        socket.emit('enter name', document.getElementById("playerName").value);
        this.hidden = true;
        if(document.getElementById('playerTwo').innerText !== 'waiting for player'){
            playerTwoName = document.getElementById("playerName").value;
            console.log('ready to play');
            socket.emit('play', document.getElementById('playerTwo').innerText);
            //THIS IS THE O PLAYER
        }
        else{
            console.log("i'm player one: X");
            playerOneName = document.getElementById("playerName").value;
        }
    }
});

//'PLAYER TWO' P TAG IS UPDATED WITH THE CORRECT NAME
socket.on('enter name', (playerName) => {
    console.log(`this name is being received: ${playerName}`);
    document.getElementById("playerTwo").innerText = playerName;
    if(document.getElementById("playerOne").innerText !== ""){
        console.log("ready to play too");
    }
});

socket.on('play', (movesArray) => {
    if(currentPlayer === playerTwoName){
        //NEEDS X MOVES
        xArray = [];
        if(movesArray){
            for(var x = 0; x < movesArray.length; x++){
                xArray.push(movesArray[x]);
                document.getElementById(movesArray[x]).classList.add("playerOnePressed");
            }
        }
    }
    else{
        //NEEDS O MOVES
        oArray = [];
        if(movesArray){
            for(var x = 0; x < movesArray.length; x++){
                oArray.push(movesArray[x]);
                document.getElementById(movesArray[x]).classList.add("playerTwoPressed");
            }
        }
    }
    playTurn();
});

socket.on('whose turn', (player) => {
   
    currentPlayer = player;
    document.getElementById("playerTurn").innerText = `${player}'s turn`;
});

socket.on('winner', (player) => {
    console.log('winner function here');
    document.getElementById("playerTurn").innerText = `${player} Wins!!`;
});


function playTurn(){
    let mouseClick = 0;
    for(var x = 0; x < 10; x++){
        document.getElementsByClassName("space")[x].addEventListener("pointerdown", function(event){

            mouseClick++;
            console.log(mouseClick);
            if(mouseClick > 1){
                console.log("did we check?");
                for(var y = 0; y < 10; y++){
                    document.getElementsByClassName("space")[y].removeEventListener("pointerdown", ()=>{});
                    console.log("removed listener?");
                }
            }
            if(event.target.className === "space"){

                if(playerOneName === document.getElementById("playerOne").innerText){
                    document.getElementById(event.target.id).classList.add("playerOnePressed");
                    spacesPlayed.push(event);
                    checkForWin();
                    socket.emit('play', document.getElementById('playerTwo').innerText, xArray);
                }

                else{
                    document.getElementById(event.target.id).classList.add("playerTwoPressed");
                    spacesPlayed.push(event);
                    checkForWin();
                    socket.emit('play', document.getElementById('playerTwo').innerText, oArray);
                }
            }
            else{
                mouseClick--;
                console.log("space has already been played");
            }
        });
    }
}

function checkForWin(){

    for(var x = 0; x < spacesPlayed.length; x++){
        if(spacesPlayed[x].target.className === "space playerOnePressed"){
            if(!xArray.includes(spacesPlayed[x].target.id)){
                xArray.push(spacesPlayed[x].target.id);
            }
        }
        else if(spacesPlayed[x].target.className === "space playerTwoPressed"){
            if(!oArray.includes(spacesPlayed[x].target.id)){
                oArray.push(spacesPlayed[x].target.id);
            }
        }
    }

    checkVertical(xArray, playerOneName);
    checkVertical(oArray, playerTwoName);
    checkHorizontal(xArray, playerOneName);
    checkHorizontal(oArray, playerTwoName);
    checkDiagonal(xArray, playerOneName);
    checkDiagonal(oArray, playerTwoName);
}

function winner(player){

    if(player === playerOneName){
        console.log(`${player} wins!`);
        socket.emit('play', player, xArray, true);
        //document.getElementById("playerTurn").innerText = `${player} Wins!!`;
    }
    else{
        console.log(`${player} wins!`);
        socket.emit('play', player, oArray, true);
        //document.getElementById("playerTurn").innerText = `${player} Wins!!`;
    }
}

function checkVertical(someArray, player){
    for(var x = 1; x < 4; x++){
        if(someArray.includes(`box${x}`) && someArray.includes(`box${x+3}`) && someArray.includes(`box${x+6}`)){
            winner(player);
        }
    }
}

function checkHorizontal(someArray, player){
    for(var x = 1; x < 8; x+=3){
        if(someArray.includes(`box${x}`) && someArray.includes(`box${x+1}`) && someArray.includes(`box${x+2}`)){
            winner(player);
        }
    }
}

function checkDiagonal(someArray, player){
    let x = 1;
    if(someArray.includes(`box${x}`) && someArray.includes(`box${x+4}`) && someArray.includes(`box${x+8}`)){
        winner(player);
    }
    else if(someArray.includes(`box${x+2}`) && someArray.includes(`box${x+4}`) && someArray.includes(`box${x+6}`)){
        winner(player);
    }
}

