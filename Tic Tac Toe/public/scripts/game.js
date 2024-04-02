
const socket = io();

const player = {
    name: "",
    room: "",
    wins: 0,
    losses: 0,
    ties: 0
}

const playerOne = Object.create(player);
const playerTwo = Object.create(player);

var currentPlayer = "";
var spacesPlayed = [];
var xArray = [];
var oArray = [];
var didWin = false;
var firstGame = true;
var mouseClick = 0;

for(var x = 0; x < 9; x++){
    document.getElementsByClassName("space")[x].addEventListener("pointerdown", testDown);
    document.getElementsByClassName("space")[x].addEventListener("pointerup", testUp);
}

function testDown(event){

    document.getElementById(event.target.id).addEventListener("pointermove", (event) => {
        console.log("left space");
        testUp(event);
    });

    document.getElementById(`${event.target.id}A`).classList.remove("threeD");
    document.getElementById(event.target.id).classList.remove("squishUp");
    document.getElementById(event.target.id).classList.add("squishDown");

}

function testUp(event){
    document.getElementById(`${event.target.id}A`).classList.add("threeD");
    document.getElementById(event.target.id).classList.remove("squishDown");
    document.getElementById(event.target.id).classList.add("squishUp");

}
//PLAYERS ENTER THEIR NAMES
document.getElementById("mainButton").addEventListener("pointerdown", inputName);
document.getElementById("playerName").addEventListener("keydown", inputName);

//'PLAYER TWO' P TAG IS UPDATED WITH THE CORRECT NAME
socket.on('enter name', (playerName, playerOneName, playerRoom) => {

    playerOne.name = playerOneName;
    playerTwo.name = playerName;
    playerOne.room = playerRoom;
    playerTwo.room = playerRoom;

    if(document.getElementById("playerOne").innerText === playerOne.name){
        document.getElementById("playerTwo").innerText = playerName;
    }
    else{
        document.getElementById("playerTwo").innerText = playerOne.name;
    }
    console.log(`p1 is ${playerOne.name}`);
    console.log(`p2 is ${playerTwo.name}`);
    //socket.broadcast.emit('play', playerOne.name, playerOne.room);
    socket.emit('play', playerOne.name, playerOne.room);

});

socket.on('play', (room, movesArray, didWin) => {

    console.log(`whats received: room: ${room} moves: ${movesArray}`);

    for(var x = 0; x < 9; x++){
        document.getElementsByClassName("space")[x].removeEventListener("pointerdown", testDown);
        document.getElementsByClassName("space")[x].removeEventListener("pointerup", testUp);
    }
    if(currentPlayer === document.getElementById("playerOne").innerText){
        sendMovesToOtherPlayer(movesArray);
        playTurn();
    }
});

socket.on('whose turn', (player) => {
   
    currentPlayer = player;
    console.log(`current player: ${currentPlayer}`);
    document.getElementById("playerTurn").innerText = `${player}'s turn`;
});

socket.on('winner', (player, playerDidWin) => {
    firstGame = false;
    didWin = playerDidWin;
    if(!didWin){
        playerOne.ties++;
        playerTwo.ties++;
        document.getElementById("playerTurn").innerText = `Tie Game`;
        document.getElementById("p1Tie").innerText = `Ties: ${playerOne.ties}`;
        document.getElementById("p2Tie").innerText = `Ties: ${playerTwo.ties}`;
    }
    else{
        document.getElementById("playerTurn").innerText = `${player} Wins!!`;
        if(playerOne.name === player){
            playerOne.wins++;
            playerTwo.losses++;
        }
        else{
            playerOne.losses++;
            playerTwo.wins++;
        }
        if(playerOne.name === document.getElementById("playerOne").innerText){

            document.getElementById("p1GamesWon").innerText = `Games Won: ${playerOne.wins}`;
            document.getElementById("p1GamesLost").innerText = `Games Lost: ${playerOne.losses}`;
    
            document.getElementById("p2GamesWon").innerText = `Games Won: ${playerTwo.wins}`;
            document.getElementById("p2GamesLost").innerText = `Games Lost: ${playerTwo.losses}`;
        }
        else{
            document.getElementById("p2GamesWon").innerText = `Games Won: ${playerOne.wins}`;
            document.getElementById("p2GamesLost").innerText = `Games Lost: ${playerOne.losses}`;
    
            document.getElementById("p1GamesWon").innerText = `Games Won: ${playerTwo.wins}`;
            document.getElementById("p1GamesLost").innerText = `Games Lost: ${playerTwo.losses}`;
        }
    }
    for(var y = 0; y < 9; y++){
        document.getElementsByClassName("space")[y].removeEventListener("pointerdown", disableDown);
        document.getElementsByClassName("space")[y].removeEventListener("pointerup", assignMove);
        document.getElementsByClassName("space")[y].removeEventListener("pointermove", assignMove);
    }

    document.getElementById("mainButton").innerText = "Play Again?";
    document.getElementById("mainButton").hidden = false;
});

socket.on('left message', () => {
    console.log("i was called");
    if(document.getElementById("playerTwo").innerText !== 'waiting for player'){
        document.getElementById("playerTurn").innerText = `${document.getElementById("playerTwo").innerText} left`;
    }
    else{
        document.getElementById("playerTurn").innerText = "Other player left";
    }

    document.getElementById("mainButton").hidden = false;
    document.getElementById("mainButton").innerText = "Find other player?";
    //document.getElementById("mainButton").addEventListener("pointerdown", inputName);
});

function reload(){
    location.reload();
}

