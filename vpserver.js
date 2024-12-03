//PAL Server
const VERSION = '0.1.0';
//December 2, 2024
//catielovexo@gmail.com

console.log(`Welcome to Virtual Places Server ${VERSION}`);
console.log('');

const path = require('path');
const fs = require('fs');
const net = require('net');
const { buffer } = require('stream/consumers');
const http = require('http');
const dbPath = path.join(process.cwd(), 'database.json'); 

// Initialize or load the database
let db = { users: [] };

if (fs.existsSync(dbPath)) {
    try {
        const rawData = fs.readFileSync(dbPath, 'utf8');
        db = JSON.parse(rawData);
        console.log(`${now_at()} Database loaded successfully.`);
    } catch (err) {
        console.error(`${now_at()} Error reading database:`, err.message);
    }
} else {
    console.log(`${now_at()} Database file not found. Creating a new one.`);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

// Function to save the database to file
function saveDatabase() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
        console.error(`${now_at()} Error saving database:`, err.message);
    }
}

// Function to register a user
function registerUser(username, password) {
    if (db.users.find((user) => user.username === username)) {
        console.error(`${now_at()} User ${username} already exists.`);
        return false;
    }

    const newUser = {
        id: db.users.length > 0 ? db.users[db.users.length - 1].id + 1 : 1,
        username,
        password,
    };

    db.users.push(newUser);
    saveDatabase();
    console.log(`${now_at()} User ${username} registered successfully.`);
    return true;
}

function registerRoom(URL, roomNumber, roomType) {
    
    return true;
}


// Function to validate a user
function validateUser(username, password) {
    const user = db.users.find((user) => user.username === username);

    if (!user) {
        console.log(`${now_at()} User ${username} not found. Registering.`);
        registerUser(username, password);
        return true;
    }

    if (user.password !== password) {
        console.error(`${now_at()} Password mismatch for user ${username}.`);
        return false;
    }

    console.log(`${now_at()} User ${username} validated successfully.`);
    return true;
}

const users = [];
const rooms = [];

const serverStartTime = Date.now();

