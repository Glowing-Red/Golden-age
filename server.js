const IPv4 = "10.159.152.85";

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

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB URI if using MongoDB Atlas
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db("GoldenAge"); // Database name
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

var accounts = [];
var sessions = {};
var rooms = [];

const templateAccounts = [
    { _id: 1, Date: new Date().toISOString(), Username: "f", Display: "Owner", Password: "f" },
    { _id: 2, Date: new Date().toISOString(), Username: "a", Display: "Admin", Password: "a", Membership: "Golden" }
];

const templateRooms = [
    { _id: "Golden", Type: "Group", Nickname: "Golden Hangout", Members: [1, 2], Messages: [] },
    { _id: "Peasantry", Type: "Group", Nickname: "Peasant Gathering", Messages: [] },
];

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

async function loadData() {
    accounts = await loadAccounts();
    sessions = await loadSessions();
    rooms = await loadChatRooms();
    
    console.log("Loaded Users:", accounts);
    console.log("Loaded Sessions:", sessions);
    console.log("Loaded Chat Rooms:", rooms);
}

async function loadAccounts() {
    const usersCollection = db.collection("Accounts");
    return await usersCollection.find().toArray();
}

async function loadSessions() {
    const sessionsCollection = db.collection("Sessions");
    const sessionsDocs = await sessionsCollection.find().toArray();
    const sessions = {};

    sessionsDocs.forEach(doc => {
        sessions[doc._id] = doc;
    });

    return sessions;
}

async function loadChatRooms() {
    const chatRoomsCollection = db.collection("Rooms");
    return await chatRoomsCollection.find().toArray();
}

// Run the save and load operations
connectToDatabase().then(async () => {
    await saveTemplates();
    await loadData();
}).catch(err => {
    console.error(err);
});

function generateToken(sessionId) {
    return jwt.sign({ sessionId }, SECRET_KEY, { expiresIn: '1h' });
}

const CreateDirectId = (user1, user2) => {
    return "direct-" + [user1, user2].sort((a, b) => a - b).join("-");
};

function GetChats(userId, type) {
    return rooms.filter(room => {
        if (room.Type !== type) {
            return false;
        }
        
        if (room.Members) {
            return room.Members.includes(userId);
        }
        
        return true;
    }).map(room => ({
        Id: room._id,
        Type: room.Type,
        Nickname: room.Nickname,
        Members: room.Members
    }));
}

// Route to create a direct chat with another account
app.get('/api/CreateDirectMessage/:target', (req, res) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.json({ Success: false, Message: "Unauthorized" });
    }
    
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err || !sessions[decoded.sessionId]) {
            return res.json({ Success: false, Message: "Unauthorized" });
        }
        
        const userId = sessions[decoded.sessionId];
        const targetName = req.params.target;

        const sender = accounts.find(acc => acc._id === userId);
        const target = accounts.find(acc => acc.Username === targetName);
        console.log("Sender: ", userId, "found: ", sender)
        if (sender.Username == targetName) {
            return res.json({ Success: false, Message: "I refuse to believe that you are THAT lonely." });
        }

        if (!target) {
            return res.json({ Success: false, Message: "Target account was not found." });
        }
        
        const chatId = CreateDirectId(sender._id, target._id);

        const chatExists = rooms.some(room => room._id === chatId);
        if (chatExists) {
            return res.json({ Success: true, Message: "Direct messages already exists!" });
        }
        
        const roomsCollection = db.collection("Rooms");
        const newRoom = { _id: chatId, Type: "Direct", Members: [userId, target._id], Messages: [] };

        await roomsCollection.insertOne(newRoom);
        rooms.push(newRoom);

        return res.json({ Success: true, Message: "Direct messages created!" });
    });
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get('/api/getCredentials', (req, res) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.json({ Success: false, Message: "Unauthorized" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !sessions[decoded.sessionId]) {
            return res.json({ Success: false, Message: "Unauthorized" });
        }
        
        return res.json({ Success: true, User: sessions[decoded.sessionId] });
    });
});

