const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

const ConnectionHandler = class {
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

    async JoinRoom(roomId) {
        const { Socket, UserId, DataBase } = this;

        if (this.CurrentRoom) {
            Socket.leave(this.CurrentRoom);
            console.log(`User (Id:${UserId}) left room: ${this.CurrentRoom}`);
        }

        const collection = DataBase.collection("Rooms");
        const room = await collection.findOne({ _id: roomId });

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

        console.log(`User ${UserId} joined room: ${room.Nickname} (${room})`);

        return;
    }

    async SendMessage(roomId, message) {
        const { Socket, UserId, Io, DataBase } = this;

        const collection = DataBase.collection("Rooms");
        const room = await collection.findOne({ _id: roomId });

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
            Sender: Socket.userId,
            Text: message,
            Date: new Date(), // Store time as ISO string
        };

        // Store the message in the room's history
        console.log("update: ", room._id);
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

ReBlock.CreateBlock(ReBlock.GenerateName(), class {
    #Block = undefined;

    #Level = 10;
    #Order = 1;
    
    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    Init() {
        const { IO, Database } = Vars;

        IO.on('connection', (socket) => {
            console.log(`User connected with Id:${socket.userId}`);

            new ConnectionHandler(IO, socket, Database);
        });
    }
});