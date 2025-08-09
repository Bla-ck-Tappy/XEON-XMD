import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    downloadContentFromMessage,
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import { File } from 'megajs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment-timezone';
import axios from 'axios';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs'; // Assuming this exports { emojis, doReact }
import { doStatusReact } from './lib/autoreactstatus.cjs'; // NEW: Import the status reaction function
import { fileURLToPath } from 'url';

const { emojis, doReact } = pkg;
const prefix = process.env.PREFIX || config.PREFIX;
const sessionName = "session";
const app = express();
const orange = chalk.bold.hex("#FFA500");
const lime = chalk.bold.hex("#32CD32");
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;
let store = {}; // Defined here, typically initialized with makeInMemoryStore and linked to Matrix.ev

const whatsappChannelLink = 'https://whatsapp.com/channel/0029VasHgfG4tRrwjAUyTs10';
const whatsappChannelId = '120363369453603973@newsletter';

const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');
const statsFilePath = path.join(__dirname, 'deployment_stats.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function updateDeploymentStats() {
    let stats = { total: 0, today_deploys: { date: "", count: 0 } };
    try {
        if (fs.existsSync(statsFilePath)) {
            stats = JSON.parse(fs.readFileSync(statsFilePath));
        }
    } catch (error) {
        console.error("Error reading deployment stats:", error);
    }

    const today = moment().tz(config.TIME_ZONE || "Africa/Nairobi").format("YYYY-MM-DD");

    if (stats.today_deploys.date === today) {
        stats.today_deploys.count += 1;
    } else {
        stats.today_deploys.date = today;
        stats.today_deploys.count = 1;
    }
    stats.total += 1;

    try {
        fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error("Error writing deployment stats:", error);
    }

    return stats;
}

