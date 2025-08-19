const config = require('../../config.cjs');

const NEWSLETTER_JID = '120363369453603973@newsletter';

// 🧾 Define quoted contact
const quotedContact = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: config.OWNER_NAME || "⚙️ Anti-Sticker 🚫",
            vcard: `BEGIN:VCARD
VERSION:3.0
FN:${config.OWNER_NAME || "Xeon-Xtech"}
ORG:Bot Repo;
TEL;type=CELL:+1234567890
END:VCARD`
        }
    }
};

// 🧩 Anti-Sticker Command
const antistickerCommand = async (m, Matrix) => {
    const botNumber = await Matrix.decodeJid(Matrix.user.id);
    const isCreator = [botNumber, config.OWNER + '@s.whatsapp.net'].includes(m.sender);
    const prefix = config.PREFIX;
    const body = m.body || '';
    const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    // ⚡ Handler
    if (cmd === 'antisticker') {
        if (!isCreator) return m.reply("🚫 *Owner-only command*");

        const subCmd = body.slice(prefix.length + cmd.length).trim().toLowerCase();
        let response;

        switch (subCmd) {
            case 'on':
                global.ANTI_STICKER = true;
                response = `🛡️ *Anti-Sticker Protection:* ENABLED\nStickers will now be auto-deleted.`;
                break;

            case 'off':
                global.ANTI_STICKER = false;
                response = `🔓 *Anti-Sticker Protection:* DISABLED\nStickers are now allowed.`;
                break;

            case 'status':
                response = `📊 *Anti-Sticker Status:* ${global.ANTI_STICKER ? '🟢 ACTIVE' : '🔴 INACTIVE'}`;
                break;

            default:
                response = `📍 *Anti-Sticker Usage:*\n\n• ${prefix}antisticker on — Enable\n• ${prefix}antisticker off — Disable\n• ${prefix}antisticker status — Check status`;
        }

        return Matrix.sendMessage(m.chat, {
            text: response,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: NEWSLETTER_JID,
                    newsletterName: "Xeon-Xtech Bot",
                    serverMessageId: '',
                },
                externalAdReply: {
                    title: "⚙️ Xeon-Xtech Bot",
                    body: "Powered By Black-Tappy",
                    thumbnailUrl: 'https://files.catbox.moe/wxuaal.jpg',
                    sourceUrl: config.whatsappChannelLink || "https://whatsapp.com/channel/0029VasHgfG4tRrwjAUyTs10",
                    mediaType: 1,
                    renderLargerThumbnail: false,
                }
            }
        }, { quoted: quotedContact });
    }

    // 🧽 Auto-delete stickers
    if (global.ANTI_STICKER && m.message?.stickerMessage) {
        try {
            if (m.isGroup) {
                await Matrix.sendMessage(m.chat, {
                    delete: {
                        remoteJid: m.chat,
                        fromMe: false,
                        id: m.key.id,
                        participant: m.sender
                    }
                });
            } else {
                try {
                    await Matrix.sendMessage(m.chat, { delete: m.key });
                } catch {
                    await Matrix.sendMessage(m.chat, {
                        delete: {
                            remoteJid: m.chat,
                            fromMe: false,
                            id: m.key.id,
                            participant: m.sender
                        }
                    });
                }

                // 🗯️ Notify user
                await Matrix.sendMessage(m.chat, {
                    text: `🚫 *No stickers allowed*`,
                    mentions: [m.sender],
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: NEWSLETTER_JID,
                            newsletterName: "Xeon Xtech Bot",
                            serverMessageId: '',
                        }
                    }
                }, { quoted: quotedContact });
            }
        } catch (err) {
            console.error('[❌ Anti-Sticker Error]:', err);
        }
    }
};

module.exports = antistickerCommand;