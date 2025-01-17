const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};
const clientsInRoom = {};

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (ws) => {
    let currentRoom = null;

    ws.on("message", (data) => {
        const message = JSON.parse(data);

        if (message.type === "join") {
            // First, make the user leave any current room
            if (currentRoom) {
                // Remove the client from the previous room
                const roomClients = clientsInRoom[currentRoom];
                if (roomClients) {
                    const index = roomClients.indexOf(ws);
                    if (index !== -1) {
                        roomClients.splice(index, 1);
                    }
                }
            }

            currentRoom = message.roomId;
            
            // Add the client to the room
            if (!clientsInRoom[currentRoom]) {
                clientsInRoom[currentRoom] = [];
            }
            clientsInRoom[currentRoom].push(ws);

            // If the room exists, send all previous messages
            if (rooms[currentRoom]) {
                rooms[currentRoom].forEach((msg) => {
                    ws.send(JSON.stringify(msg));  // Send previous messages
                });
            }
            // Send the room name to the client
            ws.send(JSON.stringify({ type: "room", roomId: currentRoom }));

        } else if (message.type === "message" && currentRoom) {
            // Save message to the room
            const newMessage = {
                user: message.user,
                text: message.text,
                timestamp: new Date().toISOString(),
            };

            if (!rooms[currentRoom]) {
                rooms[currentRoom] = [];
            }

            rooms[currentRoom].push(newMessage);

            // Send the message to all clients in the same room (including the sender)
            clientsInRoom[currentRoom].forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(newMessage));
                }
            });
        }
    });

    ws.on("close", () => {
        // Remove the client from the room when they disconnect
        for (const room in clientsInRoom) {
            const index = clientsInRoom[room].indexOf(ws);
            if (index !== -1) {
                clientsInRoom[room].splice(index, 1);
            }
        }
        console.log("Client disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://10.159.152.88:${PORT}/`);
});
