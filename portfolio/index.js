import express from "express";
import bodyParser from "body-parser";
import dateFormatter, {masks} from "dateformat";
import methodOverrider from "method-override";
import axios from "axios";
import {createServer} from "http";
import {Server} from "socket.io";
import { dirname } from "path";
import { fileURLToPath } from "url";
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

let playerOneName = "";
let playerTwoName = "";
let currentRoom = "";
let arrayOfClients = [];
let connectedUsers = []; //ONLY HOLD THE USERNAME AND USE THIS TO CONFIRM THAT A USER ISN'T LOGGED IN TWICE
let roomNumber = 0;
let pathNameArray = [];
let afterSignIn = "";

function Client(name, room){
    this.name = name;
    this.room = room;
}

const weather = {
    temp: "",
    forecast: ""
}

const currentUser = {
    user: "",
    isAdmin: false,
    id: 0,
    pathNameArray: [], //DOES THIS GO IN THE CURRENT USER OBJECT?
    afterSignIn: "", //DOES THIS GO IN THE CURRENT USER OBJECT?
    sessionID: ""
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

app.use((req, res, next) => {

    let currentTime = dateFormatter(Date.now(), "shortTime");
    res.locals.currentTime = currentTime;

    next();
});

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

function arcadeGate(game, res){
    if(currentUser.user === ""){
        res.render("signIn.ejs", {articlesActive: "", aboutActive: "", arcadeActive: "active", projectActive: "",
                              temp: weather.temp,
                              forecast: weather.forecast});
    }
    else{
        res.sendFile(__dirname + `/public/${game}`);
    }
}

io.on('connection', async(socket) => {

    socket.emit('send session id', socket.id);
    console.log(socket.id);
    //USE CALLBACK FUNCTION HERE
    //DOES MAINJS ALREADY HAVE A SOCKET ID??
    //IF IT DOES HAVE, DOES THE ID MATCH WHAT WAS SENT OR NO REASON TO PUSH THAT CURRENTUSER INTO THE CONNECTEDUSERS ARRAY
    //IF NOT, ASSIGN THE ID ON MAIN TO THIS SOCKET.ID AND THEN ASSIGN IT TO THE CURRENTUSER.SESSIONID AND PUSH INTO THE CONNECTED ARRAY
    

    //NOT SURE IF THE BELOW IS USED OR NOT, BUT GOTTA CLEAN UP
    /*if(playerOneName){
        arrayOfClients.forEach((player) => {
            if(playerOneName === player.name){
                console.log(`the player is: ${player.name}`);
                socket.join(player.room);
                
            }
        });
        console.log(arrayOfClients);
        console.log(`current room: ${currentRoom}`);
    }*/

    
    
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

    //FUNCTIONS ABOVE ARE FOR TIC TAC TOE
    //FUNCTIONS BELOW ARE FOR POKEMON CARD
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

    //FUNCTIONS BELOW ARE FOR GETTING WEATHER AND TIME
    socket.on('send position', async(lat, lon) => {
        try {
            const response = await axios.get(`https://api.weather.gov/points/${lat},${lon}`);
            const result = response.data;
            console.log(result.properties.forecastHourly);
            try{
                const hourly = await axios.get(result.properties.forecastHourly);
    
                weather.temp = hourly.data.properties.periods[0].temperature;
                weather.forecast = hourly.data.properties.periods[0].shortForecast;
                
                io.in(socket.id).emit('send weather', weather.temp, weather.forecast);
            } catch (error) {
                console.log(error);
            }
        
        } catch (error) {
            console.error("Failed to make request:", error.message);
        }
    });

    socket.on('get time', () => {

        io.in(socket.id).emit('send time', (dateFormatter(Date.now(), "shortTime")));
    });
    
    socket.on('get best', async(gameMode) => {
        let bestTime;
        let data = await db.query(`SELECT * FROM game_scores WHERE ${currentUser.id} = player_id AND game_title = 'Match Game'`);
        if(data.rows.length === 1){
            gameMode === 'normal' ? bestTime = data.rows[0].best_match_time_normal : bestTime = data.rows[0].best_match_time_hard;
            bestTime === null ? bestTime = 0 : console.log('score ok');
            console.log(bestTime);
            bestTime = Number(bestTime);

            //GETTING MINUTES
            let minutes = Math.floor((bestTime/60000));
            console.log(`minutes: ${minutes}`);

            //GETTING SECONDS
            let seconds = Math.floor((bestTime - (minutes * 60000))/1000);
            console.log(`seconds: ${seconds}`);


            //GETTING MILLISECONDS
            let mill = (((bestTime - (minutes * 60000))/1000) - seconds).toPrecision(3);
            mill = mill.replace("0.", "");
            console.log(`milliseconds: ${mill}`);
            io.in(socket.id).emit('send best time', `${minutes}:${seconds}:${mill}`);
        }
        else{
            console.log('something went wrong');
        }
    });

    socket.on('matches found', async(bestTime, gameMode) => {
        let time = new Date(bestTime).getTime();
        try{
            let data = await db.query(`SELECT * FROM game_scores WHERE ${currentUser.id} = player_id AND game_title = 'Match Game'`);
            if(data.rows.length === 0){
                let score = gameMode === 'normal' ? 'best_match_time_normal' : 'best_match_time_hard';
                await db.query(`INSERT INTO game_scores (game_title, ${score}, player_id) VALUES ($1, $2, $3)`, ['Match Game', time, currentUser.id]);
            }
            else if(data.rows.length === 1){
                data.rows.forEach(async(row) => {
                    if(gameMode === 'normal'){
                        time < row.best_match_time_normal || row.best_match_time_normal === null ? await db.query(`UPDATE game_scores SET best_match_time_normal = $1 WHERE game_title = 'Match Game' AND player_id = ${currentUser.id}`, [time]) : console.log("didn't beat time");
                    }
                    else{
                        time < row.best_match_time_hard || row.best_match_time_hard === null ? await db.query(`UPDATE game_scores SET best_match_time_hard = $1 WHERE game_title = 'Match Game' AND player_id = ${currentUser.id}`, [time]) : console.log("didn't beat time");
                    }
                });
            }
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('get high score', async(gameMode) => {
        let highScore = 0;

        let data = await db.query(`SELECT * FROM game_scores WHERE ${currentUser.id} = player_id AND game_title = 'Adam Says...'`);
        if(data.rows.length === 1){
            gameMode === 'normalButton' ? highScore = data.rows[0].high_score_normal : highScore = data.rows[0].high_score_classic;
            highScore === null ? highScore = 1 : console.log('score ok');
            io.in(socket.id).emit('send high score', highScore);
        }
        else{
            console.log('something went wrong');
        }
    });

    socket.on('says score', async(highScore, gameModeClassic) => {
        //FIRST COMPARE THE CURRENT HIGH SCHOOL OR IF IT EXISTS TO THE HIGHSCORE THAT WAS JUST SENT
        try{
            let data = await db.query(`SELECT * FROM game_scores WHERE ${currentUser.id} = player_id AND game_title = 'Adam Says...'`);
            if(data.rows.length === 0){
                let score = gameModeClassic === false ? 'high_score_normal' : 'high_score_classic';
                await db.query(`INSERT INTO game_scores (game_title, ${score}, player_id) VALUES ($1, $2, $3)`, ['Adam Says...', highScore, currentUser.id]);
            }
            else if(data.rows.length === 1){
                data.rows.forEach(async(row) => {
                        if(gameModeClassic === false){
                            highScore > row.high_score_normal ? await db.query(`UPDATE game_scores SET high_score_normal = $1 WHERE game_title = 'Adam Says...' AND player_id = ${currentUser.id}`, [highScore]) : console.log("no high score");
                        }
                        else{
                            highScore > row.high_score_classic ? await db.query(`UPDATE game_scores SET high_score_classic = $1 WHERE game_title = 'Adam Says...' AND player_id = ${currentUser.id}`, [highScore]) : console.log("no high score");
                        }
                });
            }
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('toe result', () => {
        
    });

    socket.on('path name', (path, sessionID) => {
    
        socket.emit('save path', path, sessionID);
        

    });

    socket.on('save path', (path, sessionID) => {

        connectedUsers.forEach((user) => {
            if(user.sessionID === sessionID){
                if(path === '/signIn'){
                    user.afterSignIn = user.pathNameArray[user.pathNameArray.length-1].replace('/', '') + '.ejs';
                    console.log(afterSignIn);
                    user.afterSignIn === '.ejs' ? user.afterSignIn = 'arcade.ejs' : console.log('no change needed');
                }
                else{
                    user.pathNameArray.push(path);
                    console.log(user.pathNameArray);
                }
            }
        });
    });

});


app.get("/", async(req, res) => {

    /*res.render("blog.ejs", {currentUser: currentUser.user, articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "", 
                             temp: weather.temp,
                             forecast: weather.forecast,
                             currentTime: res.locals.currentTime});*/
    
    try{
        let data = await db.query('SELECT * FROM blog_posts JOIN users ON users.id = user_id');
        console.log(data.rows);
        res.render("blog.ejs", {articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "",
                                 temp: weather.temp,
                                 forecast: weather.forecast,
                                 posts: data.rows,
                                 currentUser: currentUser.user,
                                 isAdmin: currentUser.isAdmin});
    } catch (error) {
        console.log(error);
    }
    
});

app.get("/blog", async(req, res) => {

    try{
        let data = await db.query('SELECT * FROM blog_posts JOIN users ON users.id = user_id');
        console.log(data.rows);
        res.render("blog.ejs", {articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "",
                                 temp: weather.temp,
                                 forecast: weather.forecast,
                                 posts: data.rows,
                                 currentUser: currentUser.user,
                                 isAdmin: currentUser.isAdmin});
        } catch (error) {
            console.log(error);
    }

});

/*app.get("/articles/:id", (req, res) => {
    console.log("i was called");
    if(!articleArray[req.params.id]){
        console.log("file not found");
        res.render("index.ejs", {theArray: articleArray, articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "",
                                 temp: weather.temp,
                                 forecast: weather.forecast,
                                 currentUser: currentUser.user});
    }
    else{
        fs.readFile(`./views/txtFiles/${articleArray[req.params.id].title}.txt`, 'utf8', (err, data) => {
            if (err) throw err;
            console.log(data);
            res.render("postDisplay.ejs", {titleFromFile: articleArray[req.params.id].title, 
                                          messageFromFile: data,
                                          postNumber: req.params.id, 
                                          dateFromFile: articleArray[req.params.id].date,
                                          articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: ""});
        });
    }
});*/

app.post("/submit", async(req, res) => {

    if(!req.body.title || !req.body.message || req.body.choice === "Cancel"){
        res.render("blog.ejs", {theArray: articleArray, newPost: false, articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "",
                                currentUser: currentUser.user});
    }

    else{
        try {
            await db.query('INSERT INTO blog_posts (message, user_id, post_date, title) VALUES ($1, $2, $3, $4)', [req.body.message, currentUser.id, dateFormatter(Date.now(), 'fullDate'), req.body.title]);
            let data = await db.query('SELECT * FROM blog_posts JOIN users ON users.id = user_id');
            res.render("blog.ejs", {currentUser: currentUser.user, articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "",
                                     temp: weather.temp,
                                     forecast: weather.forecast,
                                     posts: data.rows});
            } catch (error) {
                console.log(error);
            }
    }
});

app.get("/about", (req, res) => {
    res.render("about.ejs", {currentUser: currentUser.user, articlesActive: "", aboutActive: "active", arcadeActive: "", projectActive: "",
                             temp: weather.temp,
                             forecast: weather.forecast});
});

app.get("/arcade", (req, res) => {
    res.render("arcade.ejs", {currentUser: currentUser.user, articlesActive: "", aboutActive: "", arcadeActive: "active", projectActive: "",
                               temp: weather.temp,
                               forecast: weather.forecast});
});

app.get("/projects", async(req, res) => {

    await getCardInfo();
    res.render("projects.ejs", {currentUser: currentUser.user, articlesActive: "", aboutActive: "", arcadeActive: "", projectActive: "active",
                                temp: weather.temp,
                                forecast: weather.forecast,
                                image: pokemonOfTheDay.image,
                                name: pokemonOfTheDay.name,
                                type: pokemonOfTheDay.type,
                                evolvesFrom: pokemonOfTheDay.evolvesFrom,
                                evolveImage: pokemonOfTheDay.evolvesFromImage,
                                color: pokemonOfTheDay.color});
});

app.get("/matchGame", (req, res) => {
    arcadeGate('match.html', res);
});

app.get("/says", (req, res) => {
    arcadeGate('says.html', res);
});

app.get("/tic-tac", (req, res) => {
    arcadeGate('ticTac.html', res);
});

app.get("/signIn", (req, res) => {
    
    res.render("signIn.ejs", {articlesActive: "", aboutActive: "", arcadeActive: "", projectActive: "",
                              temp: weather.temp,
                              forecast: weather.forecast});
});

app.get("/signOut", (req, res) => {
    currentUser.user = "";
    currentUser.isAdmin = false;

    res.render("index.ejs", {articlesActive: "", aboutActive: "", arcadeActive: "", projectActive: "",
    temp: weather.temp,
    forecast: weather.forecast,
    });
});

app.post("/signIn", async(req, res) => {
    let user = req.body.user.trim();
    
    try{
        let data = await db.query('SELECT * FROM users');
        data.rows.forEach((row) => {
            if(user === row.user_name){
                console.log(row.first_name + " found");
                const user = Object.create(currentUser);
                currentUser.user = row.user_name;
                currentUser.isAdmin = row.is_admin;
                currentUser.id = row.id;

                connectedUsers.push(user);
                console.log(connectedUsers);
                //IF STATEMENT HERE FOR IF ITS BLOG OR PROJECTS CAUSE WE NEED TO QUERY DB AND DISPLAY RIGHT STUFF
                res.render('signIn.ejs', {currentUser: currentUser.user, articlesActive: "", aboutActive: "", arcadeActive: "", projectActive: "",
                                         temp: weather.temp,
                                         forecast: weather.forecast,
                                         signedIn: true});
            }
            else{
                console.log("user not in database");
            }
        });
    } catch (error) {
        console.log(error);
    }
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
            try {
            await db.query('INSERT INTO users (user_name, first_name, is_admin) VALUES ($1, $2, $3)', [user, firstName, false]);
            currentUser.user = user;
            currentUser.isAdmin = false;
            res.render("index.ejs", {currentUser: currentUser.user, articlesActive: "", aboutActive: "", arcadeActive: "", projectActive: "",
                                     temp: weather.temp,
                                     forecast: weather.forecast});
            } catch (error) {
                console.log(error);
            }
        }
    });
});

app.post("/newPost", (req, res) => {
    console.log("you wanna new post do ya??");
    res.render("index.ejs", {theArray: articleArray, 
                             newPost: true,
                             articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "",
                             image: pokemonOfTheDay.image,
                             name: pokemonOfTheDay.name,
                             type: pokemonOfTheDay.type,
                             evolvesFrom: pokemonOfTheDay.evolvesFrom,
                             evolveImage: pokemonOfTheDay.evolvesFromImage,
                             color: pokemonOfTheDay.color});
});

/*app.delete("/articles/:id", (req, res) => {
    fs.rm(`./views/txtFiles/${articleArray[req.body.postNumber].title}.txt`, (err) => {
        if (err) throw err;
        articleArray.splice(articleArray.indexOf(articleArray[req.body.postNumber]), 1);
        res.render("index.ejs", {theArray: articleArray, articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: "",
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
                                           articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: ""});
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
                articlesActive: "active", aboutActive: "", arcadeActive: "", projectActive: ""});
        });
    }
});*/

server.listen(port, () => {console.log("server running on port " + port)});