function sendMovesToOtherPlayer(movesArray){
    console.log("made it here? with " + movesArray);
    if(currentPlayer === playerTwo.name){
        //NEEDS X MOVES
        xArray = [];
        if(movesArray){
            for(var x = 0; x < movesArray.length; x++){
                console.log('x filled');
                xArray.push(movesArray[x]);
                document.getElementById(movesArray[x]).classList.add("playerOnePressed");
            }
        }
    }
    else{
        //NEEDS O MOVES
        oArray = [];
        if(movesArray){
            console.log(`x is ${x}`);
            for(var x = 0; x < movesArray.length; x++){
                console.log('o filled');
                oArray.push(movesArray[x]);
                document.getElementById(movesArray[x]).classList.add("playerTwoPressed");
            }
        }
    }
}

function inputName(event){
    if (event.key === "Enter" || event.target.id === "mainButton") {
        
        if(firstGame && document.getElementById("playerName").value.trim().length !== 0){
            document.getElementById("playerOne").innerText = document.getElementById("playerName").value;
            document.getElementById("playerOne").style.display = "inline";
            socket.emit('enter name', document.getElementById("playerName").value);

            if (document.getElementById('playerTwo').innerText !== 'waiting for player') {
                playerTwo.name = document.getElementById("playerName").value.trim();
                socket.emit('play', document.getElementById('playerTwo').innerText);
                //THIS IS THE O PLAYER
            }
            else {
                //document.getElementById("playerTwo").innerText = playerOne.name;
                console.log("hello");
                console.log(`p1 is ${playerOne.name}`);
                console.log(`p2 is ${playerTwo.name}`);
                playerOne.name = document.getElementById("playerName").value.trim();
            }
            document.getElementById("mainButton").hidden = true;
            document.getElementById("playerName").hidden = true;
        }
        else{
            if(firstGame === false){
                resetGame();
                document.getElementById("mainButton").hidden = true;
                document.getElementById("playerName").hidden = true;
            }
        }
    }
} 

function assignMove(event){
    
    mouseClick++;
            if(mouseClick >= 1){
                for(var y = 0; y < 9; y++){
                    document.getElementsByClassName("space")[y].removeEventListener("pointerdown", disableDown);
                    document.getElementsByClassName("space")[y].removeEventListener("pointerup", assignMove);
                    document.getElementsByClassName("space")[y].removeEventListener("pointermove", assignMove);
                }
            }
            if(event.target.className === "space squishDown"){

                if(playerOne.name === document.getElementById("playerOne").innerText){
                    document.getElementById(event.target.id + 'A').classList.add("threeD", "squishUp");
                    document.getElementById(event.target.id).classList.remove("squishDown");
                    document.getElementById(event.target.id).classList.add("playerOnePressed");
                    
                    spacesPlayed.push(event);
                    sortPlayedSpaces();
                    socket.emit('play', document.getElementById('playerTwo').innerText, playerOne.room, xArray, didWin);
                    //socket.to(playerOne.room).emit('play', document.getElementById('playerTwo').innerText, playerOne.room, xArray, didWin);
                    checkForWin();
                    console.log("did emit");
                }

                else{
                    document.getElementById(event.target.id + 'A').classList.add("threeD", "squishUp");
                    document.getElementById(event.target.id).classList.remove("squishDown");
                    document.getElementById(event.target.id).classList.add("playerTwoPressed");
                    spacesPlayed.push(event);
                    sortPlayedSpaces();
                    socket.emit('play', document.getElementById('playerTwo').innerText, playerTwo.room, oArray, didWin);
                    checkForWin();
                    console.log("emitted too");
                }
            }
            else{
                mouseClick--;
            }
            mouseClick = 0;
            for(var x = 0; x < 9; x++){
                document.getElementsByClassName("space")[x].removeEventListener("pointerdown", disableDown);
                document.getElementsByClassName("space")[x].removeEventListener("pointerup", assignMove);
                document.getElementsByClassName("space")[x].removeEventListener("pointermove", assignMove);
            }
}

function disableDown(event){

    document.getElementById(`${event.target.id}A`).classList.remove("threeD");
    document.getElementById(event.target.id).classList.remove("squishUp");
    document.getElementById(event.target.id).classList.add("squishDown");

    document.getElementById(event.target.id).addEventListener("pointermove", assignMove);
}

function playTurn(){
    for(var x = 0; x < 9; x++){
        document.getElementsByClassName("space")[x].addEventListener("pointerdown", disableDown);
        document.getElementsByClassName("space")[x].addEventListener("pointerup", assignMove);
    }
} 

function sortPlayedSpaces(){
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
}

function checkForWin(){

    checkVertical(xArray, playerOne.name);
    checkVertical(oArray, playerTwo.name);
    checkHorizontal(xArray, playerOne.name);
    checkHorizontal(oArray, playerTwo.name);
    checkDiagonal(xArray, playerOne.name);
    checkDiagonal(oArray, playerTwo.name);
    if(!didWin){
        if((xArray.length + oArray.length) === 9){
            socket.emit('winner', currentPlayer, playerOne.room, false);
        }
    }
}

function winner(player){
    didWin = true;
    socket.emit('winner', player, playerOne.room, didWin);
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

function resetGame(){
    spacesPlayed = [];
    xArray = [];
    oArray = [];
    didWin = false;

    for(var x = 1; x < 10; x++){
        document.getElementById(`box${x}`).classList.remove("playerOnePressed");
        document.getElementById(`box${x}`).classList.remove("playerTwoPressed");
    }
    socket.emit('play', currentPlayer, playerOne.room, xArray, didWin);
}