// HTTP API Gateway
const httpServer = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/stats') {
        const onlineUsers = users.length;
        const currentTime = Date.now();
        const uptimeMillis = currentTime - serverStartTime;

        // Convert uptime to a readable format (hours, minutes, seconds)
        const uptimeSeconds = Math.floor(uptimeMillis / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        const response = {
            timestamp: new Date().toISOString(),
            onlineUsers: onlineUsers,
            uptime: `${hours}h ${minutes}m ${seconds}s`
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

httpServer.listen(8080, () => {
    console.log(`${now_at()} HTTP API Gateway listening on port 8080`);
});

const FAKE_USER_IP = new Uint8Array([255, 255, 255, 255]);

const SERVER_PARAM_COUNT = new Uint8Array([0, 5]); //3 Params required for minimum PAL Compatibility
const SERVER_PARAM = new Uint8Array([3, 251]);
const SERVER_TITLE = TBL('palserver');
const SERVER_TITLE_PARAM = new Uint8Array([3, 232]);
const REGISTRATION_PAGE = TBL('http://pal.nenya.dev:81/vp/signup.html');
const REGISTRATION_PAGE_PARAM = new Uint8Array([3, 233]);
const PICKER_PAGE = TBL('http://pal.nenya.dev:81/vp/picker.html');
const PICKER_PAGE_PARAM = new Uint8Array([3, 238]);
const LOGIN_PAGE = TBL('http://pal.nenya.dev:81/vp/login.html');
const LOGIN_PAGE_PARAM = new Uint8Array([3, 241]);

const NEW_LOGIN_RESPONSE = new Uint8Array([223]);
const INVALID_LOGIN_RESPONSE = new Uint8Array([235]);

const PAL_USER_TYPE = new Uint8Array([2]);

const PACKET_MAIN_DM = 5;
const PACKET_MAIN_LOCATE = 10;
const PACKET_MAIN_BUDDY = 28;
const PACKET_MAIN_ROOM = 15;
const PAL_TYPE_ADD = 65;
const PAL_TYPE_REMOVE = 82;
const PAL_TYPE_LIST = 83;

const SERVER_BOT_COUNT = new Uint8Array([0, 3]); //3 Bots required for minimum PAL Compatibility
const FAKE_BOT_IP = new Uint8Array([255, 255, 255, 255]);
const PAL_BOT_ID = new Uint8Array([0, 0, 0, 2]);
const SERVER_BOT_ID = new Uint8Array([0, 0, 0, 0]);
const SERVER_BOT_TYPE = new Uint8Array([1, 32]);
const VPUSERSERVICE_BOT_ID = new Uint8Array([0, 0, 0, 1]);
const VPUSERSERVICE_BOT_TYPE = new Uint8Array([1, 33]);
const PAL_BOT_TYPE = new Uint8Array([1, 71]);
const PAL_STATUS_ONLINE = new Uint8Array([1]);
const PAL_STATUS_OFFLINE = new Uint8Array([0]);
const PAL_STATUS_AWAY = new Uint8Array([2]);

const ROOM_TYPE_PRIVATE = new Uint8Array([8, 32]);
const ROOM_TYPE_REGULAR = new Uint8Array([8, 64]);
const ROOM_TYPE_PICKER = new Uint8Array([8, 128]);
const ROOM_TYPE_LOBBY = new Uint8Array([8, 129]);
const ROOM_TYPE_AUDITORIUM = new Uint8Array([8, 130]);

let nextID = 5; // Start with ServerID 0x00000001

class Room {
   constructor() {
    this.roomURL = '';
    this.roomName = '';
    this.roomNum = 1;
    this.roomType = new Uint8Array([0, 0]);
    this.roomUserCount = 0;
    this.roomUserMax = 40;
    this.roomIDcorridor = new Uint8Array([0, 0, 0, 0]);
    this.roomIDroom = new Uint8Array([0, 0, 0, 0]);
    this.roomIDobserve = new Uint8Array([0, 0, 0, 0]);
   }
}

class User {
    constructor(connection, ip) {
        this.serverID = assignServerID();
        this.logged = false;
        this.username = '';
        this.password = '';
        this.avatarData = Buffer.alloc(0);
        this.idName = '';
        this.idLocation = '';
        this.idEmail = '';
        this.roomURL = ''; //We can use the URL as an index paired with the room # to get the IDs, no need to duplicate data
        this.roomNum = 1;
        this.inRoom = false;
        this.userType = 1;
        this.status = PAL_STATUS_OFFLINE;
        this.buddyList = [];
        this.connection = connection;
        this.sByte = 129;
        this.ip = ip;
        this.buffer = Buffer.alloc(0);
    }

        // Add a buddy to the buddy list
        addBuddy(buddy) {
            if (!this.buddyList.includes(buddy)) {
                this.buddyList.push(buddy);
            } else {
                console.log(`${now_at()} ${this.username} Buddy ${buddy} is already listed.`);
            }
        }
    
        // Remove a buddy from the buddy list
        removeBuddy(buddy) {
            const index = this.buddyList.indexOf(buddy);
            if (index !== -1) {
                this.buddyList.splice(index, 1);
            } else {
                console.log(`${now_at()} ${this.username }Buddy ${buddy} not found in the list.`);
            }
        }

    getServerIDBytes() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.serverID);
        return buffer;
    }
}

const assignServerID = () => nextID++;
const addUser = (user) => users.push(user);
const removeUser = (user) => {
    user.connection.destroy();
    const index = users.findIndex(u => u.serverID === user.serverID);
    if (index >= 0) {
        users.splice(index, 1);
        console.log(`${now_at()} ${user.serverID} User removed.`);
    }
};

function findUsersWithBuddy(buddy) {
    const usersWithBuddy = [];

    // Loop through all users in the users array
    users.forEach(user => {
        // Check if the buddyName is in the user's buddyList
        if (user.buddyList.includes(buddy.username)) {
            usersWithBuddy.push(user);
        }
    });

    return usersWithBuddy;
}

