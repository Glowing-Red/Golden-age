/**
    Golden-age (by Glowing-Red) -[Server]:
        Social media platform with accounts and group/direct messages, that are stored in a database
        
        Variables:
            IPv4 -Localhost's Ip

        Functions:
            a

        Routes:
            app.get('/api/CreateDirectMessage/:target', (request, response)
                -Processes GET requests to the /CreateDirectMessages route.
                @param {Object} request -Request object
                    @param {Object} request.cookies -Cookies object, containing the "auth_token" for user authentication
                    @param {string} request.params.target -Username used to find the target account to create a direct-message with
                @param {Object} response -Response object used to send the result back to the client
                @returns {Object} -JSON response indicating success or failure, with a relevant message
                    Success:
                        -If both users exist and there is no existing direct message room, a new chat room is created and returned.
                    Failure:
                        -If authentication fails (missing or invalid token), an Unauthorized message is returned.
                        -If the target user is not found, an error message is returned.
                        -If the direct message room already exists, a warning is returned.
                        -If the sender and target users are the same, a retarded error message is returned.
            
            app.get('/register', (_, response)
                -Handles GET requests to the /register route
                @param {Object} _ -[Unused] Request object
                @param {Object} response -Response object used to send the HTML file
                @returns {Document} -Sends an HTML file (./public/register.html) as the response to the client
            
            app.get('/login', (_, response)
                -Handles GET requests to the /login route
                @param {Object} _ -[Unused] Request object
                @param {Object} response -Response object used to send the HTML file
                @returns {Document} -Sends an HTML file (./public/login.html) as the response to the client
            
            app.get('/api/getCredentials', (request, response)
                -Handles GET requests to the /getCredentials route
                @param {Object} request -Request object
                    @param {Object} req.cookies -Cookies object, containing the "auth_token" for user authentication
                @param {Object} response -Response object used to send the result back to the client
                @returns {Object} -JSON response indicating success or failure, with a relevant message
                    Success:
                        -If the token is valid, the userId of the session is returned
                    Failure:
                        -If no token is provided, or if the token is invalid, an Unauthorized error message is returned
            
            app.get('/api/getChats/:type', (request, response)
                -Handles GET requests to the /getChats route
                @param {Object} request -Request object
                    @param {Object} request.cookies -Cookies object, containing the "auth_token" for user authentication
                    @param {string} request.params.type -The type of chats to retrieve ("direct" or "group")
                @param {Object} response -Response object used to send the result back to the client
                @returns {Array} -JSON response containing the user's chat rooms of the  specified type
                    Success:
                        -If the token is valid, an array of chat rooms is returned
                    Failure:
                        -If no token is provided, or if the token is invalid, an Unauthorized error message is returned
            
            app.get('/api/userInfo/:userIds', (request, response)
                -Handles GET requests to the /userInfo route
                @param {Object} request -Request object
                    @param {string} request.params.userIds -Comma separated list of user IDs (e.g. "1,2,3").
                @param {Object} response -Response object used to send the result back to the client
                @returns {Array} -JSON response containing an array of the users account details.
                    @param {number} Id -Account UserId
                    @param {string} Name : -Account Username
                    @param {string} Display : -Account Display name
                    @param {string} Membership : -Account membership tier (null or "Golden")
                    Success:
                        -If atleast 1 account of the listed account IDs are found
                    Failure:
                        -If no users are found with the provided IDs
            
            app.get('/home', (request, response)
                -Handles GET requests to the /home route
                @param {Object} request -Request object
                    @param {Object} request.cookies -Cookies object, containing the "auth_token" for user authentication
                @param {Object} response -Response object used to send the HTML file
                @returns {Document} -Sends the ./public/home.html to authenticated users
                    Success:
                        -If the token is valid, the ./public/home.html file is served
                    Failure:
                        -If no token is provided, or if the token is invalid, the user is redirected to "/login"
            
            app.post('/login', (_, response)
                -Processes POST requests to the /login route
                @param {Object} _ -[Unused] Request object
                @param {Object} response -Response object used to send the HTML file
                @returns {Document} -Sends an HTML file (./public/login.html) as the response to the client
            
            app.post('/logout', (_, response)
                -Processes POST requests to the /logout route
                @param {Object} _ -[Unused] Request object
                @param {Object} response -Response object used to send the HTML file
                @returns {Document} -Sends an HTML file (./public/login.html) as the response to the client
*/
//#region logic
//#region vars
const IPv4 = "10.159.152.122";

