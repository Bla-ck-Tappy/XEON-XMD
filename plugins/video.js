import _0x4f4f24 from 'axios';
import _0x16850f from 'yt-search';
import _0xc38dd8 from '../../config.cjs';
const videoCommand = async (_0x3d50be, _0xc2eee) => {
  const _0x178ec4 = _0xc38dd8.PREFIX || '!';
  const _0x39d40d = _0x3d50be.body.startsWith(_0x178ec4) ? _0x3d50be.body.slice(_0x178ec4.length).split(" ")[0x0].toLowerCase() : '';
  const _0xdfa127 = _0x3d50be.body.slice(_0x178ec4.length + _0x39d40d.length).trim();
  if (!["video", "ytmp4", 'v'].includes(_0x39d40d)) {
    return;
  }
  if (!_0xdfa127) {
    return await _0xc2eee.sendMessage(_0x3d50be.from, {
      'text': "🔴 Please provide a video name or keyword!",
      'contextInfo': {
        'forwardingScore': 0x5,
        'isForwarded': true,
        'forwardedNewsletterMessageInfo': {
          'newsletterJid': "120363369453603973@newsletter",
          'newsletterName': "𝐗ҽσɳ-𝐗ƚҽƈ𝐡"
        }
      }
    }, {
      'quoted': _0x3d50be
    });
  }
  if (typeof _0x3d50be.React === "function") {
    await _0x3d50be.React('🔍');
  }
  try {
    const _0x25f413 = await _0x16850f(_0xdfa127);
    const _0x285b1c = _0x25f413.videos?.[0x0];
    if (!_0x285b1c) {
      throw new Error("No video found");
    }
    let _0x4492f1;
    try {
      const _0x3d8a56 = await _0x4f4f24.get('https://apis.davidcyriltech.my.id/download/ytmp4?url=' + encodeURIComponent(_0x285b1c.url));
      const _0x25a2f6 = _0x3d8a56.data.result;
      if (!_0x25a2f6?.["download_url"]) {
        throw new Error("Primary failed");
      }
      _0x4492f1 = {
        'title': _0x25a2f6.title,
        'thumbnail': _0x25a2f6.thumbnail,
        'download_url': _0x25a2f6.download_url,
        'quality': _0x25a2f6.quality || "Unknown"
      };
    } catch {
      const _0x4404ef = await _0x4f4f24.get("https://iamtkm.vercel.app/downloaders/ytmp4?url=" + encodeURIComponent(_0x285b1c.url));
      const _0x234bf6 = _0x4404ef.data?.['data'];
      if (!_0x234bf6?.["url"]) {
        throw new Error("Fallback failed");
      }
      _0x4492f1 = {
        'title': _0x234bf6.title || _0x285b1c.title,
        'thumbnail': _0x285b1c.thumbnail,
        'download_url': _0x234bf6.url,
        'quality': "Unknown (fallback)"
      };
    }
    const _0x574fa2 = {
      'image': {
        'url': _0x4492f1.thumbnail
      },
      'caption': "╭────「 *🎬 Video Preview* 」\n│  📌 Title: " + _0x4492f1.title + "\n│  ⏱️ Duration: " + _0x285b1c.timestamp + "\n│  👁️ Views: " + _0x285b1c.views + "\n│  📺 Quality: " + _0x4492f1.quality + "\n│  📅 Published: " + _0x285b1c.ago + "\n╰───────────────⊷",
      'contextInfo': {
        'forwardingScore': 0x5,
        'isForwarded': true,
        'externalAdReply': {
          'title': "xᴇᴏɴ-xᴛᴇᴄʜ ᴠɪᴅᴇᴏ",
          'body': "Streaming via Xeon-Xtech Bot",
          'thumbnailUrl': 'https://files.catbox.moe/8k0enh.jpg',
          'sourceUrl': _0x285b1c.url,
          'mediaType': 0x1,
          'renderLargerThumbnail': true
        },
        'forwardedNewsletterMessageInfo': {
          'newsletterJid': "120363369453603973@newsletter",
          'newsletterName': "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
          'serverMessageId': -0x1
        }
      }
    };
    await _0xc2eee.sendMessage(_0x3d50be.from, _0x574fa2, {
      'quoted': _0x3d50be
    });
    const _0x455f5f = {
      'video': {
        'url': _0x4492f1.download_url
      },
      'mimetype': "video/mp4",
      'caption': "🎥 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙʟᴀᴄᴋ-ᴛᴀᴘᴘʏ ʙᴏᴛ\nStreaming now ↻ ◁ II ▷ ↺",
      'contextInfo': {
        'forwardingScore': 0x5,
        'isForwarded': true,
        'externalAdReply': {
          'title': "xᴇᴏɴ-xᴛᴇᴄʜ ʙᴏᴛ",
          'body': "Streaming now ↻ ◁ II ▷ ↺",
          'thumbnailUrl': _0x4492f1.thumbnail,
          'sourceUrl': _0x285b1c.url,
          'mediaType': 0x1,
          'renderLargerThumbnail': true
        },
        'forwardedNewsletterMessageInfo': {
          'newsletterJid': "120363369453603973@newsletter",
          'newsletterName': "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
          'serverMessageId': -0x1
        }
      }
    };
    await _0xc2eee.sendMessage(_0x3d50be.from, _0x455f5f, {
      'quoted': _0x3d50be
    });
    if (typeof _0x3d50be.React === "function") {
      await _0x3d50be.React('✅');
    }
  } catch (_0x15a935) {
    console.error(_0x15a935);
    await _0xc2eee.sendMessage(_0x3d50be.from, {
      'text': "🔴 An unexpected error occurred! Try again later.",
      'contextInfo': {
        'forwardingScore': 0x5,
        'isForwarded': true,
        'forwardedNewsletterMessageInfo': {
          'newsletterJid': "120363369453603973@newsletter",
          'newsletterName': "𝐗ҽσɳ-𝐗ƚҽƈ𝐡"
        }
      }
    }, {
      'quoted': _0x3d50be
    });
    if (typeof _0x3d50be.React === 'function') {
      await _0x3d50be.React('❌');
    }
  }
};
export default videoCommand;