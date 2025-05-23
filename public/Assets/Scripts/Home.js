let socket;
let currentRoom = null;
let previousMessageSender = null;

const cache = {
    UserId: -1,
    Users: {}
};

async function FetchUserInfo(userIds) {
    if (userIds.length == 0) {
        return [];
    }
    console.log(userIds)
    const userIdsString = userIds.join(',');
    const response = await fetch(`/api/userInfo/${userIdsString}`);
    
    if (!response.ok) {
        console.error('Error fetching user info');
        return [];
    }
    
    return response.json();
}

async function CreateDirectMessage(target) {
    const response = await fetch(`/api/CreateDirectMessage/${target}`);
    
    if (response.ok) {
        const data = await response.json();
        console.log(data);
        
        return data.Success;
    }
    
    return;
}

async function DisplayMessage(data) {
    if (!cache.Users[data.Sender]) {
        const info = await FetchUserInfo([data.Sender]);
        cache.Users[info[0].Id] = info[0];
    }

    const info = cache.Users[data.Sender];
    const messageContainer = document.getElementById('messageContainer');

    if (previousMessageSender !== info.Id) {
        previousMessageSender = info.Id;

        Instance(`
            <div>
                <div class="profile-img"><img src="Assets/Icons/${(info.Membership === "Golden" ? "Golden" : "Default")}.png" alt=""><p>${info.Display}</p></div>
                <p class="message-text">${data.Text}</p>
            </div>
        `, messageContainer);
    } else {
        Instance(`
            <div>
                <p class="message-text">${data.Text}</p>
            </div>
        `, messageContainer);
    }
}

socket.on('errorMessage', (message) => {
    alert(message);
});

socket.on('roomJoined', (data) => {
    currentRoom = data[0];
    //alert(data[1]);

    document.getElementById('messageInput').style.display = 'block';
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
        tempSet.add(history[i].Sender)
    }

    const userIds = Array.from(tempSet);
    const userInfos = await FetchUserInfo(userIds);
    
    for (let i = 0; i < userInfos; i++) {
        const info = userInfos[i];

        cache.Users[info.Id] = info;
    }

    for (let i = 0; i < history.length; i++) {
        const data = history[i];
        
        await DisplayMessage(data);
    }
});

function joinRoom(roomId) {
    currentRoom = null;
    previousMessageSender = null;

    document.getElementById('messageInput').style.display = 'none';
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

    if (message && message.trim() !== "") {
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

async function GetChatRooms(type) {
    try {
        const response = await fetch(`/api/getChats/${type}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch chat rooms');
        }
        
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
    }
}

async function fetchChatRooms(userId) {
    try {
        const response = await fetch(`/api/getChats/Group`, {
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

async function DisplayAccount(userId) {
    if (!cache.Users[userId]) {
        const info = await FetchUserInfo([userId]);
        cache.Users[info[0].Id] = info[0];
    }
    
    const data = cache.Users[userId];

    const display = document.getElementById("Display");
    const user = document.getElementById("Name");

    const profile = document.getElementById("Profile");

    display.textContent = data.Display;
    user.textContent = `@${data.Name}`;

    if (data.Membership === "Golden") {
        profile.src = "Assets/Icons/Golden.png";
    } else {
        profile.src = "Assets/Icons/Default.png";
    }
}

async function ShowGroupChats(userId) {
    console.log("Group chats!", userId);

    const groups = await GetChatRooms("Group");
    console.log("GROUPS:", groups);
}

async function ShowDirectMessages(userId) {
    console.log("Dms!", userId);
    
    const directs = await GetChatRooms("Direct");
    console.log("Direct Message:", directs);

    if (directs.length > 0) {
        const target = directs[0];
        
        joinRoom(target.Id);
    }
}

const homeTabs = [
    { Text: "Notifications", Icon: "email", Event: (userId) => { console.log("Notifications=!") } },
    { Text: "Group Chats", Icon: "email", Event: (userId) => ShowGroupChats(userId) },
    { Text: "Direct Messages", Icon: "email", Event: (userId) => ShowDirectMessages(userId) }
];

async function Setup() {
    const minLoadingTime = 500;
    const startTime = Date.now();
    
    const credResponse = await fetch('/api/getCredentials', {
        method: 'GET',
        credentials: 'same-origin',
    });
    const data = await credResponse.json();

    if(data.Success === true) {
        socket = io();
        cache.UserId = data.User;

        DisplayAccount(data.User);

        if (data.User === 2) {
            CreateDirectMessage("f");
        }

        const tabsContainer = document.getElementById("Tabs");
        const hovering = [];
        let previousTab = null;
        let currentTab = null;

        for (let i = 0; i < homeTabs.length; i++) {
            const tab = homeTabs[i];
            const button = tab.Button = Instance(`
                <button class="tab">
                    <img src="Assets/Icons/${tab.Icon}.png" alt="${tab.Text}">
                    <p>${tab.Text}</p>
                </button>
            `);
            
            button.addEventListener('click', () => {
                if (tab === currentTab) {
                    return;
                }

                if (currentTab) {
                    const targetButton = currentTab.Button;
                    targetButton.classList.remove("selected");
                    targetButton.style.zIndex = "2";

                    WaitForTransition(targetButton, "box-shadow", 200).then(() => {
                        targetButton.style.zIndex = "1";
                        button.style.zIndex = "2";
                    });
                    
                    previousTab = currentTab;
                }

                currentTab = tab;
                currentTab.Button.classList.add("selected");
                
                if (previousTab) {
                    button.style.zIndex = "4";
                } else {
                    button.style.zIndex = "2";
                }

                if (tab.Event) {
                    tab.Event(data.User);
                }
            });

            button.addEventListener("mouseenter", () => {
                if (button.classList.contains("selected")) {
                    return;
                }

                if (!hovering.includes(button)) {
                    hovering.push(button);
                }
                
                button.style.zIndex = "3";
            });

            button.addEventListener("mouseleave", async () => {
                if (button.classList.contains("selected")) {
                    return;
                }

                if (hovering.includes(button)) {
                    const index = hovering.indexOf(button);

                    if (index > -1) {
                        hovering.splice(index, 1);
                    }
                }
                
                await WaitForTransition(button, "box-shadow", 200);
                
                if (!button.classList.contains("selected")) {
                    if (!hovering.includes(button)) {
                        button.style.zIndex = "1";
                    }
                }
            });
            
            if (i === 0) {
                currentTab = tab;
                currentTab.Button.classList.add("selected");
                button.style.zIndex = "2";

                if (tab.Event) {
                    tab.Event(data.User);
                }
            }
            
            button.style.zIndex = "1";
            button.Parent = tabsContainer;
        }

        const messageInput = document.getElementById("messageInput");
        messageInput.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                sendMessage();
            }
        });
    }
    
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
    
    await new Promise(resolve => setTimeout(resolve, remainingTime));

    const loadingScreen = document.getElementById("loadingScreen");
    
    loadingScreen.style.opacity = "0";
    WaitForTransition(loadingScreen, "opacity", 500).then(() => {
        loadingScreen.classList.add("hidden");
    });
    
    ApplyTextWrap();
}

document.addEventListener('DOMContentLoaded', Setup);