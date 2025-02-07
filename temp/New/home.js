const socket = io();
let currentRoom = null;

const cache = {
    Users: {}
};

function Instance(html) {
    const placeholder = document.createElement("template");
	placeholder.innerHTML = html.trim();
    
    return placeholder.content.firstChild;
}

async function FetchUserInfo(userIds) {
    if (userIds.length == 0) {
        return [];
    }

    const userIdsString = userIds.join(',');
    const response = await fetch(`/api/userInfo/${userIdsString}`);
    
    if (!response.ok) {
        console.error('Error fetching user info');
        return [];
    }
    
    return response.json();
}

async function CreateDm(targetId) {
    const response = await fetch(`/api/CreateDM/${targetId}`);
    
    if (response.ok) {
        const data = await response.json();
        console.log(data);

        return data.Success;
    }
    
    return;
}

async function DisplayMessage(data) {
    if (!cache.Users[data.userId]) {
        const info = await FetchUserInfo([data.userId]);
        cache.Users[info[0].Id] = info[0];
    }

    const info = cache.Users[data.userId];
    
    const messageContainer = document.getElementById('messageContainer');

    const messageDiv = Instance(`
        <div>
            <div class="profile-img"><img src="${(info.Membership === "Golden" ? "Golden.png" : "Default.png")}" alt=""><p>${info.Display}</p></div>
            <p class="message-text">${data.message}</p>
        </div>
    `);

    messageContainer.appendChild(messageDiv);
}

socket.on('errorMessage', (message) => {
    alert(message);
});

socket.on('roomJoined', (data) => {
    currentRoom = data[0];
    alert(data[1]);

    document.getElementById('chatInput').style.display = 'block';
});

socket.on('receiveMessage', async (data) => {
    console.log("receivem esssage", data);
    
    DisplayMessage(data);
});

socket.on('chatHistory', async (history) => {
    console.log("receivem chatHistory", history);
    
    cache.Users = {};

    const tempSet = new Set();
    for (let i = 0; i < history.length; i++) {
        tempSet.add(history[i].userId)
    }

    const userIds = Array.from(tempSet);
    const userInfos = await FetchUserInfo(userIds);
    
    for (let i = 0; i < userInfos; i++) {
        const info = userInfos[i];

        cache.Users[info.Id] = info;
    }

    for (let i = 0; i < history.length; i++) {
        const data = history[i];

        DisplayMessage(data);
    }
});

function joinRoom(roomId) {
    currentRoom = null;

    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = "";

    socket.emit('joinRoom', roomId);
}

function sendMessage() {
    if (!currentRoom) {
        return;
    }

    const roomId = currentRoom;
    const message = document.getElementById('messageInput').value;

    if (message) {
        socket.emit('sendMessage', roomId, message);
        document.getElementById('messageInput').value = '';
    }
}

async function SetupGroupRoom(data) {
    const chatControls = document.getElementById('roomControls');

    const roomBtn = document.createElement('button');
    roomBtn.textContent = `Join ${data.Nickname}`;
    roomBtn.onclick = () => joinRoom(data.Id);

    chatControls.appendChild(roomBtn);
}

async function SetupDirectRoom(data, userId) {
    const chatControls = document.getElementById('dmControls');
    const targetId = data.Members.find(num => num !== userId);

    if (!cache.Users[targetId]) {
        const info = await FetchUserInfo([targetId]);

        cache.Users[info[0].Id] = info[0];
    }

    const info = cache.Users[targetId];

    const roomBtn = document.createElement('button');
    roomBtn.textContent = `Dm ${info.Display}`;
    roomBtn.onclick = () => joinRoom(data.Id);

    chatControls.appendChild(roomBtn);
}

async function fetchChatRooms(userId) {
    try {
        const response = await fetch('/api/getChats', {
            method: 'GET',
            credentials: 'same-origin',
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch chat rooms');
        }
        
        const data = await response.json();
        console.log(data);

        for (let i = 0; i < data.length; i++) {
            const roomData = data[i];
            
            if (roomData.Type === "Group") {
                SetupGroupRoom(roomData);
            } else if (roomData.Type === "Direct") {
                SetupDirectRoom(roomData, userId);
            }
        }
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        document.getElementById('chatList').innerHTML = '<p>Error fetching chat rooms. Please try again later.</p>';
    }
}

async function Loaded() {
    const credResponse = await fetch('/api/getCredentials', {
        method: 'GET',
        credentials: 'same-origin',
    });
    const data = await credResponse.json();

    if(data.Success === true) {
        fetchChatRooms(data.User);
    }
}

document.addEventListener('DOMContentLoaded', Loaded);