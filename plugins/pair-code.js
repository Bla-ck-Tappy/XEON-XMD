import axios from 'axios';
import config from '../../config.cjs'; 
const sessionGen = async (m, sock) => {

  const whatsappChannelLink = 'https://whatsapp.com/channel/YOUR_CHANNEL_ID'; 

  // Retrieve the command prefix from the configuration.
  const prefix = config.PREFIX;

  // Determine the command and the text content from the message body
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim(); // Extract text after command.
  const senderName = m.pushName || 'User'; // Get sender's name or default to 'User'.

  // If the command is not 'pair', exit the function.
  if (cmd !== 'pair') return;

  // Validate the input text (phone number).
  if (!text || !/^\+?\d{9,15}$/.test(text)) {
    await sock.sendMessage(m.from, {
      text: `🔴 *Invalid Format!*\n\n🟢 Example: *.pair +254759000340*`,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
          newsletterJid: "120363369453603973@newsletter",
        },
        // Added externalAdReply for the invalid format message
        externalAdReply: {
          title: "xᴇᴏɴ-xᴛᴇᴄʜ ʙᴏᴛ",
          body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙʟᴀᴄᴋ-ᴛᴀᴘᴘʏ",
          thumbnailUrl: 'https://files.catbox.moe/6g5aq0.jpg',
          sourceUrl: whatsappChannelLink,
          mediaType: 1, // Typically 1 for image, 2 for video, etc.
          renderLargerThumbnail: false,
        },
      },
    }, { quoted: m }); // Reply to the original message.
    return;
  }

  try {
    const response = await axios.get(`https://xeon-xtech-pair-case.onrender.com/pair?number=${encodeURIComponent(text)}`);
    const { code } = response.data; // Expecting the API to return JSON with a 'code' property.
    if (!code) throw new Error("😕 No code returned from the server.");

    // Send a success message with the generated pairing code and an image.
    await sock.sendMessage(m.from, {
      image: { url: 'https://files.catbox.moe/8k0enh.jpg' }, // Image URL for the message.
      caption: `🟢 *Pairing Code Generated!*\n\n👤 Number: ${text}\n🔐 Code: *${code}*\n\nUse this on your bot plugins or CLI to connect the number.`,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
          newsletterJid: "120363369453603973@newsletter",
        },
        // Added externalAdReply for the success message
        externalAdReply: {
          title: "xᴇᴏɴ-xᴛᴇᴄʜ ʙᴏᴛ",
          body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙʟᴀᴄᴋ-ᴛᴀᴘᴘʏ",
          thumbnailUrl: 'https://files.catbox.moe/6g5aq0.jpg',
          sourceUrl: whatsappChannelLink,
          mediaType: 1,
          renderLargerThumbnail: false,
        },
      },
    }, { quoted: m }); // Reply to the original message.

  } catch (err) {
    // Log the error for server-side debugging.
    console.error(`Error generating pairing code: ${err.message}`);

    // Send an error message to the user, providing details if available.
    await sock.sendMessage(m.from, {
      text: `🔴 *Failed to generate pairing code.*\n\nReason: ${err.response?.data?.error || err.message || 'An unknown error occurred.'}`,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "ꊼεɸƞ-ꊼԵεϲཏ",
          newsletterJid: "120363369453603973@newsletter",
        },
        // Added externalAdReply for the error message
        externalAdReply: {
          title: "ꊼεɸƞ-ꊼԵεϲཏ ႪɸԵ",
          body: "Powered By Black-Tappy",
          thumbnailUrl: 'https://files.catbox.moe/6g5aq0.jpg',
          sourceUrl: whatsappChannelLink,
          mediaType: 1,
          renderLargerThumbnail: false,
        },
      },
    }, { quoted: m }); // Reply to the original message.
  }
};

export default sessionGen;
