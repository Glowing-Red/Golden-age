const IPv4 = "10.159.152.84";

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
            if (currentRoom) {
                const roomClients = clientsInRoom[currentRoom];

                if (roomClients) {
                    const index = roomClients.indexOf(ws);
                    if (index !== -1) {
                        roomClients.splice(index, 1);
                    }
                }
            }

            currentRoom = message.roomId;

            if (!clientsInRoom[currentRoom]) {
                clientsInRoom[currentRoom] = [];
            }
            clientsInRoom[currentRoom].push(ws);

            if (rooms[currentRoom]) {
                rooms[currentRoom].forEach((msg) => {
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
    });

    ws.on("close", () => {
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
    console.log(`Server running on ${IPv4}:${PORT}/`);
});