function findUserByName(username) {
    return users.findIndex(u => u.username.toLowerCase() === username.toString().toLowerCase());
}

function findUsersByString(searchString) {
    if (!searchString) return []; // Return an empty array for invalid input
    return users.filter(u =>
        u.username.toLowerCase().includes(searchString.toString().toLowerCase())
    );
}

function findUserByID(ID) {
    return users.findIndex(u => AsciiString(u.getServerIDBytes()) === ID);
}

const ipToBytes = (ip) => {
    console.log("Input IP:", ip);

    // Check if it's an IPv4-mapped IPv6 address
    if (ip.startsWith("::ffff:")) {
        ip = ip.slice(7); // Extract the IPv4 part after "::ffff:"
    }

    const parts = ip.split('.').map(Number);

    // Validate the IP format and range
    if (parts.length !== 4 || parts.some(part => part < 0 || part > 255)) {
        throw new Error('Invalid IPv4 address');
    }

    return Buffer.from(parts);
};

const startServer = async () => {
    try {
        console.log(`${now_at()} Server started on port 1533`);

        const server = net.createServer(handleConnection);
        server.listen(1533);
    } catch (err) {
        console.error(`${now_at()} Error starting server:`, err);
    }
};

const handleConnection = (socket) => {
    const remoteAddr = socket.remoteAddress;
    const ipBytes = ipToBytes(remoteAddr);
    const user = new User(socket, ipBytes);
    addUser(user);

    console.log(`${now_at()} ${user.serverID} New user connected`);
    sendOut(user, Buffer.from(ipBytes, 'ascii'));

    socket.on('data', (data) => {
        try {
            // Append received data to the user's buffer
            appendBuffer(user, data);
        } catch (error) {
            console.error(`${now_at()} ${user.serverID} Error while processing data from client: ${error.message}`);
            user.connection.destroy();
            removeUser(user);
        }
    });
    

    socket.on('close', () => {
        console.log(`${now_at()} ${user.serverID} User disconnected`);
        user.status = PAL_STATUS_OFFLINE;
        broadcast_status(user);
        removeUser(user);
    });

    socket.on('error', (err) => console.error(`${now_at()} ${user.serverID} CONN-Error-> `, err));
};

function appendBuffer(user, data) {
    try {
        user.buffer = Buffer.concat([user.buffer, data]); // Append new data
        handleData(user); // Process any complete packets
    } catch (error) {
        console.error(`${now_at()} ${username} Error in appendBuffer-> ${error}`);
    }
}

function handleData(user) {
    try {
        // Check for any control signals or immediate responses
        if (user.buffer.length > 0 && user.buffer[0] === 128) {
            console.log(`${now_at()} ${user.username} HEARTBEAT received`);
            user.buffer = user.buffer.slice(1); // Remove processed control byte
        }

        // Process complete packets
        while (user.buffer.length >= 5) { // Minimum header size
            // Extract packet length from the buffer
            const packetLength = UFBL(user.buffer.slice(1, 5)); // Your length extraction logic
            if (isNaN(packetLength) || packetLength < 0) {
                throw new Error(`${now_at()} ${user.username} Invalid packet length: ${packetLength}`);
            }

            // Check if the full packet is available in the buffer
            if (user.buffer.length < packetLength + 5) {
                console.log(`${now_at()} ${user.username} Incomplete packet, waiting for more data, expected ${packetLength} received: ${user.buffer.length}`);
                console.log(`${now_at()} ${user.username} DEBUG ${AsciiString(user.buffer)}`);
                break; // Wait for the next chunk of data
            }

            // Extract and process the complete packet
            const packetData = user.buffer.slice(5, 5 + packetLength);
            processPacket(user.buffer[0], packetData, user); // Your packet processing logic

            // Remove processed packet from the buffer
            user.buffer = user.buffer.slice(5 + packetLength);
        }
    } catch (error) {
        console.error(`${now_at()} ${user.serverID} Error in handleData:`, error);
        user.connection.destroy(); // Optionally terminate connection for critical errors
    }
}

