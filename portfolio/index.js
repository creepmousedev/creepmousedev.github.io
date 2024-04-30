import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import dateFormatter, {masks} from "dateformat";
import methodOverrider from "method-override";
import axios from "axios";
import {createServer} from "http";
import {Server} from "socket.io";
//import { dirname } from "path";
//import { fileURLToPath } from "url";
import pg from "pg";
import env from "dotenv";

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
env.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: true
  });
  
db.connect();

var playerOneName = "";
var playerTwoName = "";
var currentRoom = "";
var arrayOfClients = [];
var currentUser = "";

function Client(name, room){
    this.name = name;
    this.room = room;
}

const weather = {
    temp: "",
    forecast: ""
}

const pokemonOfTheDay = {
    name: "",
    evolvesFrom: "",
    color: "",
    type: "",
    image: "",
    evolvesFromImage: ""
}

let articleArray = [];
let usedPokemon = [];

app.use(express.static("public"));
app.use(methodOverrider("_method"));
app.use(bodyParser.urlencoded({extended: true}));

/*app.param("id", (req, res, next, value) => {
    next();
});*/

async function getCardInfo(){
    try {
        const baseInfo = await axios.get(`https://pokeapi.co/api/v2/pokemon/${Math.floor(Math.random()*600)}`);
        pokemonOfTheDay.name = baseInfo.data.name;
        pokemonOfTheDay.type = baseInfo.data.types[0].type.name;
        pokemonOfTheDay.image = baseInfo.data.sprites.front_shiny;

        try{
            const speciesInfo = await axios.get(baseInfo.data.species.url);
            if(!speciesInfo.data.evolves_from_species){
                pokemonOfTheDay.evolvesFrom = "Basic";
            }
            else{
                pokemonOfTheDay.evolvesFrom = speciesInfo.data.evolves_from_species.name;
                pokemonOfTheDay.evolvesFromImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${speciesInfo.data.id}.png`;

                try{
                    const evolveInfo = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonOfTheDay.evolvesFrom}`);
                    pokemonOfTheDay.evolvesFromImage = evolveInfo.data.sprites.front_shiny;
                } catch (error) {
                    res.render("index.ejs", { content: JSON.stringify(error.response.data) });
                }
            }
        } catch (error) {
            res.render("index.ejs", { content: JSON.stringify(error.response.data) });
        }


        switch(baseInfo.data.types[0].type.name){
            case 'normal':
                pokemonOfTheDay.color = '#A8A77A';
                break;
            case 'fire':
                pokemonOfTheDay.color = '#EE8130';
                break;
            case 'water':
                pokemonOfTheDay.color = '#6390F0';
                break;
            case 'electric':
                pokemonOfTheDay.color = '#F7D02C';
                break;
            case 'grass':
                pokemonOfTheDay.color = '#7AC74C';
                break;
            case 'ice':
                pokemonOfTheDay.color = '#96D9D6';
                break;
            case 'fighting':
                pokemonOfTheDay.color = '#C22E28';
                break;
            case 'poison':
                pokemonOfTheDay.color = '#A33EA1';
                break;
            case 'ground':
                pokemonOfTheDay.color = '#E2BF65';
                break;
            case 'flying':
                pokemonOfTheDay.color = '#A98FF3';
                break;
            case 'psychic':
                pokemonOfTheDay.color = '#F95587';
                break;
            case 'bug':
                pokemonOfTheDay.color = '#A6B91A';
                break;
            case 'rock':
                pokemonOfTheDay.color = '#B6A136';
                break;
            case 'ghost':
                pokemonOfTheDay.color = '#735797';
                break;
            case 'dragon':
                pokemonOfTheDay.color = '#6F35FC';
                break;
            case 'dark':
                pokemonOfTheDay.color = '#705746';
                break;
            case 'steel':
                pokemonOfTheDay.color = '#B7B7CE';
                break;
            case 'fairy':
                pokemonOfTheDay.color = '#D685AD';
                break;
            default:
                pokemonOfTheDay.color = '#A8A77A';
        }
      } catch (error) {
        console.log(error.response.data);
        res.render("index.ejs", { content: error.response.data });
      }
}

io.on('connection', (socket) => {
    console.log("hello, I'm " + socket.id);

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

    socket.on('newCard', async() => {
        console.log("get and send new card info");

        await getCardInfo();
        let image = pokemonOfTheDay.image;
        let name = pokemonOfTheDay.name;
        let type = pokemonOfTheDay.type;
        let evolvesFrom = pokemonOfTheDay.evolvesFrom;
        let evolveImage = pokemonOfTheDay.evolvesFromImage;
        let color = pokemonOfTheDay.color;
        io.in(socket.id).emit('newCard', image, name, type, evolveImage, evolvesFrom, color);
    });
});

