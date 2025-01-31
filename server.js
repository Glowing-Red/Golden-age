const IPv4 = "10.159.152.96";

const express = require("express");
const session = require("express-session");
const sessionStore = new session.MemoryStore();
const cookieParser = require('cookie-parser');
const { getSession } = require('express-session');
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const { Console } = require("console");

const app = express();
const db = new sqlite3.Database("Rosalith's.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(session({
    secret: "Rosalith's Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: false, secure: false }
}));

db.run(`CREATE TABLE IF NOT EXISTS users (Id INTEGER PRIMARY KEY, Username TEXT UNIQUE, Password TEXT)`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const chatRooms = {
    5: { Id: 5, Members: [1, 2] },
}

const clientConnections = {};

app.get("/Login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Login.html"));
});

app.get("/Home", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Home.html"));
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    console.log(`Register attempt: ${username}, ${password}`);

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send("Error hashing password");
        }

        db.run("INSERT INTO users (Username, Password) VALUES (?, ?)", [username, hash], (err) => {
            if (err) {
                return res.status(400).send("Username already taken");
            }
            
            res.redirect("/login");
        });
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    console.log(`Login attempt: ${username}, ${password}`);

    db.get("SELECT * FROM users WHERE Username = ?", [username], (err, User) => {
        if (!User) {
            return res.status(401).send("Invalid username or password");
        }

        bcrypt.compare(password, User.Password, (err, result) => {
            if (result) {
                req.session.userId = User.Id;
                
                console.log("Session data after login:", req.session);

                return res.redirect("/login");
            } else {
                return res.status(401).send("Invalid username or password");
            }
        });
        
    });
});

app.get("/validate", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ loggedIn: false, message: "Not logged in" });
    }
    
    db.get("SELECT Id, username FROM users WHERE Id = ?", [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ loggedIn: false, message: "User not found" });
        }

        res.json({ loggedIn: true, UserId: user.Id, Username: user.Username });
    });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "public", "error.html"));
});

wss.on("connection", (ws, req) => {
    let currentRoom = null;
    console.log("New Session!");
    
    const sessionId = req.cookies['connect.sid'];
    console.log("Session:", sessionId);

    if (!sessionId) {
        console.log('Session ID provided: ', sessionId);
    } else {
        console.log('No session ID provided');
        ws.close();

        return;
    }

    ws.on("message", (data) => {
        
    });

    /*ws.on("message", (data) => {
        const userId = req.session.userId;

        if (!userId) {
            ws.send(JSON.stringify({ type: "error", message: "You must be logged in to join a room" }));

            return;
        }

        const message = JSON.parse(data);

        if (message.type === "join") {
            if (currentRoom) {
                const roomClients = clientConnections[currentRoom];
                
                if (roomClients) {
                    const index = roomClients.indexOf(ws);

                    if (index !== -1) {
                        roomClients.splice(index, 1);
                    }
                }
            }

            if (chatRooms[message.roomId] && chatRooms[message.roomId].Members.includes(userId)) {
                currentRoom = message.roomId;
            } else {
                currentRoom = null;

                return;
            }

            if (!clientConnections[currentRoom]) {
                clientConnections[currentRoom] = [];
            }
            
            clientConnections[currentRoom].push(ws);

            if (chatRooms[currentRoom]) {
                chatRooms[currentRoom].forEach((msg) => {
                    ws.send(JSON.stringify(msg));
                });
            }
            
            ws.send(JSON.stringify({ type: "room", roomId: currentRoom }));
        } else if (message.type === "message" && currentRoom) {
            const newMessage = {
                user: message.user,
                text: message.text,
                timestamp: new Date().toISOString(),
            };

            if (!rooms[currentRoom]) {
                rooms[currentRoom] = [];
            }

            rooms[currentRoom].push(newMessage);
            clientsInRoom[currentRoom].forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(newMessage));
                }
            });
        }
    });*/

    ws.on("close", () => {
        if (currentRoom) {
            const roomClients = clientConnections[currentRoom];
            
            if (roomClients) {
                const index = roomClients.indexOf(ws);

                if (index !== -1) {
                    roomClients.splice(index, 1);
                }
            }
        }
        
        console.log("Client disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on ${IPv4}:${PORT}/`);
});