function processPacket (sByte, clientPacket, user) {
    let response = Buffer.alloc(0);
    const userID = user.getServerIDBytes();

    console.log(`${now_at()} ${user.username} DEBUG IN ${sByte}: ${AsciiString(clientPacket)}`);
    if (!user.logged) {
        switch (sByte) {
            case 129:
            response = Buffer.concat([
                    Buffer.from([0, 0, 0, 0, 3, 0, 1]),
                    Buffer.from(SERVER_BOT_COUNT),
                    Buffer.from(SERVER_BOT_ID),
                    Buffer.from(SERVER_BOT_TYPE),
                    Buffer.from([0, 0, 0, 7]),
                    Buffer.from(FAKE_BOT_IP),
                    Buffer.from(VPUSERSERVICE_BOT_ID),
                    Buffer.from(VPUSERSERVICE_BOT_TYPE),
                    Buffer.from([0, 0, 0, 1]),
                    Buffer.from(FAKE_BOT_IP),
                    Buffer.from(PAL_BOT_ID),
                    Buffer.from(PAL_BOT_TYPE),
                    Buffer.from([0, 0, 0, 0]),
                    Buffer.from(FAKE_BOT_IP),
                    Buffer.from(SERVER_PARAM_COUNT),
                    Buffer.from([5]),
                    Buffer.from(SERVER_PARAM),
                    Buffer.from([0, 0]),
                    Buffer.from(SERVER_TITLE_PARAM),
                    SERVER_TITLE, 
                    Buffer.from([0]),
                    Buffer.from(REGISTRATION_PAGE_PARAM),
                    REGISTRATION_PAGE,
                    Buffer.from([0]),
                    Buffer.from(LOGIN_PAGE_PARAM),
                    LOGIN_PAGE,
                    Buffer.from([0]),
                    Buffer.from(PICKER_PAGE_PARAM),
                    PICKER_PAGE,
                    Buffer.from([0, 0, 0, 0]),
                ]);
                sendOut(user, response);
                break;

            case 130:
                if (clientPacket.length < 5) {
                    console.log("Error: Packet too short to contain valid data.");
                    return;
                }
            
                const usernameLength = UTBL(clientPacket.slice(5, 7));
                if (clientPacket.length < 7 + usernameLength) {
                    console.log(`${now_at()} ${user.serverID} Error: Packet too short to contain username.`);
                    return;
                }
                const username = clientPacket.slice(7, 7 + usernameLength).toString('utf-8');
                console.log(`${now_at()} ${user.serverID} Username-> ${username}`); // For debugging

                const passwordLength = UTBL(clientPacket.slice(14 + usernameLength, 16 + usernameLength));
                if (clientPacket.length < 10 + usernameLength + passwordLength) {
                    console.log("Error: Packet too short to contain password.");
                    return;
                }
                const password = clientPacket.slice(16 + usernameLength, 18 + usernameLength + passwordLength).toString('utf-8');
                console.log(`${now_at()} ${username} Password-> ${passwordLength}`); // For debugging

                if (validateUser(username, password) === false) {
                    response = Buffer.concat([Buffer.from([0, 14]),
                        user.getServerIDBytes(),
                        Buffer.from([0, 0, 0, 0]),
                        Buffer.from(INVALID_LOGIN_RESPONSE)]);

                    sendOut(user, response);
                    removeUser(user);
                    return;
                }

                checkExistingLogin = findUserByName(username);
                if (checkExistingLogin >= 0) { 
                    //Disconnect existing user.
                    response = Buffer.concat([Buffer.from([0, 14]),
                        user.getServerIDBytes(),
                        Buffer.from([0, 0, 0, 0]),
                        Buffer.from(NEW_LOGIN_RESPONSE)]);

                    sendOut(users[checkExistingLogin], response);
                    removeUser(users[checkExistingLogin]);
                }
        
                user.username = username;
                user.password = password;

                const part1 = Buffer.from([0, 12, 0, 0, 0]);
                const part2 = userID;
                const part3 = TBL(user.username);
                const part4 = Buffer.from([1, 2, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 0, 0]);
            
                // Combine all parts into a single packet
                response = Buffer.concat([part1, part2, part3, part4]);
                sendOut(user, response);
                break

            case 132:
                const urlLength = UTBL(clientPacket.slice(13, 15));
                const urlBytes = clientPacket.slice(15, 15 + urlLength);

                user.roomURL = urlBytes.toString();
                user.roomName = '';
                
                console.log(`${now_at()} ${user.username} NAVIGATE ${urlLength} ${AsciiString(urlBytes)}`);
                
                // Construct the first response packet
                response = Buffer.concat([
                    Buffer.from([0, 15, 0, 0, 1]), // Fixed header
                    userID,                        // User ID (Buffer)
                    Buffer.from([0, 3, 0, 0, 0, 38, 8, 128]), // Fixed part
                    TBL(urlBytes),                 // URL bytes with length
                    Buffer.from([
                        1, 1, 0, 0, 0, 40, 0, 0, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ]),
                ]);
                sendOut(user, response);
                
                // Construct the second response packet
                response = Buffer.concat([
                    Buffer.from([0, 29, 0]),       // Fixed header
                    userID,                        // User ID (Buffer)
                    Buffer.from([0, 0, 10, 114, 0, 104, 0, 0, 0, 0, 0, 0]),
                    Buffer.from(PAL_BOT_ID)]);
                sendOut(user, response);
                
                user.logged = true;
                user.status = PAL_STATUS_ONLINE;

                broadcast_status(user);
                break;                
        }
    } else {
        switch(clientPacket[1]) {
        case PACKET_MAIN_DM: // Handle DMs
            const key = clientPacket.slice(12, 14).join(',');

            switch (key) {
            case '2,2':
                console.log(`${AsciiString(clientPacket.slice(clientPacket.length - 4))}`);
                // Outbound More Info Req.
                const findBuddy2 = findUserByID(AsciiString(clientPacket.slice(clientPacket.length - 4)));
                if (findBuddy2 >= 0) {
                    const response2 = Buffer.concat([
                        Buffer.from([0, 5, 0]),
                        users[findBuddy2].getServerIDBytes(),
                        Buffer.from([0, 0, 0, 0, 0, 2, 2, 0]),
                        user.getServerIDBytes(),
                        Buffer.from([
                            1, 0,
                            ...TBL(user.username),
                            2, 0, 0, 0, 0, 0, 0
                        ])
                    ]);
        
                    sendOut(users[findBuddy2], response2);
                }
                return;
        
            case '6,3':
                const findBuddy6 = findUserByID(AsciiString(clientPacket.slice(clientPacket.length - 4)));
                if (findBuddy6 >= 0) {
                    const response6 = Buffer.concat([
                        Buffer.from([0, 5, 0]),
                        users[findBuddy6].getServerIDBytes(),
                        clientPacket.slice(7, clientPacket.length - 4),
                        user.getServerIDBytes(),
                        Buffer.from([
                            1, 0,
                            ...TBL(user.username),
                            2, 0, 0, 0, 0, 0, 0
                        ])
                    ]);
        
                    sendOut(users[findBuddy6], response6);
                }
                return;

                default:
                let messagesize = UTBL(clientPacket.slice(7, 9)); // Extract message size
                let messagetext = clientPacket.slice(9, 9 + messagesize); // Extract message text

                let attachmentsizeStart = 9 + messagesize;
                let attachmentsize = UFBL(clientPacket.slice(attachmentsizeStart, attachmentsizeStart + 4)); // Extract attachment size    
            
                let hasGesture = attachmentsize !== 0;
            
                let gesturetext = "";
                let sIDStart;
            
                if (hasGesture) {
                    let gesturesizeStart = attachmentsizeStart + 5; // Gesture TBL starts after the flag
                    let gesturesize = UTBL(clientPacket.slice(gesturesizeStart, gesturesizeStart + 2));
                    gesturetext = clientPacket.slice(gesturesizeStart + 2, gesturesizeStart + 2 + gesturesize);
                    sIDStart = gesturesizeStart + 2 + gesturesize; // sID starts after gesture data
                } else {
                    // No gesture
                    sIDStart = attachmentsizeStart + 4;
                }
            
                tID = AsciiString(clientPacket.slice(clientPacket.length - 4));
                console.log(`${now_at()} ${user.username} DM->${tID} ${messagesize}`);
            
                findBuddy = findUserByID(tID);
                if (findBuddy >= 0) { 
                    response = Buffer.concat([
                        Buffer.from([0, 5, 0]),       // Fixed header
                        users[findBuddy].getServerIDBytes(),
                        TBL(messagetext),
                        clientPacket.slice(attachmentsizeStart, sIDStart),
                        userID,
                        Buffer.from([1, 0]),
                        TBL(user.username),
                        Buffer.from([2, 255, 255, 255, 255, 0, 0])]);
                    sendOut(users[findBuddy], response); 
                    }
                break;
                }
            break;

        case PACKET_MAIN_LOCATE:
            searchTextSize = UTBL(clientPacket.slice(15, 17));
            searchTextData = Buffer.from(clientPacket.slice(17, 17 + searchTextSize), 'ascii');
            locate_results = findUsersByString(searchTextData);
            returnsize = twoByteLength(locate_results.length);
            
            let results = Buffer.alloc(0);
            
            for (const result of locate_results) {
                results = Buffer.concat([
                    results,
                    result.getServerIDBytes(),
                    Buffer.from([1, 0, 1]),
                    TBL(result.username),
                    PAL_USER_TYPE,
                    TBL(result.idName),
                    TBL(result.idLocation),
                    TBL(result.idEmail),
                    FAKE_USER_IP,
                    TBL(result.roomURL),
                    TBL(result.roomName),
                    ROOM_TYPE_LOBBY,
                    Buffer.from([0, 0, 0, 0, 0, 0, 4, 1, 1, 0, 0])
                ]);
            }
            
            response = Buffer.concat([
                Buffer.from([0, 10, 0]),
                user.getServerIDBytes(),
                Buffer.from([0, 0, 0, 1]),
                TBL(searchTextData),
                Buffer.from([0, 0]),
                returnsize,
                results
            ]);

            sendOut(user, response);            
            break;
        
        case PACKET_MAIN_ROOM:
            switch (clientPacket[10]) {
                case 21:
                    tID = AsciiString(clientPacket.slice(5, 9)); // Extract tID from the packet
                    const findBuddy = findUserByID(tID); // Find the buddy by tID
                    console.log(`${now_at()} ${user.username} Avatar-REQUEST-> ${users[findBuddy].username}`);

                    
                    if (findBuddy >= 0) {  // Ensure buddy is found (index >= 0)
            
                        response = Buffer.concat([
                            Buffer.from([0, 15, 0, 0, 1]),  // Fixed header
                            clientPacket.slice(5, 9),
                            Buffer.from([0, 21, 1, 1]),     // Packet flags or additional data
                            Buffer.from(users[findBuddy].avatarData)
                        ]);
            
                        sendOut(user, response); // Send the response to the user
                        console.log(`${now_at()} ${user.username} Avatar-SENT-> ${users[findBuddy].username}`);
                    }
                    break;
            

                case 22:
                    avdata = clientPacket.slice(13);
                    console.log(`${now_at()} ${user.username} Avatar-UPDATE-> ${avdata.length}`);
                    user.avatarData = new Uint8Array(avdata);
                    break;
            }

            break;

        case PACKET_MAIN_BUDDY: //PAL Functions
            switch (clientPacket[12]) {
                case PAL_TYPE_ADD: //Add Buddy
                    buddyNameText = clientPacket.slice(21, clientPacket.length - 4);
                    console.log(`${now_at()} Buddylist->ADD ${buddyNameText.length} ${buddyNameText}`);
                    findBuddy = findUserByName(buddyNameText);
                    if ((findBuddy >= 0) && (users[findBuddy].status === PAL_STATUS_ONLINE)) { 
                        buddyID = users[findBuddy].getServerIDBytes();
                        console.log(`${now_at()} User Online: ${AsciiString(buddyID)} ${buddyNameText}`);

                        user.addBuddy(users[findBuddy].username);

                        if (users[findBuddy].status = PAL_STATUS_ONLINE) {
                            response = Buffer.concat([
                                Buffer.from([0, 29, 0]),       // Fixed header
                                userID,                        // User ID (Buffer)
                                Buffer.from([0, 0, 10, 114, 48, 111, 0, 0, 0, 0]),
                                Buffer.concat([
                                    TBL(Buffer.concat([
                                        Buffer.from(users[findBuddy].status, 'ascii'), 
                                        TBL(Buffer.from(users[findBuddy].username, 'ascii')),
                                        buddyID
                                    ]))
                                ]),
                                Buffer.from(PAL_BOT_ID)]);
                            sendOut(user, response); 
                        }
                    }

                    break;

                case PAL_TYPE_REMOVE: //Remove Buddy
                    buddyNameText = clientPacket.slice(21, clientPacket.length - 4);
                    user.removeBuddy(buddyNameText);
                    console.log(`${now_at()} ${user.username} Buddylist->REMOVE ${buddyNameText.length} ${buddyNameText}`);
                    break;

                case PAL_TYPE_LIST: // Buddylist send
                    const friendCount = UTBL(clientPacket.slice(24, 26));
                    console.log(`${now_at()} ${user.username} Buddylist: ${friendCount} friends`);
                    let buddyBegin = 26;
                    let tempPacket = Buffer.alloc(0);
                    onlineCount = 0;
                
                    for (let i = 0; i < friendCount; i++) {
                        const tempBuddyNameSize = UTBL(clientPacket.slice(buddyBegin, buddyBegin + 2));
                        buddyBegin += 2;
                
                        const tempBuddyName = clientPacket.slice(buddyBegin, buddyBegin + tempBuddyNameSize).toString('utf-8');
                        buddyBegin += tempBuddyNameSize;
                
                        user.addBuddy(tempBuddyName);
                        console.log(`${now_at()} ${user.username} Buddylist->INIT ${tempBuddyName}`);

                        findBuddy = findUserByName(tempBuddyName);
                        if (findBuddy >= 0) { 
                            buddyID = users[findBuddy].getServerIDBytes();
                            console.log(`${now_at()} Sending User Online for ${AsciiString(buddyID)} ${tempBuddyName} to ${AsciiString(userID)} ${user.username}`);
   
                            if (users[findBuddy].status === PAL_STATUS_ONLINE) {
                                tempPacket = Buffer.concat([tempPacket, TBL(users[findBuddy].username), buddyID]);
                                onlineCount++;
                            }
                        }
                    }
                    response = Buffer.concat([
                        Buffer.from([0, 29, 0]),       // Fixed header
                        userID,                        // User ID (Buffer)
                        Buffer.from(VPUSERSERVICE_BOT_ID),
                        Buffer.from([48, 117, 0, 0]),
                        Buffer.from(
                            FBL(
                                Buffer.concat([
                                    twoByteLength(onlineCount), // Online count as a 2-byte buffer
                                    tempPacket,
                                    Buffer.from([0, 0]),
                                ])
                            )
                        ),
                        Buffer.from(PAL_BOT_ID)]);
                    sendOut(user, response); 
                    break;
                
                case 86:
                        switch (clientPacket[19]) {
                            case 1:
                                user.status = PAL_STATUS_ONLINE;
                                break;
                            case 0:
                                user.status = PAL_STATUS_OFFLINE;
                                break;
                            case 2:
                                user.status = PAL_STATUS_AWAY;
                                break;
                            default:
                                console.log(`${now_at()} ${user.username} Unknown type: ${clientPacket[19]}`)
                                break;
                        }
                        broadcast_status(user);
                        break;
                
                default:
                    console.log(`${now_at()} ${user.username} Unknown type: ${clientPacket[12]}`);
                    break;

            }
            break;
        }
    }
};

