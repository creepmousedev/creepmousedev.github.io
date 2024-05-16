const socket = io();

let sessionID = "";

console.log(window);
console.log("new window");
socket.emit('path name', window.location.pathname, sessionID);

for(let x = 0; x < 4; x++){
    document.getElementsByClassName("nav-item")[x].addEventListener("mouseover", () => {
        document.getElementsByClassName("nav-item")[x].classList.remove("zoomOff");
        document.getElementsByClassName("nav-item")[x].classList.add("zoom");
    });
}

for(let x = 0; x < 4; x++){
    document.getElementsByClassName("nav-item")[x].addEventListener("mouseleave", () => {
        document.getElementsByClassName("nav-item")[x].classList.remove("zoom");
        document.getElementsByClassName("nav-item")[x].classList.add("zoomOff");
    });
}

weather();
getTime();

function weather(){
    navigator.geolocation.getCurrentPosition((position) => {
        if(position){
        socket.emit('send position', position.coords.latitude, position.coords.longitude);
        setTimeout(weather, 1800000);
        }
    });
}

function getTime(){
    socket.emit('get time');
    setTimeout(getTime, 1000);
}

socket.on('send weather', (temp, forecast) => {
    document.getElementById("temperature").innerText = temp + '°F';
    document.getElementById("forecast").innerText = forecast;
});

socket.on('send time', time => {
    document.getElementById("time").innerText = time;
});

socket.on('send session id', (id) => {
    
    if(sessionID === ""){
        sessionID = id;
        console.log("hello");
        
    }
    else{
        console.log("session already assigned");
        
    }

    console.log(sessionID);
});