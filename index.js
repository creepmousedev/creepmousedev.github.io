import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);

var playerOneName = "";
var playerTwoName = "";

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile("index.html");
});

io.on('connection', (socket) => {
    
    socket.on('enter name', (playerName) => {
        if(!playerOneName){
            playerOneName = playerName;
        }
        else{
            playerTwoName = playerName;
        }

        console.log(`this name is being sent: ${playerName}`);
        socket.broadcast.emit('enter name', playerName);
    });

    socket.on('play', (player, movesArray, didWin) => {
        console.log(`current player: ${player} and did win? ${didWin}`);
        if(!didWin){
            io.emit('whose turn', player);
            socket.broadcast.emit('play', movesArray);
        }
        else{
            console.log('winner called?');
            io.emit('winner', player);
        }
    });

});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`up and running on ${PORT}`);
});