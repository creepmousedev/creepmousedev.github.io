const socket = io();

var clicks = 0;
var degrees = 0;
var currentLevel = 1;
var highScore = 1;
var cpuArray = [];
var playerActive = false;
var gameModeClassic = true;

setupAllButtons();

$("#normalButton").on("pointerdown", startGame);
$("#classicButton").on("pointerdown", startGame);

function startGame (event){
    
    event.target.id === 'normalButton' ? gameModeClassic = false : gameModeClassic = true;
    socket.emit('get high score', event.target.id, document.cookie.split('=')[1]);
    playCpuArray();
}

socket.on('send high score', (score) => {
    console.log('receiving score');
    console.log(typeof(score));
    score === null ? highScore = 1 : highScore = score;
    $("#highScore").text(`High Score: ${score}`);
});

function playCpuArray(){
    //START CPU ARRAY AND THEN WAIT FOR PLAYER TO PUT IN THE PATTERN
    console.log(`the current degrees are: ${degrees}`);
    console.log("buttons off");
    $(".buttons").off();

    setTimeout(() => {
        setupAllButtons();
        playerActive = true;
        clicks = 0;
        console.log("buttons back on");
    }, (cpuArray.length*750)+1250); //I THINK I GOT THIS VALUE BY ADDING 750+500

    $("#normalButton").hide();
    $("#classicButton").hide();
    $("h1").text("Adam Says...");
    $("#level").text(`Level: ${currentLevel}`);
    generateRandomNumber();
    console.log(cpuArray);

    $.each(cpuArray, function(index, value){
        setTimeout(() => {
            switch(value){
                case 0:
                    cpuDisplayEffects("#greenButton", "images/saysImages/newGreenButtonhighlight.png", "sounds/saysSounds/green.mp3");
                    break;
                case 1:
                    cpuDisplayEffects("#blueButton", "images/saysImages/newBlueButtonHighlight.png", "sounds/saysSounds/blue.mp3");
                    break;
                case 2:
                    cpuDisplayEffects("#yellowButton", "images/saysImages/newYellowButtonHighlight.png", "sounds/saysSounds/yellow.mp3");
                    break;
                case 3:
                    cpuDisplayEffects("#redButton", "images/saysImages/newRedButtonHighlight.png", "sounds/saysSounds/red.mp3");
                    break;
                default:
                    console.log("something went wrong with switch");
            }
        }, (index+1) * 750);
    })
}

function cpuDisplayEffects(button, imagePressed, audioFile){
    $(button).css("background-image", `url(${imagePressed})`);
    var audio = new Audio(audioFile);
    audio.play();
    setTimeout(() => {
        resetButtons();
    }, 500);
}

function playerInputPattern(eventID){

    if(playerActive){
        clicks++;
        switch(eventID){
            case "greenButton":
                keepPlayingOrEndGame(0);
                break;
            
            case "blueButton":
                keepPlayingOrEndGame(1);
                break;

            case "yellowButton":
                keepPlayingOrEndGame(2);
                break;

            case "redButton":
                keepPlayingOrEndGame(3);
                break;

            default:
                console.log("default case called");
                break;
        }
    }
}

function keepPlayingOrEndGame(buttonNumber){
    if(cpuArray.at(clicks - 1) === buttonNumber){
        if(clicks < cpuArray.length){
            console.log("keep playing");
        }
        else{
            $("#level").text(`Level: ${++currentLevel}`);
            if(currentLevel > highScore){
                highScore = currentLevel;
                $("#highScore").text(`High Score: ${highScore}`);
            }
            if(!gameModeClassic){
                buttonAnimation();
            }
            setTimeout(() => {
                playCpuArray();
            }, 350);
        }
    }
    else{
        socket.emit('says score', highScore, gameModeClassic, document.cookie.split('=')[1]);
        resetGame();
    }
}

function resetGame(){
    var lost = new Audio("sounds/saysSounds/wrong.mp3");
    degrees = 0;
    clicks = 0;
    currentLevel = 1;
    cpuArray = [];
    playerActive = false;
    setTimeout(() => {
        lost.play();
        $("h1").text("You lose!");
        $("#normalButton").show();
        $("#classicButton").show();
    }, 500);
}

function resetButtons(){
    $('#greenButton').css("background-image", 'url(images/saysImages/newGreenButton.png)');
    $('#blueButton').css("background-image", 'url(images/saysImages/newBlueButton.png)');
    $('#yellowButton').css("background-image", 'url(images/saysImages/newYellowButton.png)');
    $('#redButton').css("background-image", 'url(images/saysImages/newRedButton.png)');
}

function setupButton(button, image, imagePressed, audioFile){
    var audio = new Audio(audioFile);
    $(button).on("pointerdown", function(){
        $(this).css("background-image", `url(${imagePressed})`);
        audio.play();
    }).on("pointerup", function(event){
        audio.pause();
        audio.currentTime = 0;
        $(this).css("background-image", `url(${image})`);
        playerInputPattern(event.target.id);
    });
}

function setupAllButtons(){
    setupButton("#greenButton", "images/saysImages/newGreenButton.png", "images/saysImages/newGreenButtonhighlight.png", "sounds/saysSounds/green.mp3");
    setupButton("#blueButton", "images/saysImages/newBlueButton.png", "images/saysImages/newBlueButtonHighlight.png", "sounds/saysSounds/blue.mp3");
    setupButton("#yellowButton", "images/saysImages/newYellowButton.png", "images/saysImages/newYellowButtonHighlight.png", "sounds/saysSounds/yellow.mp3");
    setupButton("#redButton", "images/saysImages/newRedButton.png", "images/saysImages/newRedButtonHighlight.png", "sounds/saysSounds/red.mp3");
}

function buttonAnimation(){
    degrees += 360;
    rotateButtons("#greenButton", "#blueButton");
    rotateButtons("#blueButton", "#yellowButton");
    rotateButtons("#yellowButton", "#redButton");
    rotateButtons("#redButton", "#greenButton");
}

function rotateButtons(buttonOne, buttonTwo){
    
    //REFRESH DEGREE VALUE SOMEHOW SO IT DOESN'T GET TOO BIG
    console.log(degrees);
    
    $(buttonOne).animate({
        left: `${($(buttonTwo).position().left)+'px'}`,
        top: `${($(buttonTwo).position().top)+'px'}`,
        rotate: `${degrees+'deg'}`
    });
    
}

function generateRandomNumber(){
        cpuArray.push(Math.floor(Math.random() * 4));
}