async function downloadSessionData() {
    console.log("Debugging SESSION_ID:", config.SESSION_ID);

    if (!config.SESSION_ID) {
        console.error('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    if (config.SESSION_ID.startsWith("XEON-XTECH~")) {
        const sessdata = config.SESSION_ID.split("XEON-XTECH~")[1];

        if (!sessdata || !sessdata.includes("#")) {
            console.error('❌ Invalid SESSION_ID format for mega.nz! It must contain both file ID and decryption key.');
            return false;
        }

        const [fileID, decryptKey] = sessdata.split("#");

        try {
            console.log("🔄 Downloading Session from Mega.nz...");
            const file = File.fromURL(`https://mega.nz/file/${fileID}#${decryptKey}`);

            const data = await new Promise((resolve, reject) => {
                file.download((err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

            await fs.promises.writeFile(credsPath, data);
            console.log("🔒 Session Successfully Loaded from Mega.nz!!");
            return true;
        } catch (error) {
            console.error('❌ Failed to download session data from Mega.nz:', error);
            return false;
        }
    } else if (config.SESSION_ID.startsWith("POPKID$")) {
        const sessdata = config.SESSION_ID.split("POPKID$")[1];
        const url = `https://pastebin.com/raw/${sessdata}`;
        try {
            console.log("🔄 Downloading Session from Pastebin...");
            const response = await axios.get(url);
            const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            await fs.promises.writeFile(credsPath, data);
            console.log("🔒 Session Successfully Loaded from Pastebin !!");
            return true;
        } catch (error) {
            console.error('❌ Failed to download session data from Pastebin:', error);
            return false;
        }
    } else {
        console.error('❌ Unknown SESSION_ID format. Please use XEON-XTECH~...#... or POPKID$...');
        return false;
    }
}

// Updated lifeQuotes object with time-based categories
const lifeQuotes = {
    morning: [
        "Good morning! May your coffee be strong and your day productive. ☕✨",
        "Rise and shine! A new day brings new possibilities. ☀️🚀",
        "Wake up with determination, go to bed with satisfaction. 💪😊",
        "Every sunrise is an invitation to brighten someone's day. 🌅💖",
        "The early bird catches the best vibes. 🐦🌟",
        "Start your day with a grateful heart. 🙏💚"
    ],
    afternoon: [
        "Afternoon delight! Keep pushing towards your goals. 🎯💡",
        "Midday musings: Take a moment to breathe and reset. 😌🍃",
        "Fueling up for the rest of the day's adventures. 🔋🗺️",
        "May your afternoon be as pleasant as your morning. 🌻😊",
        "Keep your eyes on the stars and your feet on the ground. ✨👣",
        "Embrace the present moment. ⏳💖"
    ],
    evening: [
        "Evening serenity. Reflect on your day's journey. 🌌🧘",
        "Wind down and recharge. Tomorrow is a new beginning. 🌙✨",
        "The moon reminds us that even in darkness, there is light. 🌕💫",
        "Unwind and let go. The day is done, welcome the night. 🌃🥂",
        "Cherish the quiet moments before the night's embrace. 🕯️💜",
        "Find peace in the fading light. 🌆✨"
    ],
    night: [
        "Good night! Dream big and rest well. 😴🌟",
        "May your sleep be peaceful and your dreams sweet. 🛌💭",
        "The stars are out, reminding you of infinite possibilities. ✨🔭",
        "Close your eyes and let the tranquility of night wash over you. 🌑😌",
        "Another day complete. Embrace the peace of the night. 🌙💙",
        "Rest, for tomorrow's adventures await. 💤🌍"
    ]
};

// New emoji pools for different times of the day
const timeOfDayEmojis = {
    morning: ['☀️', '☕', '🌸', '🌅', '✨'],
    afternoon: ['🔆', '💡', '🌿', '🚀', '🔋'],
    evening: ['🌆', '🌙', '🌟', '🌌', '🌒'],
    night: ['🌃', '😴', '🌠', '🦉', '💤']
};

// Updated updateBio function
async function updateBio(Matrix) {
    try {
        const now = moment().tz(config.TIME_ZONE || 'Africa/Nairobi');
        const time = now.format('HH:mm:ss');
        const hour = now.hour(); // Get the hour in 24-hour format

        let currentQuotes;
        let timeOfDayEmoji;

        if (hour >= 5 && hour < 12) { // 5 AM to 11:59 AM
            currentQuotes = lifeQuotes.morning;
            timeOfDayEmoji = timeOfDayEmojis.morning[Math.floor(Math.random() * timeOfDayEmojis.morning.length)];
        } else if (hour >= 12 && hour < 18) { // 12 PM to 5:59 PM
            currentQuotes = lifeQuotes.afternoon;
            timeOfDayEmoji = timeOfDayEmojis.afternoon[Math.floor(Math.random() * timeOfDayEmojis.afternoon.length)];
        } else if (hour >= 18 && hour < 22) { // 6 PM to 9:59 PM
            currentQuotes = lifeQuotes.evening;
            timeOfDayEmoji = timeOfDayEmojis.evening[Math.floor(Math.random() * timeOfDayEmojis.evening.length)];
        } else { // 10 PM to 4:59 AM
            currentQuotes = lifeQuotes.night;
            timeOfDayEmoji = timeOfDayEmojis.night[Math.floor(Math.random() * timeOfDayEmojis.night.length)];
        }

        const randomIndex = Math.floor(Math.random() * currentQuotes.length);
        const randomQuote = currentQuotes[randomIndex];
        
        // Include the time of day emoji in the bio for a more dynamic feel
        const bio = `✨|🟢 Xeon-Xtech Is Active At 🟢|✨ ${time} ${timeOfDayEmoji} | ${randomQuote}`;
        await Matrix.updateProfileStatus(bio);
        console.log(chalk.yellow(`ℹ️ Bio updated to: "${bio}"`));
    } catch (error) {
        console.error(chalk.red('Failed to update bio:'), error);
    }
}

// updateLiveBio now simply calls updateBio to reuse the logic
async function updateLiveBio(Matrix) {
    await updateBio(Matrix);
}

// Define the quotedContact object as specified
const quotedContact = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net", 
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: config.OWNER_NAME || "System | Verified ✅",
            vcard: `BEGIN:VCARD
VERSION:3.0
FN:${config.OWNER_NAME || "Xeon-Xtech"}
ORG:Bot Repo;
TEL;type=CELL:+1234567890
END:VCARD`
        }
    }
};


async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🤖 XEON XTECH using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["XEON-XTECH", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                if (store && typeof store.loadMessage === 'function') {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                // MODIFIED SECTION START
                console.log("xeon xtech whatsapp user bot"); // Log the message to the console
                return undefined; // Indicate that no message was found
                // MODIFIED SECTION END
            }
        });

        Matrix.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    console.log(chalk.yellow("🔴 Connection closed. Reconnecting..."));
                    start();
                } else {
                    console.log(chalk.red("🔴 Connection logged out. Please re-authenticate."));
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    process.exit(1);
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("✔️ xᴇᴏɴ xᴛᴇᴄʜ ɪs ɴᴏᴡ ᴏɴʟɪɴᴇ ᴀɴᴅ ᴘᴏᴡᴇʀᴇᴅ ᴜᴘ"));
                    await updateBio(Matrix); // Call updateBio for initial setup 

                    // Stylish Emojis
                    const statusEmojis = ['✅', '🟢', '✨', '📶', '🔋'];
                    
                    let status = "Stable";
                    const speed = Math.floor(Math.random() * 1500) + 200; // Random speed between 200 and 1700
                    
                    if (speed > 1000) status = "Slow";
                    else if (speed > 500) status = "Moderate";
                    // Otherwise, it remains "Stable"

                    // Define new fancy connection messages
                    const connectionMessages = [
                        "System online. Ready to serve! 😊",
                        "I'm live! Let the automation begin! 🚀",
                        "Connection established. All systems nominal. 🛰️",
                        "Hello world! Your friendly bot is here. 👋",
                        "Powered up and ready to go! ✨",
                        "XEON-XTECH is awake and active! ⚡",
                        "Your digital assistant has arrived! 🤖",
                        "Online and buzzing with energy! 🐝",
                        "Welcome aboard! Dear User 🎉",
                        "The network is humming & online! 🎶",
                        "Ready to process your requests! ⚙️",
                        "Your virtual companion is online! 🌟"
                    ];

                    // Select a random message from the new array
                    const randomConnectionMessage = connectionMessages[Math.floor(Math.random() * connectionMessages.length)];

                    const caption = `
*⎾===========================================⏌*
  *📡XEON-XTECH -- SYSTEM DIAGNOSTICS*
 *⌬━━━━━━━━━━━━━━━━━━━⌬*
  ◉ *🤖 Bot ID: » ${config.botname || "XEON-XTECH"}*
  ◉ *📂 Owner: » ${config.OWNER_NAME}*
  ◉ *⚙️ Mode: » ${config.MODE}*
  ◉ *⚒️ Prefix: » ${config.PREFIX}*
  ◉ *⚡ Speed: » ${statusEmojis[Math.floor(Math.random() * statusEmojis.length)]} ${speed}ms*
  ◉ *📶 Status: » ${statusEmojis[Math.floor(Math.random() * statusEmojis.length)]} ${status}*
  *🔗 Follow my WhatsApp Channel:* ${whatsappChannelLink}
 *⌬━━━━━━━━━━━━━━━━━━━⌬*
 *⚙️ ${randomConnectionMessage} *
*⎿===========================================⏋*                                       `;

                    await Matrix.sendMessage(Matrix.user.id, {
                        image: { url: "https://files.catbox.moe/mbnjxn.jpg" },
                        caption,
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 999,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: whatsappChannelId,
                                newsletterName: "*↻◁xᴇᴏɴ-xᴛᴇᴄʜ▷↻*",
                                serverMessageId: -1,
                            },
                            externalAdReply: {
                                title: "⚙️ Xeon-Xtech Bot",
                                body: "Powered By Black-Tappy",
                                thumbnailUrl: 'https://files.catbox.moe/wxuaal.jpg',
                                sourceUrl: whatsappChannelLink,
                                mediaType: 1,
                                renderLargerThumbnail: false,
                            },
                            // Add the quoted contact here
                            quotedMessage: quotedContact
                        },
                    });

                    await Promise.all([
                        // channel follow status.
                        (async () => {
                            try {
                                await Matrix.query({
                                    tag: 'iq',
                                    attrs: { to: whatsappChannelId, type: 'set', xmlns: 'newsletter' },
                                    content: [{ tag: 'follow', attrs: { mute: 'false' } }]
                                });
                                console.log(chalk.blue(`✅ Successfully sent follow request to channel: ${whatsappChannelId}`));
                            } catch (error) {
                                console.error(chalk.red(`🔴 Failed to follow channel ${whatsappChannelId}:`), error);
                            }
                        })(),

                        // Set to join the specified group 
                        (async () => {
                            const groupLink = 'https://chat.whatsapp.com/FMiFOIfMlWSIkN77Xnc9Ag?mode=ac_c';
                            if (groupLink) {
                                const inviteCodeMatch = groupLink.match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9-]+)/);
                                if (inviteCodeMatch && inviteCodeMatch[1]) {
                                    const inviteCode = inviteCodeMatch[1];
                                    try {
                                        await Matrix.groupAcceptInvite(inviteCode);
                                        console.log(chalk.blue(`🟢 Successfully joined group with invite code ${inviteCode}.`));
                                    } catch (error) {
                                        console.error(chalk.red(`🔴 Failed to join group ${groupLink}:`), error);
                                    }
                                } else {
                                    console.error(chalk.red(`⚠️ Invalid group invite link provided: ${groupLink}`));
                                }
                            }
                        })()
                    ]);

                    if (!global.isLiveBioRunning) {
                        global.isLiveBioRunning = true;
                        setInterval(async () => {
                            await updateLiveBio(Matrix);
                        }, 10000); // 10 seconds for live bio updates
                    }

                    initialConnection = false;
                } else {
                    console.log(chalk.blue("♻️ Connection reestablished after restart."));
                    if (!global.isLiveBioRunning) {
                        global.isLiveBioRunning = true;
                        setInterval(async () => {
                            await updateLiveBio(Matrix);
                        }, 10000); // 10 seconds for live bio updates
                    }
                }
            }
        });

        Matrix.ev.on('creds.update', saveCreds);

        Matrix.ev.on("messages.upsert", async chatUpdate => await Handler(chatUpdate, Matrix, logger));
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag)); 

        if (config.MODE === "public") {
            Matrix.public = true;
        } else if (config.MODE === "private") {
            Matrix.public = false;
        }

        // const autoreactstatus.cjs
        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek || !mek.message || mek.key.fromMe || mek.message?.protocolMessage) return;

                if (config.AUTO_REACT && !mek.key.remoteJid.endsWith('@g.us')) {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await doReact(randomEmoji, mek, Matrix);
                }

                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    if (config.AUTO_STATUS_SEEN) {
                        await Matrix.readMessages([mek.key]);
                    }
                    if (config.AUTO_STATUS_REACT === 'true') {
                        // doStatusReact function
                        await doStatusReact(Matrix, mek); 
                    }
                    if (config.AUTO_STATUS_REPLY) {
                        const customMessage = config.STATUS_READ_MSG || '✅ Auto Status Seen Bot By Xeon-Xtech';
                        await Matrix.sendMessage(mek.key.remoteJid, { text: customMessage }, { quoted: mek });
                    }
                }
            } catch (err) {
                console.error('Error in secondary message handler:', err);
            }
        });

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, proceeding without QR code.");
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("🔒 Session downloaded, starting bot.");
            await start();
        } else {
            console.log("No session found or downloaded, QR code will be printed for authentication.");
            useQR = true;
            await start();
        }
    }
}

init();

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./lib/index.html"));
});

app.get('/ping', (req, res) => {
    res.status(200).send({ status: 'ok', message: 'Bot is alive!' });
});

app.listen(PORT, () => {
    console.log(lime(`Server is running on port ${PORT}`));
    console.log(orange(`To keep the bot alive, ping this URL: http://localhost:${PORT}/ping`));
});
