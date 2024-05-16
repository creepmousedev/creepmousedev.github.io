
let degrees = 0;

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
        document.getElementById("evolveFromImage").style.display = 'none';
    }
    else{
        document.getElementById("evolveFrom").innerText = `Evolves from ${evolvesFrom}`;
        document.getElementById("evolveFromImage").style.display = 'block';
        document.getElementById("evolveFromImage").setAttribute('src', `${evolveImage}`);
    }
});