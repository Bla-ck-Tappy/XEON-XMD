import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const MAX_FILE_SIZE_MB = 200;

async function uploadMedia(buffer) {
  try {
    const { ext } = await fileTypeFromBuffer(buffer);
    const form = new FormData();
    form.append('fileToUpload', buffer, `file.${ext}`);
    form.append('reqtype', 'fileupload');

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Unable to upload the file. Please try again later.');
  }
}

function getMediaType(mtype) {
  switch (mtype) {
    case 'imageMessage': return 'image';
    case 'videoMessage': return 'video';
    case 'audioMessage': return 'audio';
    default: return null;
  }
}

const tourl = async (m, bot) => {
  const prefix = (m.body.match(/^[\\/!#.]/) || ["/"])[0];
  const cmd = m.body.slice(prefix.length).split(" ")[0].toLowerCase();
  const validCommands = ['url', 'geturl', 'upload', 'u'];

  if (!validCommands.includes(cmd)) return;

  if (!m.quoted || !['imageMessage', 'videoMessage', 'audioMessage'].includes(m.quoted.mtype)) {
    return m.reply(`Please reply to an *image*, *video*, or *audio* file to upload.\n\nUsage: *${prefix + cmd}*`);
  }

  try {
    const media = await m.quoted.download();
    if (!media) throw new Error('Media download failed.');

    const fileSizeMB = media.length / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return m.reply(`The file exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`);
    }

    const mediaUrl = await uploadMedia(media);
    const mediaType = getMediaType(m.quoted.mtype);
    const mediaTypeName = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);

    const contextInfo = {
      forwardingScore: 5,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterName: "𝐗ҽσɳ-𝐗ƚҽƈ𝐡",
        newsletterJid: "120363369453603973@newsletter",
      },
    };

    const caption = 
`╭───〔 🔗 Media Uploaded 〕
│ 📁 Type: ${mediaTypeName}
│ 🌐 URL:
│ ${mediaUrl}
╰──── Powered by Black-Tappy`;

    if (mediaType === 'audio') {
      await bot.sendMessage(m.from, {
        text: caption,
        contextInfo,
      }, { quoted: m });
    } else {
      await bot.sendMessage(m.from, {
        [mediaType]: { url: mediaUrl },
        caption,
        contextInfo,
      }, { quoted: m });
    }
  } catch (err) {
    console.error('Processing error:', err);
    m.reply('❌ An error occurred while processing your media.');
  }
};

export default tourl;
