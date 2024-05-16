const socket = io();

var imageArray = ["images/matchImages/xbox.svg", "images/matchImages/tiktok.svg", "images/matchImages/playstation.svg", "images/matchImages/rocket-takeoff.svg", "images/matchImages/nintendo-switch.svg",
                  "images/matchImages/amd.svg", "images/matchImages/android2.svg", "images/matchImages/floppy.svg", "images/matchImages/gpu-card.svg", "/images/matchImages/music-player.svg"];
var randomImageArray = [];
var usedNumberArray = [];
var checkArray = [];
var idArray = [];
var activeCardCount = 0;
var numberOfMatches = 0;
var gameMode = "";
var start = new Date();
var gameTimer;
var gameTime;


//ACTIVATES NORMAL AND HARD BUTTONS
document.getElementById("normal").addEventListener('click', clickPlay);
document.getElementById("hard").addEventListener('click', clickPlay);

if(/iPhone/.test(navigator.userAgent)){
    document.getElementById("normal").style.fontFamily = "'Chakra Petch', sans-serif";
    document.getElementById("hard").style.fontFamily = "'Chakra Petch', sans-serif";
    document.getElementsByTagName("body")[0].style.fontFamily = "'Chakra Petch', sans-serif";
}

function randomImages(){

    randomImageArray = [];
    generatePlacementArray(10);

    for(var x = 0; x < 10; x++){
        randomImageArray.push(imageArray[usedNumberArray[x]]);
        randomImageArray.push(imageArray[usedNumberArray[x]]);
    }
    usedNumberArray = [];
}

function playSound(soundFile){
    var audio = new Audio(soundFile);
    audio.play();
}

function generatePlacementArray(matchNumber){
    for(var x = 0; x < matchNumber; x++){
        randomNumber = Math.floor(Math.random() * matchNumber);

        while(usedNumberArray.includes(randomNumber)){
            randomNumber = Math.floor(Math.random() * matchNumber);
        }
        usedNumberArray.push(randomNumber);
    }
}

function playScreenSetup(buttonID){
    var y = window.matchMedia("(max-width: 480px)");
    var m = window.matchMedia("(max-width: 576px)");
    var z = window.matchMedia("(max-width: 991px)");

    randomImages();

    if(buttonID === "normal"){
        console.log("normal clicked");
        start = Date.now();
        runTimer();
        gameMode = "normal";
        socket.emit('get best', gameMode);
        socket.on('send best time', (time) => {
            document.getElementById("bestTime").innerText = `Best Time: ${time}`;
        });
        
        if(y.matches){
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 65px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(2, 65px)";
            document.getElementById("gameContainer").style.gap = "5px";
            document.getElementById("gameContainer").style.marginTop = "110px";
        }
        else if(m.matches){
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 85px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(2, 85px)";
            document.getElementById("gameContainer").style.gap = "10px";
            document.getElementById("gameContainer").style.marginTop = "60px";
        }
        else if(z.matches){
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 125px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(2, 125px)";
            document.getElementById("gameContainer").style.gap = "15px";
            document.getElementById("gameContainer").style.marginTop = "60px";
        }
        else{
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 200px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(2, 200px)";
            document.getElementById("gameContainer").style.gap = "15px";
            document.getElementById("gameContainer").style.marginTop = "60px";
        }

        for(var x = 10; x < document.getElementsByClassName("card").length; x++){
            document.getElementById("num" + (x+1)).style.display = "none";
        }
        generatePlacementArray(10);
        console.log(usedNumberArray);
    }
    else if(buttonID === "hard"){
        console.log("hard clicked");
        start = Date.now();
        runTimer();
        gameMode = "hard";
        socket.emit('get best', gameMode);
        socket.on('send best time', (time) => {
            document.getElementById("bestTime").innerText = `Best Time: ${time}`;
        });

        for(var x = 10; x < document.getElementsByClassName("card").length; x++){
            document.getElementById("num" + (x+1)).style.display = "block";
        }

        if(y.matches){
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 65px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(4, 65px)";
            document.getElementById("gameContainer").style.gap = "5px";
            document.getElementById("gameContainer").style.marginTop = "50px";
        }
        else if(m.matches){
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 100px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(4, 100px)";
            document.getElementById("gameContainer").style.gap = "5px";
            document.getElementById("gameContainer").style.marginTop = "50px";
        }
        else if(z.matches){
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 125px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(4, 125px)";
            document.getElementById("gameContainer").style.gap = "10px";
            document.getElementById("gameContainer").style.marginTop = "50px";
        }
        else{
            document.getElementById("gameContainer").style.gridTemplateColumns = "repeat(5, 150px)";
            document.getElementById("gameContainer").style.gridTemplateRows = "repeat(4, 150px)";
            document.getElementById("gameContainer").style.gap = "15px";
            document.getElementById("gameContainer").style.marginTop = "0px";
        }
        generatePlacementArray(20);
    }

    //MAKES ALL CARDS CLICKABLE
    for(var x = 0; x < document.getElementsByClassName("card").length; x++){
        document.getElementsByClassName("card")[x].addEventListener('click', imageClicked);
    }

    document.getElementById("buttonContainer").style.display = "none";
    document.getElementById("gameContainer").style.display = "grid";
}

