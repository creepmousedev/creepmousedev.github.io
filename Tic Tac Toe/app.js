import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";

const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);

function Client(name, room){
    this.name = name;
    this.room = room;
}

var playerOneName = "";
var playerTwoName = "";
var currentRoom = "";
var arrayOfClients = [];

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile("index.html");
});

io.on('connection', (socket) => {

    if(playerOneName){
        arrayOfClients.forEach((player) => {
            if(playerOneName === player.name){
                console.log(`the player is: ${player.name}`);
                socket.join(player.room);
                
            }
        });
        console.log(arrayOfClients);
    }
    
    socket.on('enter name', (playerName) => {
        if(!playerOneName){
            playerOneName = playerName;

            //clientOne.name = playerName;
            //clientOne.room = socket.id;
            arrayOfClients.push(new Client(playerName, socket.id));
            //console.log(arrayOfClients);
        }
        else{

            arrayOfClients.forEach((player) => {
                if(playerOneName === player.name){
                    console.log(`the player is: ${player.name}`);
                    socket.join(player.room);
                    //clientTwo.name = playerName;
                    //clientTwo.room = player.room;
                    arrayOfClients.push(new Client(playerName, player.room));
                    //socket.to(player.room).emit('enter name', playerName); //WE CAN SEND P1 NAME HERE
                    io.in(player.room).emit('enter name', playerName, playerOneName, player.room);
                }
            });
            playerOneName = "";
            //console.log(`# of clients in room: ${currentRoom} is ${io.sockets.adapter.rooms.get(currentRoom).size}`);
        }

        console.log(arrayOfClients);
        //console.log(`this name is being sent: ${playerName}`);
        //socket.broadcast.emit('enter name', playerName);
        
    });

    socket.on('play', (player, room, movesArray, didWin) => {
        console.log(`current player: ${player} and did win? ${didWin}`);
        io.in(room).emit('whose turn', player);
        io.in(room).emit('play', room, movesArray, didWin);
        console.log(room + " " + movesArray + " was sent");
    });    
    
    socket.on('winner', (player, room, didWin) => {
        console.log('winner called?');
        io.in(room).emit('winner', player, didWin);
    });

    socket.on('disconnect', (reason) => {
        socket.broadcast.emit('left message');
        console.log(reason);
    });
});

server.listen(port, () => {
    console.log(`up and running on ${port}`);
});