app.get('/api/getChats/:type', (req, res) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !sessions[decoded.sessionId]) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const type = req.params.type;
        const userId = sessions[decoded.sessionId];

        res.json(GetChats(userId, type));
    });
});

// Route to get user info for multiple user IDs
app.get('/api/userInfo/:userIds', (req, res) => {
    const userIds = req.params.userIds.split(',').map(id => parseInt(id, 10));
    const accountInfos = accounts.filter(user => userIds.includes(user._id)).map(user => ({
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

// Serve the chat page (must be logged in to access)
app.get('/home', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !sessions[decoded.sessionId]) {
            return res.redirect('/login');
        }
        
        res.sendFile(path.join(__dirname, "public", "home.html"));
    });
});

// Route for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = accounts.find(u => u.Username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const sessionId = `session_${user._id}_${Date.now()}`;
    sessions[sessionId] = user._id;

    const token = generateToken(sessionId);
    res.cookie('auth_token', token, { httpOnly: true, secure: false });
    
    return res.json({ Message: 'Logged in successfully' });
});

// Route for user registration (sign up)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists
    const existingUser = accounts.find(u => u.Username === username);
    if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and store it
    const newUser = {
        _id: accounts.length + 1, // Simple user ID generator
        Username: username,
        Display: username,
        Password: hashedPassword, // Store the hashed password
    };

    accounts.push(newUser);

    res.status(201).json({ message: 'User registered successfully' });
});

// WebSocket authentication middleware
io.use((socket, next) => {
    const cookies = parse(socket.request.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return next(new Error('Unauthorized'));
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !sessions[decoded.sessionId]) {
            return next(new Error('Unauthorized'));
        }

        // Attach user info based on sessionId (from session storage)
        socket.userId = sessions[decoded.sessionId];
        next();
    });
});

// WebSocket connections and handling chat rooms
io.on('connection', (socket) => {
    console.log(`User connected with ID: ${socket.userId}`);

    let currentRoom = null;

    // Join chat room based on room ID passed from the client
    socket.on('joinRoom', (roomId) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            console.log(`User ${socket.userId} left room: ${currentRoom}`);
        }

        const room = rooms.find(room => room._id === roomId);
        console.log("Rooms:", rooms);
        console.log("Room found:", room);
        
        if (!room) {
            socket.emit("errorMessage", 'Room not found');
            return;
        }

        // Check if the user is a member of the room
        if (room.Members && !room.Members.includes(socket.userId)) {
            socket.emit("errorMessage", 'You are not a member of this room');
            return;
        }
        
        socket.join(roomId);
        currentRoom = roomId;
        socket.emit('roomJoined', [room._id, `You have joined ${room.Nickname}`]);
        
        // Send chat history to the user
        socket.emit('chatHistory', room.Messages);

        console.log(`User ${socket.userId} joined room: ${room.Nickname}`);
    });

    // Handle sending a message to a room
    socket.on('sendMessage', async (roomId, message) => {
        const room = rooms.find(room => room._id === roomId);

        if (!room) {
            socket.emit("errorMessage", 'Room not found');
            return;
        }

        // Ensure user is part of the room
        if (room.Members && !room.Members.includes(socket.userId)) {
            socket.emit("errorMessage", 'You are not a member of this room');
            return;
        }

        // Ensure message is not empty
        if (message.trim() === "") {
            socket.emit("errorMessage", "The message you tried to send is an empty string.");

            return;
        }

        const roomsCollection = db.collection("Rooms");

        // Create a message object with the userId, message, and timestamp
        const newMessage = {
            Sender: socket.userId,
            Text: message,
            Date: new Date().toISOString(), // Store time as ISO string
        };

        // Store the message in the room's history
        await roomsCollection.updateOne(
            { _id: room._id },
            { $push: { Messages: newMessage } }
        );
        room.Messages.push(newMessage);

        // Broadcast the message to the room
        io.to(roomId).emit('receiveMessage', newMessage);
        console.log(`${socket.userId} (${roomId}) sent messagee: ${newMessage}`);
    });

    // Disconnect event
    socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on ${IPv4}:${PORT}/home`);
});