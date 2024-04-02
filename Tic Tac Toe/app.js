import express from "express";
import {createServer} from "http";
import { type } from "os";
import {Server} from "socket.io";

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);

function Client(name, room){
    this.name = name;
    this.room = room;
}

let socketInfo = {
    name: ""
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
        console.log(`current room: ${currentRoom}`);
    }
    
    socket.on('enter name', (playerName) => {
        if(!playerOneName){
            playerOneName = playerName;
            
            
            arrayOfClients.push(new Client(playerName, socket.id));
        }
        else{
            
            
            arrayOfClients.forEach((player) => {
                if(playerOneName === player.name){
                    console.log(`the player is: ${player.name}`);
                    socket.join(player.room);
                    arrayOfClients.push(new Client(playerName, player.room));
                    io.in(player.room).emit('enter name', playerName, playerOneName, player.room);
                }
            });
            playerOneName = "";
        }

        console.log(arrayOfClients);
        console.log(`current room: ${currentRoom}`);
        
    });

    socket.on('play', (player, room, movesArray, didWin) => {
        
        io.in(room).emit('whose turn', player);
        io.in(room).emit('play', room, movesArray, didWin);
        //console.log(room + " " + movesArray + " was sent");
        

    });    
    
    socket.on('winner', (player, room, didWin) => {
        console.log('winner called?');
        io.in(room).emit('winner', player, didWin);
    });

    socket.on('left message', () => {
        console.log("kick all out");
    });

    socket.on('disconnecting', () => {
        
        
        let rooms = socket.rooms;

        arrayOfClients.forEach((client) => {
            rooms.forEach((room) => {
                console.log(client);
                if(room === client.room){
                    io.in(room).emit('left message');
                    console.log(room);
                    console.log(client.room);
                    console.log(arrayOfClients.indexOf(client));
                    arrayOfClients.splice(arrayOfClients.indexOf(client), 1);
                    
                    //io.in(room).disconnectSockets(true);
                    //REMOVE ALL CLIENTS THAT HAVE THE ROOM
                    console.log("after splice");
                    console.log(arrayOfClients);
                    arrayOfClients.forEach((client) => {
                        if(client.room === room){
                            console.log(true);
                            arrayOfClients.splice(arrayOfClients.indexOf(client), 1);
                            io.in(room).socketsLeave(room);
                        }
                    });
                }
            });

        });
        //console.log(socket.rooms);
        console.log(arrayOfClients);
        
        

    });

    socket.on('disconnect', (reason) => {
        socket.emit('left message');
        
        
    });
});

server.listen(PORT, () => {
    console.log(`up and running on ${PORT}`);
});