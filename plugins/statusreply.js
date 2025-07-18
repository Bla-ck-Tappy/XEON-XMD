import config from '../../config.cjs';

const anticallCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd !== 'statusreply') return;

  if (!isCreator) {
    return m.reply('🚫 *ACCESS DENIED: ONLY OWNER CAN EXECUTE THIS COMMAND!*');
  }

  try {
    let responseText;

    if (text) {
      config.STATUS_READ_MSG = text;
      responseText = `
╭───⧉  *Status Message-Updated*
│
│ 🧠 *New Status Message:*
│ 💬 ${text}
│ 👤 *Updated By:* @${m.sender.split("@")[0]}
│
╰────⟡ *Xeon-AI Status Control Panel*
`.trim();
    } else {
      responseText = `
╭───⧉  *Status-Message Settings*
│
│ 🔧 *Usage:*
│ ✍️ *Use:* ${prefix}setstatusmsg <message>
│ 📌 *Example:* ${prefix}setstatusmsg I am currently busy!
│
╰────⟡ *Xeon-AI Status Control Panel*
`.trim();
    }

    await Matrix.sendMessage(m.from, {
      text: responseText,
      mentions: [m.sender],
      contextInfo: {
        forwardingScore: 777,
        isForwarded: true,
        externalAdReply: {
          title: "XEON-XTECH - STATUS SET",
          body: "Smart Status Handler",
          thumbnailUrl: "https://files.catbox.moe/6g5aq0.jpg",
          mediaType: 1,
          renderLargerThumbnail: true,
          sourceUrl: "https://github.com/Black-Tappy/XEON-XMD"
        }
      }
    }, { quoted: m });

  } catch (err) {
    console.error('❌ Error:', err);
    await Matrix.sendMessage(m.from, { text: '⚠️ *ERROR SETTING STATUS MESSAGE.*' }, { quoted: m });
  }
};

export default anticallCommand;