function winScreen(){
    clearTimeout(gameTimer);
    let newTime = new Date(gameTime);
    //console.log(newTime < start);
    socket.emit('matches found', gameTime, gameMode);
    setTimeout(() => {
        document.querySelector("h1").innerHTML = "YOU WIN!!!!";
        playSound("sounds/winChime.mp3");
    }, 2250);

    setTimeout(() => {
        //NEED TO UPDATE THIS SO THAT USER CAN CHOOSE DIFFICULTY - LABEL???
        document.getElementById("playAgain").innerHTML = "Play Again?";
        document.getElementById("playAgain").style.display = "block";
        document.getElementById("buttonContainer").style.display = "flex";
        document.getElementById("gameContainer").style.display = "none";
    }, 7000);
}

function clickPlay(){

    if(document.getElementById("playAgain").innerHTML === "Play Again?"){
        replaySetup(this.id);
    }

    else{
        console.log("ready");
        playScreenSetup(this.id);
    }
}

function replaySetup(buttonID){
    usedNumberArray = [];
    checkArray = [];
    idArray = [];
    activeCardCount = 0;
    numberOfMatches = 0;
    gameMode = "";
    
    document.querySelector("h1").innerHTML = "Match Game!";
    document.getElementById("playAgain").style.display = "none";

    //MAKES ALL CARDS CLICKABLE
    for(var x = 0; x < document.getElementsByClassName("card").length; x++){
        document.getElementsByClassName("card")[x].addEventListener('click', imageClicked);
        document.getElementById("num" + (x+1)).style.transform = "rotateY(0deg) rotateZ(0deg)";
    }

    playScreenSetup(buttonID);
}

function imageClicked(){
    for(var x = 1; x <= document.getElementsByClassName("card").length; x++){
        if(this.id === "num" + x){
            document.getElementsByClassName("backOfCard")[x-1].src = randomImageArray[usedNumberArray[x-1]];
            document.getElementById("num" + x).style.transform = "rotateY(180deg) rotateZ(180deg)";
            document.getElementsByClassName("card")[x-1].removeEventListener('click', imageClicked);
            document.getElementById("num" + x).style.cursor = "default";
            checkArray.push(document.getElementsByClassName("backOfCard")[x-1]);
            activeCardCount++;
        }
    }

    if(activeCardCount === 2){
        for(var x = 0; x < document.getElementsByClassName("card").length; x++){
            document.getElementsByClassName("card")[x].removeEventListener('click', imageClicked);
            document.getElementById("num" + (x+1)).style.cursor = "default";
        }
        
        if(checkArray[0].src === checkArray[1].src){
           idArray.push(checkArray[0].id);
           idArray.push(checkArray[1].id);
           setTimeout(() => {
            playSound("sounds/correctDing.mp3");
           }, 500);
           ++numberOfMatches;
           if(numberOfMatches === 5 && gameMode === "normal"){
                winScreen();
           }
           else if(numberOfMatches === 10 && gameMode === "hard"){
                winScreen();
           }
        }
        setTimeout(() => {
            for(var x = 0; x < document.getElementsByClassName("card").length; x++){
                if(!idArray.includes(document.getElementsByClassName("backOfCard")[x].id)){
                    document.getElementById("num" + (x+1)).style.transform = "rotateY(0deg) rotateZ(0deg)";
                    document.getElementsByClassName("card")[x].addEventListener('click', imageClicked);
                    document.getElementById("num" + (x+1)).style.cursor = "pointer";
                }
            }
        }, 1250);
        checkArray = [];
        activeCardCount = 0;
    }
}

function runTimer(){
    gameTime = new Date(new Date(Date.now()) - start);
    console.log(gameTime);
    document.getElementById("minutes").innerText = gameTime.getMinutes();
    document.getElementById("seconds").innerText = gameTime.getSeconds();
    document.getElementById("milli").innerText = gameTime.getMilliseconds();
    gameTimer = setTimeout(runTimer, 1);
}

