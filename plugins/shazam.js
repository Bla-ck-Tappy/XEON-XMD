import fs from 'fs';
import acrcloud from 'acrcloud';
import config from '../../config.cjs';

const acr = new acrcloud({
  host: 'identify-eu-west-1.acrcloud.com',
  access_key: '716b4ddfa557144ce0a459344fe0c2c9',
  access_secret: 'Lz75UbI8g6AzkLRQgTgHyBlaQq9YT5wonr3xhFkf'
});

const shazam = async (m, sock) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix)
      ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
      : '';

    const validCommands = ['shazam', 'find', 'whatmusic'];
    if (!validCommands.includes(cmd)) return;

    // Ensure a message is quoted
    if (!m.quoted) {
      return sock.sendMessage(m.from, {
        text: `🎧 *Music ID Request*\n\nPlease reply to a music audio or video file.\n_Example:_ *.shazam*`,
        contextInfo: {
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
            newsletterJid: "120363369453603973@newsletter",
          },
        }
      }, { quoted: m });
    }

    // Get mimetype of quoted media
    const mime = m.quoted.mimetype || '';
    const isAcceptable = mime.startsWith('audio') || mime.startsWith('video') || mime === 'application/octet-stream';

    if (!isAcceptable) {
      return sock.sendMessage(m.from, {
        text: `🎧 *Music ID Request*\n\nQuoted file must be an *audio*, *video*, or *song file* (e.g. .mp3)\n_Example:_ reply to a voice note or song with *.shazam*`,
        contextInfo: {
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
            newsletterJid: "120363369453603973@newsletter",
          },
        }
      }, { quoted: m });
    }

    const mediaBuffer = await m.quoted.download();
    const filePath = `./tmp-${Date.now()}.mp3`;
    fs.writeFileSync(filePath, mediaBuffer);

    await sock.sendMessage(m.from, {
      text: '🔍 *Analyzing the audio...*\nPlease wait...',
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "Popkid-Xmd",
          newsletterJid: "120363369453603973@newsletter",
        },
      }
    }, { quoted: m });

    const result = await acr.identify(fs.readFileSync(filePath));
    fs.unlinkSync(filePath); // Clean up

    const { code, msg } = result.status;
    if (code !== 0 || !result.metadata?.music?.length) {
      throw new Error(msg || 'No match found');
    }

    const music = result.metadata.music[0];
    const {
      title,
      artists,
      album,
      genres,
      release_date,
      external_metadata
    } = music;

    const youtube = external_metadata?.youtube?.vid;
    const spotify = external_metadata?.spotify?.track?.external_urls?.spotify;

    const resultText = 
      `🎶 *Diving 🤿 into the 🎵 musical ✨ world 🌍 to fetch...!*\n\n` +
      `• 📌 *Title:* ${title || 'Unknown'}\n` +
      `• 👤 *Artist:* ${artists?.map(a => a.name).join(', ') || 'Unknown'}\n` +
      `• 💿 *Album:* ${album?.name || 'Unknown'}\n` +
      `• 🎼 *Genre:* ${genres?.map(g => g.name).join(', ') || 'Unknown'}\n` +
      `• 📅 *Release:* ${release_date || 'Unknown'}\n\n` +
      (youtube ? `▶️ *YouTube:* https://youtu.be/${youtube}\n` : '') +
      (spotify ? `🎧 *Spotify:* ${spotify}\n` : '') +
      `\n✅ _Powered by Black-Tappy_`;

    await sock.sendMessage(m.from, {
      text: resultText,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
          newsletterJid: "120363369453603973@newsletter",
        },
      }
    }, { quoted: m });

  } catch (err) {
    console.error('Shazam Error:', err);
    await sock.sendMessage(m.from, {
      text: '⚠️ *Music not identified.* Please ensure it’s a valid and clear audio sample.',
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
          newsletterJid: "120363369453603973@newsletter",
        },
      }
    }, { quoted: m });
  }
};

export default shazam;
