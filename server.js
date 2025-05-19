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

const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');
const { parse } = require('cookie');
const path = require("path");
const { MongoClient } = require('mongodb');
const fs = require("fs");

const server = http.createServer(app);
const io = socketIo(server);

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fabian.youtubbe@gmail.com',
        pass: 'gkjs zcqn mana gxap'
    }
});

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

const IPv4 = "10.159.152.79";
const PORT = process.env.PORT || 3000;
const local = false;
const domain = `http://${(local == true ? "localhost" : IPv4)}:${PORT}`;

const SECRET_KEY = "Rosalith's Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

let db;

const lockedIdsSet = new Set();
const lockedTokensSet = new Set();
const emailCooldownSet = new Set();

const lockedUsernamesMap = new Map();
const confirmAccountMap = new Map();

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

function GenerateSessionToken(userId) {
    const firstRandomString = Math.random().toString(36).slice(2);
    const secondRandomString = Math.random().toString(36).slice(2);
    const thirdRandomString = Math.random().toString(36).slice(2);
    
    return jwt.sign({ Token: `session_${firstRandomString}${userId}${secondRandomString}${Date.now()}${thirdRandomString}` }, SECRET_KEY);
}

async function RemoveAllSessionTokens(userId) {
    const collection = db.collection("Sessions");
    
    try {
        const result = await collection.deleteMany({ UserId: userId });
        
        console.log(`Deleted ${result.deletedCount} session(s) for userId ${userId}`);
    } catch (err) {
        console.error("Failed to expire sessions:", err);
    }
}

async function GetCredentials(cookie) {
    console.log("Cookie:", cookie);

    if (!cookie) {
        return { Success: false, UserId: null };
    }
    
    const collection = db.collection("Sessions");
    const data = await collection.findOne({ _id: cookie });

    if (data) {
        return { Success: true, UserId: data.UserId };
    }
    
    return { Success: false, UserId: null };
}

const GenerateDirectId = (user1, user2) => {
    return "direct-" + [user1, user2].sort((a, b) => a - b).join("-");
};

async function GetChats(userId, type) {
    const collection = db.collection("Rooms");
    const rooms = await collection.find({ Type: type, Members: userId }).toArray();
    
    return rooms.map(room => ({ Id: room._id }));;
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

// Mail Functions
async function GenerateUniqueToken(length = 32, ignoreLocked = false) {
    let token;
    let exists = true;
    
    do {
        token = crypto.randomBytes(length).toString("hex");

        if (ignoreLocked != true && lockedTokensSet.has(token)) {
            continue;
        }

        exists = false;
    } while (exists);

    return token;
}

function IsValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
}

class TimeoutManager {
    #Timeouts = new Map();

    constructor() { }

    #Remove(id) {
        if (this.#Timeouts.has(id)) {
            this.#Timeouts.delete(id);
        }
    }

    #GenerateId(length = 64) {
        let id;

        do {
            id = crypto.randomBytes(length).toString("hex");
        } while (this.#Timeouts.has(id));

        return id;
    }

    Create(callback, delay) {
        const id = this.#GenerateId();

        const wrapper = () => {
            callback();

            this.#Remove(id);
        };

        const timeoutId = setTimeout(wrapper, delay);
        this.#Timeouts.set(id, { TimeoutId: timeoutId, Callback: callback });

        return id;
    }

    Activate(id) {
        if (this.#Timeouts.has(id)) {
            this.#Timeouts.get(id).Callback();

            clearTimeout(this.#Timeouts.get(id).TimeoutId);
            this.#Remove(id);

            return true;
        }
        
        return false;
    }

    ActivateAll() {
        for (const id of this.#Timeouts.keys()) {
            this.Activate(id);
        }
    }

    Cancel(id) {
        if (this.#Timeouts.has(id)) {
            clearTimeout(this.#Timeouts.get(id).TimeoutId);
            this.#Remove(id);

            return true;
        }

        return false;
    }

    CancelAll() {
        for (const id of this.#Timeouts.keys()) {
            this.Cancel(id);
        }
    }
}

async function SendEmail(body, maxAttempts = 1, delay = 5000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const info = await transporter.sendMail(body);
            
            return { Success: true, Response: info };
        } catch (error) {
            if (attempt < maxAttempts) {
                await new Promise(res => setTimeout(res, delay));
            } else {
                return { Success: false, Response: error };
            }
        }
    }
}

