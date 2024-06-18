
const socket = io();

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
        }
    });
}

function getTime(){
    let time = new Date(Date.now());
    document.getElementById("time").innerText = time.toLocaleTimeString('en-US');
    setTimeout(getTime, 1);
}

socket.on('send weather', (temp, forecast) => {
    document.getElementById("temperature").innerText = temp + '°F';
    document.getElementById("forecast").innerText = forecast;
});

socket.on('send session id', (id, callback) => {
    
    console.log("checking for cookie " + id);
    if(!document.cookie){
        document.cookie = `session_id=${id}`;
        console.log(document.cookie);
        callback('cookie created')
    }
    else{
        console.log('yum yum');
        console.log(document.cookie.split('=')[1]);
        callback(document.cookie.split('=')[1])
    }
    
});