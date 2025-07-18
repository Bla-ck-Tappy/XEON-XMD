import config from '../../config.cjs';

const ping = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "ping") {
    const start = performance.now();
    await m.React('⏳');

    await sock.sendPresenceUpdate('composing', m.from);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await sock.sendPresenceUpdate('paused', m.from);

    const end = performance.now();
    const responseTime = Math.round(end - start);

    const text = `
╭━━━〔 *PONG!* 〕━━━╮
┃ ⚡ *Status:* Online
┃ ⏱️ *Response:* ${responseTime} ms
┃ ${getFancyMessage()}
╰━━━━━━━━━━━━━━╯
    `.trim();

    let profilePic;
    try {
      profilePic = await sock.profilePictureUrl(m.sender, 'image');
    } catch (err) {
      // Fallback image if profile pic isn't available
      profilePic = 'https://i.ibb.co/7yzjwvJ/default.jpg';
    }

    // Assuming whatsappChannelLink is exported from config.cjs
    const whatsappChannelLink = config.whatsappChannelLink;

    await sock.sendMessage(m.from, {
      image: { url: profilePic },
      caption: text
    }, {
      // The 'quoted' option is used to reply to a specific message.
      quoted: m,
      contextInfo: {
        externalAdReply: {
          title: "ꊼεɸƞ-ꊼԵεϲཏ ႪɸԵ", // Title for the ad reply
          body: "Powered By Black-Tappy", // Body text for the ad reply
          thumbnailUrl: 'https://files.catbox.moe/6g5aq0.jpg', // URL for the thumbnail image
          sourceUrl: whatsappChannelLink, // URL for the source of the ad reply
          mediaType: 1, // Type of media for the ad reply (1 typically means image)
          renderLargerThumbnail: false, // Whether to render the thumbnail larger
        }
      }
    });
  }
}

// Helper function to get a random fancy message for variety.
function getFancyMessage() {
  const messages = [
    "⚡ Zooming through the wires!",
    "💨 Too fast to catch!",
    "🚀 Full throttle response!",
    "✨ Lightning mode activated!",
    "🌐 Instant like magic!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export default ping;