async function sendPasswordResetEmail(toEmail, userName, resetToken) {
    const resetUrl = `https://discord.com/invite/PrenvUW6`;

    const mailOptions = {
        from: '"Golden-age" <fabian.youtubbe@gmail.com>',
        to: toEmail,
        subject: 'Password Reset',
        html: `
<table border="0" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background-color:#ffffff;border-radius:16px" width="100%" role="presentation">
    <tbody><tr>
        <td align="center" valign="top">

            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>

            
            <table cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="background-color:#000000;width:600px;min-width:600px" role="presentation">
                <tbody><tr>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                    <td style="width:456px" width="456">

                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="72"></td>
                            </tr>
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td>
                                  <a href="https://www.rockstargames.com/" style="text-decoration:none" target="_blank"><img src="https://cdn.discordapp.com/attachments/711636453452415019/1373399352948555916/1747514319533.png?ex=682a4552&is=6828f3d2&hm=1a50357fc6db789c2ad036ab42218a04c5c1c40621855d8a2ba6455781a5eea1&" height="85" width="85" border="0" style="display:block;color:#f0f0f0;font-size:24px;font-family:'HelveticaW1G',Helvetica,Arial,sans-serif" alt="Kindred Logo" class="CToWUd" data-bit="iit"></a>
                                </td>
                            </tr>           
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="36"></td>
                            </tr>
                        </tbody></table>
                        
                        

                        


<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="370" style="max-width:370px">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
                <strong>Password Reset</strong>
            </span>
        </td>
    </tr>           
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">A request was just made to reset the password for your Golden-age account <span style="
    font-weight: bold;
">${userName}</span><span>.</span><br><span> If this was you, please click the following link before it expires: </span><a href="${resetUrl}" target="_blank"><span style="text-decoration:underline;color:#ffffff">Reset Password</span></a></span>
        </td>
    </tr>           
</tbody></table>




<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
    
                        
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<hr style="border-width:0;background:#a6a6a6;color:#a6a6a6;height:2px">
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6"><span style="
    font-weight: bold;
">This administrative message was sent to you by Kindred to help manage and protect your account.</span><br>You're receiving this email because an action related to your account was requested, the link will be expired in 15 minutes. If you did not initiate this request, you can safely ignore this message.<br>Kindred is committed to providing a safe, welcoming space where you can stay connected, share stories, and enjoy meaningful moments online.<br>
                <br>
                © ${new Date().getFullYear()} <span>Kindred</span>. All Rights Reserved.
                <br>
                <br>
                <a href="https://www.rockstargames.com/legal" target="_blank""><span style="color:#a6a6a6;text-decoration:underline">Terms of Service</span></a>
                <br>
                <a href="https://www.rockstargames.com/privacy" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Privacy Policy</span></a>
                <br>
                <a href="https://support.rockstargames.com/" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Support</span></a>
            </span>
        </td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="24"></td>
    </tr>
</tbody></table>

 
                        

            
            
            
                    </td>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                </tr>
            </tbody></table>
            
            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>
        </td>
    </tr>
</tbody></table>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Reset email sent:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

async function RegisterAccount(email, username, password) {
    if (!IsValidEmail(email)) {
        return false;
    }

    if (emailCooldownSet.has(email)) {
        return false;
    }

    const timeouts = new TimeoutManager();

    emailCooldownSet.add(email);
    timeouts.Create(() => {
        emailCooldownSet.delete(email);
    }, (1 * 60 * 1000));

    const confirmToken = await GenerateUniqueToken();
    lockedTokensSet.add(confirmToken);
    confirmAccountMap.set(confirmToken, {
        Username: username,
        Email: email,
        Password: await bcrypt.hash(password, 10)
    });

    const deleteId = timeouts.Create(() => {
        const mapData = confirmAccountMap.get(confirmToken);

        if (mapData && mapData.Locked == true) {
            lockedUsernamesMap.delete(mapData.Username);
        }

        confirmAccountMap.delete(confirmToken);
        lockedTokensSet.delete(confirmToken);
    }, (60 * 60 * 1000));

    const confirmationUrl = `${domain}/registration-confirmation?Token=${confirmToken}`;
    const emailBody = {
        from: '"Golden-age" <fabian.youtubbe@gmail.com>',
        to: email,
        subject: 'Account Registration Confirmation',
        html: `
<table border="0" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background-color:#ffffff;border-radius:16px" width="100%" role="presentation">
    <tbody><tr>
        <td align="center" valign="top">

            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>

            
            <table cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="background-color:#000000;width:600px;min-width:600px" role="presentation">
                <tbody><tr>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                    <td style="width:456px" width="456">

                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="72"></td>
                            </tr>
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td>
                                  <a href="https://www.rockstargames.com/" style="text-decoration:none" target="_blank"><img src="https://i.ibb.co/DfXFhrZ1/Amber-Leaf.png" height="85" width="85" border="0" style="display:block;color:#f0f0f0;font-size:24px;font-family:'HelveticaW1G',Helvetica,Arial,sans-serif" alt="Kindred Logo" class="CToWUd" data-bit="iit"></a>
                                </td>
                            </tr>           
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="36"></td>
                            </tr>
                        </tbody></table>
                        
                        

                        


<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="370" style="max-width:370px">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
                <strong>Account Registration</strong>
            </span>
        </td>
    </tr>           
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">A request was just made to create a Golden-age account named "<span style="
    font-weight: bold;
">${username}</span>"<span> under your e-mail.</span><br><span> If this was you, please click the following link to continue the account registration: </span><a href="${confirmationUrl}" target="_blank"><span style="text-decoration:underline;color:#ffffff">Continue Registration</span></a></span>
        </td>
    </tr>           
</tbody></table>




<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
    
                        
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<hr style="border-width:0;background:#a6a6a6;color:#a6a6a6;height:2px">
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6"><span style="
    font-weight: bold;
">This administrative message was sent to you by Kindred to confirm and continue the registration of your Golden-age account.</span><br>You're receiving this email because an account registration under your e-mail was requested, the link will become invalid in 60 minutes and the account creation will be cancelled. If you did not request this registration, you can safely ignore this message.<br>Kindred is committed to providing a safe, welcoming space where you can stay connected, share stories, and enjoy meaningful moments online.<br>
                <br>
                © ${new Date().getFullYear()} <span>Kindred</span>. All Rights Reserved.
                <br>
                <br>
                <a href="https://www.rockstargames.com/legal" target="_blank""><span style="color:#a6a6a6;text-decoration:underline">Terms of Service</span></a>
                <br>
                <a href="https://www.rockstargames.com/privacy" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Privacy Policy</span></a>
                <br>
                <a href="https://support.rockstargames.com/" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Support</span></a>
            </span>
        </td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="24"></td>
    </tr>
</tbody></table>

 
                        

            
            
            
                    </td>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                </tr>
            </tbody></table>
            
            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>
        </td>
    </tr>
</tbody></table>
        `
    };

    const result = await SendEmail(emailBody, 5, 10000);
    if (result.Success == true) {
        console.log("Email Sent", result.Response.messageId);

        return true;
    }
    else {
        timeouts.Activate(deleteId);
        
        console.log("Error sending email", result.Response);
    }

    return false;
}

(async () => {
  const result = await RegisterAccount("fraizor.youtubbe@gmail.com", "4KHax", "123K");
  console.log("RegisterAccount result:", result);
})();

// Serve the continue registration page (must be logged in to access)
app.get('/registration-confirmation', async (req, res) => {
    const token = req.query.Token;

    function ErrorResponse(mssg) {
        fs.readFile(path.join(__dirname, "public", "Links", "Account", "err.html"), 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Error reading template.');
            }
            
            let html = data.replace('{{ERROR_MESSAGE}}', mssg);
            return res.send(html);
        });
    }

    if (!token) {
        return ErrorResponse("No Token");
    }

    if (!confirmAccountMap.has(token)) {
        return ErrorResponse(`No account tied to \"${token}\" Token`);
    }

    const data = confirmAccountMap.get(token);
    if (lockedUsernamesMap.has(data.Username) && lockedUsernamesMap.get(data.Username) != data.Email) {
        return ErrorResponse(`Username not available`);
    }

    lockedUsernamesMap.set(data.Username, data.Email);
    data.Locked = true;
    
    fs.readFile(path.join(__dirname, "public", "Links", "Account", "confirm.html"), 'utf8', (err, document) => {
        if (err) {
            return res.status(500).send('Error reading template.');
        }
        
        let html = document.replace('{{USERNAME}}', data.Username)
            .replace('{{MESSAGE}}', `Your email is: \""${data.Email}\", and your hashed password is: \"${data.Password}\"`, );

        return res.send(html);
    });
});
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
    
    const sesssionsCollection = db.collection("Sessions");
    const token = GenerateSessionToken(user._id);
    const newSession = {
        _id: token,
        UserId: user._id
    };

    sesssionsCollection.insertOne(newSession);
    res.cookie('auth_token', token, { httpOnly: true, secure: false });

    return res.json({ Message: 'Logged in successfully' });
});

// Route for user registration (sign up)
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    
    try {
        const resetUrl = `${domain}/confirm-creation?token=${resetToken}`;
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
            Date: new Date().toISOString(), // Store time as ISO string
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

// WebSocket connections and handling chat rooms
io.on('connection', (socket) => {
    console.log(`User connected with Id:${socket.userId}`);

    new ConnectionHandler(io, socket, db);
});

server.listen(PORT, () => {
    console.log(`Server running on ${domain}/home`);
});