app.get("/", async (req, res) => {

    await getCardInfo();

    res.render("index.ejs", {currentUser: currentUser, articlesActive: "", aboutActive: "", contactActive: "", projectActive: "", 
                             temp: weather.temp,
                             forecast: weather.forecast});
    
});

app.post("/", async(req, res) => {

    try {
        const response = await axios.get(`https://api.weather.gov/points/${req.body.lat},${req.body.lon}`);
        const result = response.data;
        console.log(result.properties.forecastHourly);
        try{
            const hourly = await axios.get(result.properties.forecastHourly);

            weather.temp = hourly.data.properties.periods[0].temperature;
            weather.forecast = hourly.data.properties.periods[0].shortForecast;
    
            res.render("index.ejs", { currentUser: currentUser, articlesActive: "", aboutActive: "", contactActive: "", projectActive: "",
                                      temp: weather.temp,
                                      forecast: weather.forecast});
        } catch (error) {
            console.log(error);
        }
    
    } catch (error) {
        console.error("Failed to make request:", error.message);
    }
});

app.get("/articles", (req, res) => {

    res.render("index.ejs", {theArray: articleArray, articlesActive: "active", aboutActive: "", contactActive: "", projectActive: "",
                             temp: weather.temp,
                             forecast: weather.forecast});
});

app.get("/articles/:id", (req, res) => {
    console.log("i was called");
    if(!articleArray[req.params.id]){
        console.log("file not found");
        res.render("index.ejs", {theArray: articleArray, articlesActive: "active", aboutActive: "", contactActive: "", projectActive: "",
                                 temp: weather.temp,
                                 forecast: weather.forecast});
    }
    else{
        fs.readFile(`./views/txtFiles/${articleArray[req.params.id].title}.txt`, 'utf8', (err, data) => {
            if (err) throw err;
            console.log(data);
            res.render("postDisplay.ejs", {titleFromFile: articleArray[req.params.id].title, 
                                          messageFromFile: data,
                                          postNumber: req.params.id, 
                                          dateFromFile: articleArray[req.params.id].date,
                                          articlesActive: "active", aboutActive: "", contactActive: "", projectActive: ""});
        });
    }
});

app.get("/about", (req, res) => {
    res.render("about.ejs", {currentUser: currentUser, articlesActive: "", aboutActive: "active", contactActive: "", projectActive: "",
                             temp: weather.temp,
                             forecast: weather.forecast});
});

app.get("/contact", (req, res) => {
    res.render("contact.ejs", {currentUser: currentUser, articlesActive: "", aboutActive: "", contactActive: "active", projectActive: "",
                               temp: weather.temp,
                               forecast: weather.forecast});
});

app.get("/projects", (req, res) => {


    res.render("projects.ejs", {currentUser: currentUser, articlesActive: "", aboutActive: "", contactActive: "", projectActive: "active",
                                temp: weather.temp,
                                forecast: weather.forecast});
});

app.get("/matchGame", (req, res) => {
    res.sendFile("match.html");
});

app.get("/says", (req, res) => {
    res.sendFile("says.html");
});

app.get("/tic-tac", (req, res) => {
    res.sendFile("ticTac.html");
});

app.post("/submit", (req, res) => {

    if(!req.body.title || !req.body.message || req.body.choice === "Cancel"){
        res.render("index.ejs", {theArray: articleArray, newPost: false, articlesActive: "active", aboutActive: "", contactActive: "", projectActive: "",
                                 image: pokemonOfTheDay.image,
                                 name: pokemonOfTheDay.name,
                                 type: pokemonOfTheDay.type,
                                 evolvesFrom: pokemonOfTheDay.evolvesFrom,
                                 evolveImage: pokemonOfTheDay.evolvesFromImage,
                                 color: pokemonOfTheDay.color});
    }

    else{
        fs.writeFile(`./views/txtFiles/${req.body.title}.txt`, req.body.message, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
            
            const blogEntry = {
                title: req.body.title,
                message: req.body.message,
                date: dateFormatter(fs.statSync(`./views/txtFiles/${req.body.title}.txt`).birthtime, "fullDate")
            }

            articleArray.push(blogEntry);
            res.render("index.ejs", {theArray: articleArray, 
                                     newPost: false,
                                     articlesActive: "active", aboutActive: "", contactActive: "", projectActive: "",
                                     image: pokemonOfTheDay.image,
                                     name: pokemonOfTheDay.name,
                                     type: pokemonOfTheDay.type,
                                     evolvesFrom: pokemonOfTheDay.evolvesFrom,
                                     evolveImage: pokemonOfTheDay.evolvesFromImage,
                                     color: pokemonOfTheDay.color});

        });
    }
});

