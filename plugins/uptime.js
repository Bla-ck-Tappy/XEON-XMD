import moment from "moment-timezone";
import config from "../../config.cjs";

const uptime = async (m, sock) => {
  try {
    const prefix = config.PREFIX || ".";
    const body = m.body || "";
    const cmd = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";

    // Only respond to the exact command
    if (cmd !== "uptime") return;

    await m.React("⏳");

    // Calculate uptime
    const uptimeSec = process.uptime();
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = Math.floor(uptimeSec % 60);

    // Get current time in Nairobi timezone
    const currentTime = moment().tz("Africa/Nairobi").format("HH:mm:ss");
    let greeting = "Hello 👋";
    if (currentTime < "05:00:00") greeting = "Good Morning 🌄";
    else if (currentTime < "11:00:00") greeting = "Good Morning 🌄";
    else if (currentTime < "15:00:00") greeting = "Good Afternoon 🌅";
    else if (currentTime < "19:00:00") greeting = "Good Evening 🌆";
    else greeting = "Good Night 🌌";

    await m.React("⚡");

    // Defining whatsappChannelLink with the original source URL as it was not defined.
    const whatsappChannelLink = "https://whatsapp.com/channel/0029VasHgfG4tRrwjAUyTs10";

    await sock.sendMessage(m.from, {
      audio: { url: "https://files.catbox.moe/ucmkut.mp3" },
      mimetype: "audio/mp4",
      ptt: true,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363369453603973@newsletter",
          newsletterName: "ꊼεɸƞ-ꊼԵεϲཏ",
          serverMessageId: 143
        },
        externalAdReply: { // The existing externalAdReply object is replaced with the new one.
          title: "ꊼεɸƞ-ꊼԵεϲཏ ႪɸԵ",
          body: "Powered By Black-Tappy",
          thumbnailUrl: 'https://files.catbox.moe/6g5aq0.jpg',
          sourceUrl: whatsappChannelLink, // Using the defined whatsappChannelLink
          mediaType: 1,
          renderLargerThumbnail: false, // Changed from true to false as per the new definition
        },
      },
    }, { quoted: m });

  } catch (err) {
    console.error("Uptime command error:", err);
    await m.reply("❌ Error while fetching uptime.");
  }
};

export default uptime;
