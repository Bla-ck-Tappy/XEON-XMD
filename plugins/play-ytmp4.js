import axios from "axios";
import config from "../../config.cjs";

const downloadStore = new Map();

const playHandler = async (msg, sock) => {
  try {
    const prefix = config.PREFIX || ".";
    const from = msg?.from;
    const body = msg?.body?.trim();
    if (!from || !sock || (!body?.startsWith(prefix) && !downloadStore.has(from))) return;

    const command = body.startsWith(prefix) ? body.slice(prefix.length).split(" ")[0].toLowerCase() : null;
    const query = command ? body.slice(prefix.length + command.length).trim() : null;

    if (command === "yt") {
      if (!query) {
        await sock.sendMessage(from, { text: "❌ Please provide a search term or YouTube URL!" }, { quoted: msg });
        if (msg.React) await msg.React("❌");
        return;
      }

      if (msg.React) await msg.React("⏳");

      let videoUrl = query;
      const ytUrlRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//;
      let searchUsed = false;

      if (!ytUrlRegex.test(query)) {
        // 🔍 Accurate YouTube Search
        const searchRes = await axios.get("https://api.princetechn.com/api/search/ytsearch", {
          params: {
            apikey: config.PRINCETECH_APIKEY || "prince_api_tjhv",
            query
          }
        });

        const results = searchRes.data?.result || [];
        const best = results.find(v => v.title?.toLowerCase().includes(query.toLowerCase()));

        if (!best || !best.url) throw new Error(`No accurate match found for: ${query}`);
        videoUrl = best.url;
        searchUsed = true;
      }

      // 🎧 Download MP3
      const mp3Res = await axios.get(`https://api.princetechn.com/api/download/yta`, {
        params: {
          apikey: config.PRINCETECH_APIKEY || "prince_api_tjhv",
          url: videoUrl
        }
      });

      const res = mp3Res.data?.result;
      if (!res?.download_url) throw new Error("Failed to fetch MP3");

      const mp3Meta = {
        title: res.title || query,
        url: videoUrl,
        image: res.thumbnail || "https://i.imgur.com/QpS1G4i.jpeg",
        timestamp: res.duration || "Unknown",
        views: "N/A",
        author: {
          name: res.author || "Unknown Artist"
        }
      };

      // Optional: Try fallback MP4
      let videoData = null;
      try {
        const fallback = await axios.get("https://iamtkm.vercel.app/downloaders/ytmp4?url=" + encodeURIComponent(videoUrl));
        const data = fallback.data?.data;
        if (!data?.url) throw new Error("Fallback MP4 failed");
        videoData = {
          title: mp3Meta.title,
          thumbnail: mp3Meta.image,
          download_url: data.url,
          quality: "Unknown (fallback)"
        };
      } catch {
        videoData = null;
      }

      // Store download session
      if (downloadStore.has(from)) clearTimeout(downloadStore.get(from).timeout);
      const timeout = setTimeout(() => downloadStore.delete(from), 3 * 60 * 1000);
      downloadStore.set(from, {
        title: mp3Meta.title,
        mp3Url: res.download_url,
        mp3Meta,
        videoData,
        timeout
      });

      await sock.sendMessage(from, {
        image: { url: mp3Meta.image },
        caption:
`
╭─❍「 ᴍᴜsɪᴄ ᴅᴇᴛᴀɪʟs 」❍─╮
┃🎧 *Now Playing↻ ◁ II ▷ ↻*
┃🎵 *Title:* ${mp3Meta.title}
┃⌛ *Duration:* ${mp3Meta.timestamp}
┃🎤 *Artist:* ${mp3Meta.author.name}
╰─────────────────╯

📥 *Download Options:*
╭───────────────╮
│ 1️⃣ Audio
│ 2️⃣ Document MP3
│ 3️⃣ Document MP4
│ 4️⃣ Video Stream
│ 5️⃣ Voice Note
╰───────────────╯

💬 _Reply with a number (1–5)_
🕒 _Expires in 3 minutes_

🔋 ᴘᴏᴡᴇʀᴇᴅ ʙʏ *ʙʟᴀᴄᴋ-ᴛᴀᴘᴘʏ*`,
        contextInfo: {
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363369453603973@newsletter",
            newsletterName: "ᴘʟᴀʏɪɴɢ ᴠɪᴀ xᴇᴏɴ-xᴛᴇᴄʜ ʙᴏᴛ",
            serverMessageId: -1
          },
          externalAdReply: {
            title: mp3Meta.title,
            body: "Download Menu • ↻ ◁ II ▷ ↺",
            thumbnailUrl: mp3Meta.image,
            sourceUrl: mp3Meta.url,
            mediaType: 1
          }
        }
      }, { quoted: msg });

      if (msg.React) await msg.React("✅");
      return;
    }

    // Process reply options 1–5
    if (/^[1-5]$/.test(body) && downloadStore.has(from)) {
      const choice = parseInt(body);
      const { title, mp3Url, mp3Meta, videoData } = downloadStore.get(from);

      const sendOptions = {
        1: {
          audio: { url: mp3Url },
          mimetype: "audio/mpeg"
        },
        2: {
          document: { url: mp3Url },
          fileName: `${title}.mp3`,
          mimetype: "audio/mpeg"
        },
        3: videoData ? {
          document: { url: videoData.download_url },
          fileName: `${videoData.title}.mp4`,
          mimetype: "video/mp4"
        } : { text: "❌ Video unavailable." },
        4: videoData ? {
          video: { url: videoData.download_url },
          caption: `🎥 *${videoData.title}*`,
          mimetype: "video/mp4"
        } : { text: "❌ Video unavailable." },
        5: {
          audio: { url: mp3Url },
          mimetype: "audio/mpeg",
          ptt: true
        }
      };

      await sock.sendMessage(from, sendOptions[choice], { quoted: msg });
      if (msg.React) await msg.React("✅");
      downloadStore.delete(from); // auto clear
      return;
    }

  } catch (err) {
    console.error("yt error:", err);
    await sock.sendMessage(msg.from, {
      text: `❌ Something went wrong: ${err?.message || "Unknown error"}`
    }, { quoted: msg });
    if (msg.React) await msg.React("❌");
  }
};

export default playHandler;