app.get("/signIn", (req, res) => {
    res.render("signIn.ejs", {articlesActive: "", aboutActive: "", contactActive: "", projectActive: "",
                              temp: weather.temp,
                              forecast: weather.forecast});
});

app.post("/signIn", async(req, res) => {
    let user = req.body.user.trim();
    let data = await db.query('SELECT * FROM users');
    data.rows.forEach((row) => {
        if(user === row.user_name){
            console.log(row.first_name + " found");
            currentUser = row.user_name;
            res.render("index.ejs", {currentUser: currentUser, articlesActive: "", aboutActive: "", contactActive: "", projectActive: "",
                                     temp: weather.temp,
                                     forecast: weather.forecast});
        }
        else{
            console.log("user not in database");
        }
    });
});

app.post("/createUser", async(req, res) => {
    let user = req.body.user.trim();
    let firstName = req.body.firstName.trim();
    let data = await db.query('SELECT * FROM users');
    data.rows.forEach(async(row) => {
        if(user === row.user_name){
            console.log("user already exists");
            
        }
        else{
            console.log("user not in database");
            await db.query('INSERT INTO users (user_name, first_name, is_admin) VALUES ($1, $2, $3)', [user, firstName, false]);
            currentUser = user;
            res.render("index.ejs", {currentUser: currentUser, articlesActive: "", aboutActive: "", contactActive: "", projectActive: "",
                                     temp: weather.temp,
                                     forecast: weather.forecast});
        }
    });
});

app.post("/newPost", (req, res) => {
    console.log("you wanna new post do ya??");
    res.render("index.ejs", {theArray: articleArray, 
                             newPost: true,
                             articlesActive: "active", aboutActive: "", contactActive: "", projectActive: "",
                             image: pokemonOfTheDay.image,
                             name: pokemonOfTheDay.name,
                             type: pokemonOfTheDay.type,
                             evolvesFrom: pokemonOfTheDay.evolvesFrom,
                             evolveImage: pokemonOfTheDay.evolvesFromImage,
                             color: pokemonOfTheDay.color});
});

app.delete("/articles/:id", (req, res) => {
    fs.rm(`./views/txtFiles/${articleArray[req.body.postNumber].title}.txt`, (err) => {
        if (err) throw err;
        articleArray.splice(articleArray.indexOf(articleArray[req.body.postNumber]), 1);
        res.render("index.ejs", {theArray: articleArray, articlesActive: "active", aboutActive: "", contactActive: "", projectActive: "",
                                 image: pokemonOfTheDay.image,
                                 name: pokemonOfTheDay.name,
                                 type: pokemonOfTheDay.type,
                                 evolvesFrom: pokemonOfTheDay.evolvesFrom,
                                 evolveImage: pokemonOfTheDay.evolvesFromImage,
                                 color: pokemonOfTheDay.color});
      });
});

app.put("/articles/:id", (req, res) => {

    if(req.body.editMessage === "true"){
        
        fs.readFile(`./views/txtFiles/${articleArray[req.body.postNumber].title}.txt`, 'utf8', (err, data) => {
            if (err) throw err;
            res.render("postDisplay.ejs", {titleFromFile: articleArray[req.body.postNumber].title, 
                                           messageFromFile: data,
                                           postNumber: req.body.postNumber,
                                           updateMessage: true, 
                                           dateFromFile: articleArray[req.body.postNumber].date,
                                           articlesActive: "active", aboutActive: "", contactActive: "", projectActive: ""});
        });

    }
    else if(req.body.editMessage === "false"){
        console.log("save message here");

        fs.writeFile(`./views/txtFiles/${articleArray[req.body.postNumber].title}.txt`, req.body.editArea, (err) => {
            if (err) throw err;
            console.log('The file has been updated!');
            res.render("postDisplay.ejs", {titleFromFile: articleArray[req.body.postNumber].title, 
                messageFromFile: req.body.editArea,
                postNumber: req.body.postNumber,
                updateMessage: false, 
                dateFromFile: articleArray[req.body.postNumber].date,
                articlesActive: "active", aboutActive: "", contactActive: "", projectActive: ""});
        });
    }
});

server.listen(port, () => {console.log("server running on port " + port)});