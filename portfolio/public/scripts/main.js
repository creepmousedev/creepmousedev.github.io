const socket = io();
let degrees = 0;

navigator.geolocation.getCurrentPosition((position) => {
    if(position){
      console.log("got the stuff");
      document.getElementById("lat").value = position.coords.latitude;
      document.getElementById("lon").value = position.coords.longitude;
      document.forms["positionForm"].submit();
    }
});

document.getElementById("card").addEventListener("pointerdown", (event) => {
    console.log(event);
    degrees += 360;
    document.getElementById("card").style.transform = `rotateY(${degrees+'deg'})`;
    setTimeout(() => {
        
        socket.emit('newCard');
        
    }, 500);
});

socket.on('newCard', (image, name, type, evolveImage, evolvesFrom, color) => {
    document.getElementById("pokemonImage").setAttribute('src', `${image}`);
    document.getElementById("pokemonName").innerText = name;
    document.getElementById("pokemonType").innerText = `${type} type`;
    document.getElementById("pokemonOfTheDay").setAttribute('style', `background-color:${color}`);
    if(evolvesFrom === "Basic"){
        document.getElementById("evolveFrom").innerText = "Basic";
        document.getElementById("evolveFromImage").setAttribute('src', "");
        
    }
    else{
        document.getElementById("evolveFrom").innerText = `Evolves from ${evolvesFrom}`;
        document.getElementById("evolveFromImage").setAttribute('src', `${evolveImage}`);
        
    }
    
    
});