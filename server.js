const IPv4 = "10.159.152.65";

const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const { parse } = require('cookie');
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

const SECRET_KEY = "Rosalith's Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.";

const users = [
    { Id: 1, Username: "f", Display: "Owner", Password: "f", Membership: "Golden" },
    { Id: 2, Username: "a", Display: "Admin", Password: "a", Membership: "Golden" }
];

const sessions = {};

const chatRooms = [
    { Id: "Golden", Type: "Group", Nickname: "Golden Hangout", Members: [1, 2], Messages: [] },
    { Id: "Peasantry", Type: "Group", Nickname: "Peasant Gathering", Messages: [] },
];

async function ProtectTheGolden() {
    for (let i = 0; i < users.length; i++) {
        const j = users[i];

        if (j.Membership === "Golden") {
            j.Password = await bcrypt.hash(j.Password, 10);
        }
    }
}

function generateToken(sessionId) {
    return jwt.sign({ sessionId }, SECRET_KEY, { expiresIn: '1h' });
}

const CreateDirectId = (user1, user2) => {
    return "direct-" + [user1, user2].sort((a, b) => a - b).join("-");
};

// Route to create a direct chat with another account
app.get('/api/CreateDM/:userId', (req, res) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.json({ Success: false, Message: "Unauthorized" });
    }
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !sessions[decoded.sessionId]) {
            return res.json({ Success: false, Message: "Unauthorized" });
        }
        
        const userId = sessions[decoded.sessionId];
        const targetId = parseInt(req.params.userId, 10);

        if (userId == targetId) {
            return res.json({ Success: false, Message: "I refuse to believe that you are THAT lonely." });
        }
        
        const targetExists = users.some(acc => acc.Id === targetId);
        if (!targetExists) {
            return res.json({ Success: false, Message: "Target account was not found." });
        }
        
        const chatId = CreateDirectId(userId, targetId);

        const chatExists = chatRooms.some(room => room.Id === chatId);
        if (chatExists) {
            return res.json({ Success: true, Message: "DM Already exists!" });
        }

        chatRooms.push({ Id: chatId, Type: "Direct", Members: [userId, targetId], Messages: [] });
        return res.json({ Success: true, Message: "Dms created!" });
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

app.get('/api/getChats', (req, res) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !sessions[decoded.sessionId]) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const userId = sessions[decoded.sessionId];
        
        const userRooms = chatRooms.filter(room => {
            if (room.Members) {
                return room.Members.includes(userId);
            }
            
            return true;
        }).map(room => ({
            Id: room.Id,
            Type: room.Type,
            Nickname: room.Nickname,
            Members: room.Members
        }));
        
        res.json(userRooms);
    });
});

// Route to get user info for multiple user IDs
app.get('/api/userInfo/:userIds', (req, res) => {
    const userIds = req.params.userIds.split(',').map(id => parseInt(id, 10));
    const usersInfo = users.filter(user => userIds.includes(user.Id)).map(user => ({
        Id: user.Id,
        Name: user.Username,
        Display: user.Display,
        Membership: user.Membership ? user.Membership : null
    }));
    
    if (usersInfo.length === 0) {
        return res.status(404).json({ message: 'No users found' });
    }
    
    res.json(usersInfo);
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

    const user = users.find(u => u.Username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const sessionId = `session_${user.Id}_${Date.now()}`;
    sessions[sessionId] = user.Id;

    const token = generateToken(sessionId);
    res.cookie('auth_token', token, { httpOnly: true, secure: false });
    
    return res.json({ Message: 'Logged in successfully' });
});

// Route for user registration (sign up)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists
    const existingUser = users.find(u => u.Username === username);
    if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and store it
    const newUser = {
        Id: users.length + 1, // Simple user ID generator
        Username: username,
        Display: username,
        Password: hashedPassword, // Store the hashed password
    };

    users.push(newUser);

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

        const room = chatRooms.find(room => room.Id === roomId);
        
        if (!room) {
            socket.emit('errorMessage', 'Room not found');
            return;
        }

        // Check if the user is a member of the room
        if (room.Members && !room.Members.includes(socket.userId)) {
            socket.emit('errorMessage', 'You are not a member of this room');
            return;
        }
        
        socket.join(roomId);
        currentRoom = roomId;
        socket.emit('roomJoined', [room.Id, `You have joined ${room.Nickname}`]);
        
        // Send chat history to the user
        socket.emit('chatHistory', room.Messages);

        console.log(`User ${socket.userId} joined room: ${room.Nickname}`);
    });

    // Handle sending a message to a room
    socket.on('sendMessage', (roomId, message) => {
        const room = chatRooms.find(room => room.Id === roomId);

        if (!room) {
            socket.emit('errorMessage', 'Room not found');
            return;
        }

        // Ensure user is part of the room
        if (room.members && !room.Members.includes(socket.userId)) {
            socket.emit('errorMessage', 'You are not a member of this room');
            return;
        }

        // Create a message object with the userId, message, and timestamp
        const newMessage = {
            userId: socket.userId,
            message: message,
            timestamp: new Date().toISOString(), // Store time as ISO string
        };

        // Store the message in the room's history
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

ProtectTheGolden();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on ${IPv4}:${PORT}/`);
});