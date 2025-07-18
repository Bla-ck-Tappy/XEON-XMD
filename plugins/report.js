import config from '../../config.cjs';

const reportedMessages = {};

const report = async (m, sock) => {
  const prefix = config.PREFIX;
  const devNumber = '254756360306';
  const validCommands = ['bug', 'report', 'request'];
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';

  if (!validCommands.includes(cmd)) return;

  const text = m.body.slice(prefix.length + cmd.length).trim();
  const messageId = m.key.id;

  if (!text)
    return m.reply(`📌 *Usage:* ${prefix + cmd} your report\n🟢 _Example:_ ${prefix + cmd} play command is not working`);

  if (reportedMessages[messageId])
    return m.reply("🟢 This report has *already* been sent.\nPlease wait for a response from the developer.");

  reportedMessages[messageId] = true;

  const newsletterInfo = {
    forwardingScore: 5,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterName: "ꊼεɸƞ-ꊼԵεϲཏ",
      newsletterJid: "120363369453603973@newsletter",
    }
  };

  const forwardText = `📢 *NEW USER REQUEST/BUG*\n\n👤 *User:* @${m.sender.split("@")[0]}\n📂 *Request/Bug:* ${text}`;

  await sock.sendMessage(`${devNumber}@s.whatsapp.net`, {
    text: forwardText,
    mentions: [m.sender],
    contextInfo: newsletterInfo
  }, { quoted: m });

  await m.reply(`✅ *Thank you ${m.pushName}!*\nYour report has been sent to the *Xeon-Xtech Dev* 🛠️\nPlease wait patiently for a response.`);
};

export default report;