const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const { parse } = require('cookie');
const path = require("path");
const { MongoClient } = require('mongodb');
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

const SECRET_KEY = "Rosalith's Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

let db;

const lockedIdsSet = new Set();
const lockedSessionsMap = new Map();

async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db("GoldenAge");
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

const templateAccounts = [
    { _id: 1, Date: new Date().toISOString(), Username: "f", Display: "Owner", Password: "f" },
    { _id: 2, Date: new Date().toISOString(), Username: "a", Display: "Admin", Password: "a", Membership: "Golden" }
];

const templateRooms = [
    { _id: "Golden", Type: "Group", Nickname: "Golden Hangout", Members: [1, 2], Messages: [] },
    { _id: "Peasantry", Type: "Group", Nickname: "Peasant Gathering", Messages: [] },
];
//#endregion

async function saveTemplates() {
    await SaveAccountsTemplate(templateAccounts);
    await db.collection("Sessions");
    await SaveRoomsTemplate(templateRooms);
}

async function SaveAccountsTemplate(params) {
    const collection = db.collection("Accounts");

    for (let i = 0; i < params.length; i++) {
        const targetUser = params[i];
        const existingUser = await collection.findOne({ _id: targetUser._id });

        if (!existingUser) {
            targetUser.Password = await bcrypt.hash(targetUser.Password, 10);

            await collection.insertOne(targetUser);

            console.log("New user added:", targetUser);
        } else {
            console.log("User already exists:", existingUser._id);
        }
    }

    console.log("Users saved successfully!");
}

async function SaveRoomsTemplate(params) {
    const collection = db.collection("Rooms");

    for (let i = 0; i < params.length; i++) {
        const targetRoom = params[i];
        const existingRoom = await collection.findOne({ _id: targetRoom._id });

        if (!existingRoom) {
            await collection.insertOne(targetRoom);

            console.log("New user added:", targetRoom);
        } else {
            console.log("User already exists:", existingRoom._id);
        }
    }

    console.log("Chat rooms saved successfully!");
}

// Run the save and load operations
connectToDatabase().then(async () => {
    await saveTemplates();
}).catch(err => {
    console.error(err);
});

function generateToken(userId) {
    const randomString = Math.random().toString(36).substring(2, 14);
    
    return jwt.sign({ Token: `session_${userId}_${Date.now()}_${randomString}` }, SECRET_KEY);
}

async function GetCredentials(cookie) {
    if (!cookie) {
        return { Success: false, UserId: null };
    }
    
    const collection = db.collection("Sessions");
    const data = await collection.findOne({ Token: cookie });

    if (data) {
        return { Success: true, UserId: data._id };
    }
    
    return { Success: false, UserId: null };
}

async function GetAccount() {

}

const GenerateDirectId = (user1, user2) => {
    return "direct-" + [user1, user2].sort((a, b) => a - b).join("-");
};

async function GetChats(userId, type) {
    const collection = db.collection("Rooms");
    const rooms = await collection.find({ Type: type, Members: userId }).toArray();
    
    return rooms;
}

async function GenerateUserId() {
    const collection = db.collection("Accounts");
    const count = await collection.countDocuments();

    let newId = (1 + count);
    let isTaken = true;

    while (isTaken) {
        if (lockedIdsSet.has(newId) || await collection.findOne({ _id: newId })) {
            newId++;
        } else {
            isTaken = false;
        }
    }

    lockedIdsSet.add(newId);

    setTimeout(() => {
        lockedIdsSet.delete(newId);
    }, (5 * 60000));

    return newId;
}
//#endregion

