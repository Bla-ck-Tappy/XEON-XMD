import config from '../../config.cjs';

const jidCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const command = m.body?.startsWith(prefix)
    ? m.body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()
    : '';

  if (command === 'jid') {
    const isGroup = m.from.endsWith('@g.us');
    const jid = isGroup ? m.from : `${m.sender}`;
    const text = isGroup
      ? `🌐 *Group JID:* \n\`\`\`${jid}\`\`\``
      : `👤 *User JID:* \n\`\`\`${jid}\`\`\``;

    return await Matrix.sendMessage(m.from, {
      text,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: '𝐗ҽσɳ-𝐗ƚҽƈ𝐡',
          newsletterJid: '120363369453603973@newsletter'
        }
      }
    }, { quoted: m });
  }
};

export default jidCommand;