function sendOut(user, data) {
    if (!user.connection) {
        console.error(`${now_at()} ${user.username} is not connected`);
        return;
    }

    // Prepare the packet
    const packet = Buffer.concat([Buffer.from([user.sByte]), FBL(data)]);
    const canWrite = user.connection.write(packet);

    // Cycle `sByte` between 129 and 255
    user.sByte = user.sByte === 255 ? 129 : user.sByte + 1;

    console.log(`${now_at()} ${user.username} DEBUG OUT ${AsciiString(packet)}`);

    // Handle backpressure if the write buffer is full
    if (!canWrite) {
        console.warn(`${now_at()} ${user.username} Backpressure detected, waiting for drain event`);
        user.connection.once('drain', () => {
            console.log(`${now_at()} ${user.username} Drain event triggered, resuming writes`);
        });
    }
}

function FBL(theString) {
    const lengthBuffer = Buffer.from(fourByteLength(theString.length));
    const stringBuffer = Buffer.from(theString, 'ascii');

    return Buffer.concat([lengthBuffer, stringBuffer]);
}

function TBL(theString) {
    const lengthBuffer = Buffer.from(twoByteLength(theString.length));
    const stringBuffer = Buffer.from(theString, 'ascii');

    return Buffer.concat([lengthBuffer, stringBuffer]);
}