//#region test2
// Route to create a direct chat with another account
app.get('/api/CreateDirectMessage/:target', async (req, res) => {
    const cookie = req.cookies.auth_token;

    if (!cookie) {
        return res.json({ Success: false, Message: "Unauthorized" });
    }

    const credentials = await GetCredentials(cookie);
    if (credentials.Success != true) {
        return res.json({ Success: false, Message: "Unauthorized" });
    }

    const userId = credentials.UserId;
    const targetName = req.params.target;

    const accountsCollection = db.collection("Accounts");
    const roomsCollection = db.collection("Rooms");

    const sender = await accountsCollection.findOne({ _id: userId });
    const target = await accountsCollection.findOne({ Username: targetName });
    
    if (sender.Username == targetName) {
        return res.json({ Success: false, Message: "I refuse to believe that you are THAT lonely." });
    }

    if (!target) {
        return res.json({ Success: false, Message: "Target account was not found." });
    }

    const chatId = GenerateDirectId(sender._id, target._id);
    const chatExists = await roomsCollection.findOne({ _id: chatId });

    if (chatExists) {
        return res.json({ Success: true, Message: "Direct messages already exists!" });
    }
    
    const newRoom = {
        _id: chatId,
        Type: "Direct",
        Members: [userId, target._id],
        Messages: []
    };

    await roomsCollection.insertOne(newRoom);

    return res.json({ Success: true, Message: "Direct messages created!" });
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get('/login', (req, res) => {
    return res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve the chat page (must be logged in to access)
app.get('/home', async (req, res) => {
    const credentials = await GetCredentials(req.cookies.auth_token);

    if (credentials.Success != true) {
        return res.redirect('/login');
    }
    
    return res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get('/api/getCredentials', async (req, res) => {
    const cookie = req.cookies.auth_token;

    if (!cookie) {
        return res.json({ Success: false, Message: "Unauthorized" });
    }

    const credentials = await GetCredentials(cookie);
    if (credentials.Success == true) {
        return res.json({ Success: true, User: credentials.UserId });
    }
    
    return res.json({ Success: false, Message: "Unauthorized" });
});

app.get('/api/getChats/:type', async (req, res) => {
    const cookie = req.cookies.auth_token;

    if (!cookie) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const credentials = await GetCredentials(cookie);
    if (credentials.Success != true) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const type = req.params.type;
    const chatRooms = await GetChats(credentials.UserId, type);

    return res.json(chatRooms);
});

// Route to get user info for multiple user IDs
app.get('/api/userInfo/:userIds', async (req, res) => {
    const userIds = req.params.userIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const collection = db.collection("Accounts");

    const users = await collection.find({ _id: { $in: userIds } }).toArray();
    const accountInfos = users.filter(user => userIds.includes(user._id)).map(user => ({
        Id: user._id,
        Name: user.Username,
        Display: user.Display,
        Membership: user.Membership ? user.Membership : null
    }));

    if (accountInfos.length === 0) {
        return res.status(404).json({ message: 'No accounts found' });
    }

    res.json(accountInfos);
});
//#endregion

// Route for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const collection = db.collection("Accounts");
    const user = await collection.findOne({ Username: username });

    if (!user) {
        return res.status(401).json({ message: 'Account with username not found' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (lockedSessionsMap.has(user._id)) {
        res.cookie('auth_token', lockedSessionsMap.get(user._id), { httpOnly: true, secure: false });

        return res.json({ Message: 'Logged in successfully' });
    }
    
    const sesssionsCollection = db.collection("Sessions");
    const sessionExists = await sesssionsCollection.findOne({ _id: user._id });

    if (sessionExists) {
        res.cookie('auth_token', sessionExists.Token, { httpOnly: true, secure: false });
    
        return res.json({ Message: 'Logged in successfully' });
    }
    
    const token = generateToken(user._id);
    const newSession = {
        _id: user._id,
        Token: token
    };

    lockedSessionsMap.set(user._id, token);
    setTimeout(() => {
        lockedSessionsMap.delete(user._id);
    }, (1 * 60000));

    sesssionsCollection.insertOne(newSession);
    
    res.cookie('auth_token', token, { httpOnly: true, secure: false });

    return res.json({ Message: 'Logged in successfully' });
});

// Route for user registration (sign up)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const existingUser = await collection.findOne({ Username: username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const newId = await GenerateUserId();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            _id: newId,
            Username: username,
            Password: hashedPassword,
            Display: username,
            Membership: null
        };

        // Insert into database
        await collection.insertOne(newUser);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// WebSocket authentication middleware
io.use(async (socket, next) => {
    const cookies = parse(socket.request.headers.cookie || '');
    const cookie = cookies.auth_token;

    if (!cookie) {
        return next(new Error('Unauthorized'));
    }

    const credentials = await GetCredentials(cookie);
    if (credentials.Success != true) {
        return next(new Error('Unauthorized'));
    }
    
    // Attach user info based on sessionId (from session storage)
    socket.userId = credentials.UserId;
    next();
});

class ConnectionHandler {
    constructor(io, socket, db) {
        this.Io = io;
        this.Socket = socket;
        this.UserId = socket.userId;
        this.DataBase = db;
        this.CurrentRoom = null;
    
        this.Init();
    }

    Init() {
        const { Socket } = this;

        Socket.on('joinRoom', this.JoinRoom.bind(this));
        Socket.on('sendMessage', this.SendMessage.bind(this));
        Socket.on('disconnect', this.Disconnect.bind(this));
    }

    JoinRoom(roomId) {
        const { Socket, UserId, DataBase } = this;

        if (this.CurrentRoom) {
            Socket.leave(this.CurrentRoom);
            console.log(`User (Id:${UserId}) left room: ${this.CurrentRoom}`);
        }
        
        const collection = DataBase.collection("Rooms");
        const room = collection.findOne({ _id: roomId });

        if (!room) {
            Socket.emit("errorMessage", 'Room not found');

            return;
        }

        // Check if the user is a member of the room
        if (room.Members && !room.Members.includes(UserId)) {
            Socket.emit("errorMessage", 'You are not a member of this room');

            return;
        }

        this.CurrentRoom = roomId;
        Socket.join(roomId);
        Socket.emit('roomJoined', [room._id, `You have joined ${room.Nickname}`]);

        // Send chat history to the user
        Socket.emit('chatHistory', room.Messages);

        console.log(`User ${UserId} joined room: ${room.Nickname}`);

        return;
    }

    async SendMessage(roomId, message) {
        const { Socket, UserId, Io, DataBase } = this;
        
        const collection = DataBase.collection("Rooms");
        const room = collection.findOne({ _id: roomId });

        if (!room) {
            Socket.emit("errorMessage", 'Room not found');

            return;
        }

        // Ensure user is part of the room
        if (room.Members && !room.Members.includes(UserId)) {
            Socket.emit("errorMessage", 'You are not a member of this room');

            return;
        }

        // Ensure message is not empty
        if (message.trim() === "") {
            Socket.emit("errorMessage", "The message you tried to send is an empty string.");

            return;
        }

        // Create a message object with the userId, message, and timestamp
        const newMessage = {
            Sender: socket.userId,
            Text: message,
            Date: new Date().toISOString(), // Store time as ISO string
        };
        
        // Store the message in the room's history
        await collection.updateOne(
            { _id: room._id },
            { $push: { Messages: newMessage } }
        );

        // Broadcast the message to the room
        Io.to(roomId).emit('receiveMessage', newMessage);
        console.log(`${UserId} (${roomId}) sent messagee: ${newMessage}`);

        return;
    }

    Disconnect() {
        const { UserId } = this;

        console.log(`User (Id:${UserId}) disconnected`);
    }
}

// WebSocket connections and handling chat rooms
io.on('connection', (socket) => {
    console.log(`User connected with ID: ${socket.userId}`);

    new ConnectionHandler(io, socket, db);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on ${IPv4}:${PORT}/home`);
});