function UFBL(buffer) {
    if (buffer.length !== 4) {
        console.error(`${now_at()} UFBL expects a 4-byte buffer.`);
        return;
    }

    let a = buffer[0] * (256 ** 3);
    let b = buffer[1] * (256 ** 2);
    let c = buffer[2] * 256;
    let d = buffer[3];
    return a + b + c + d;
}

function UTBL(buffer) {
    if (buffer.length !== 2) {
        console.error(`${now_at()} UTBL expects a 2-byte buffer.`);
        return;
    }

    const a = buffer[0] * 256;
    const b = buffer[1];
    return a + b;
}

function fourByteLength(uintPacketSize) {
    let chrPacketHeader = new Uint8Array(4);

    chrPacketHeader[0] = (uintPacketSize >> 24) & 0xFF; // Calculate the highest byte
    chrPacketHeader[1] = (uintPacketSize >> 16) & 0xFF; // Calculate the second highest byte
    chrPacketHeader[2] = (uintPacketSize >> 8) & 0xFF;  // Calculate the second lowest byte
    chrPacketHeader[3] = uintPacketSize & 0xFF;         // Calculate the lowest byte

    return chrPacketHeader;
}

function twoByteLength(uintPacketSize) {
    if (uintPacketSize > 65535) {
        throw new RangeError(`${now_at()} Packet length cannot exceed 65,535 bytes.`);
    }

    let chrPacketHeader = new Uint8Array(2);

    chrPacketHeader[0] = (uintPacketSize >> 8) & 0xFF; // Calculate the high byte
    chrPacketHeader[1] = uintPacketSize & 0xFF;        // Calculate the low byte

    return chrPacketHeader;
}

function AsciiString(byteArray) {
    if (!Array.isArray(byteArray) && !(byteArray instanceof Uint8Array)) {
        console.error(`${now_at()} Input must be a ByteArray or Uint8Array.`);
        return "";
    }

    return Array.from(byteArray).join(' ');
}

function now_at() {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
           `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

//Protocol Functions
function broadcast_status(user) {
    const usersWithBuddy = findUsersWithBuddy(user);
    console.log(`${now_at()} Looking for ${user.username} buddylist users.`);
    buddyID = user.getServerIDBytes();

    usersWithBuddy.forEach(tempuser => {
        console.log(`Sending update for ${user.username} to ${tempuser.username}`);

        userID = tempuser.getServerIDBytes();
            response = Buffer.concat([
                Buffer.from([0, 29, 0]),       // Fixed header
                userID,                        // User ID (Buffer)
                Buffer.from([0, 0, 10, 114, 48, 111, 0, 0, 0, 0]),
                Buffer.concat([
                    TBL(Buffer.concat([
                        Buffer.from(user.status, 'ascii'), 
                        TBL(Buffer.from(user.username, 'ascii')),
                        buddyID
                    ]))
                ]),
                Buffer.from(PAL_BOT_ID)]);
            sendOut(tempuser, response); 
    });
}

startServer();