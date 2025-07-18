
import config from '../../config.cjs';
import fetch from 'node-fetch';

const POWERED_BY = '> Powered By Black-Tappy';
const BOT_NAME = 'xᴇᴏɴ-xᴛᴇᴄʜ';

const downloadCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const fetchJson = async (url) => {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error("Error fetching JSON:", error);
      throw error;
    }
  };

  // Instagram Download
  if (['ig2', 'insta2', 'instagram2'].includes(cmd)) {
    try {
      if (!text || !text.startsWith('http')) return m.reply('❌ *Please provide a valid Instagram link!*');

      await Matrix.sendMessage(m.from, { react: { text: '⏳', key: m.key } });

      const data = await fetchJson(`https://api.davidcyriltech.my.id/instagram?url=${encodeURIComponent(text)}`);

      if (!data || data.status !== 200 || !data.downloadUrl)
        return m.reply('⚠️ *Unable to fetch the Instagram video. Try again!*');

      const caption = `
╭───⧉  *Instagram Downloader*
│✅
│🟢  *Status:*  Success ✅
│📂  *Type:*  Video
│🔧
╰────⟡ *Xeon-AI Instagram Panel*
${POWERED_BY}`;

      await Matrix.sendMessage(m.from, {
        video: { url: data.downloadUrl },
        mimetype: 'video/mp4',
        caption: caption.trim()
      }, { quoted: m });

      await Matrix.sendMessage(m.from, { react: { text: '✅', key: m.key } });

    } catch (error) {
      console.error("IG Error:", error);
      m.reply('❌ *An error occurred while processing Instagram link.*');
    }
  }

  // Twitter Download
  if (['twitter', 'tweet', 'twdl'].includes(cmd)) {
    try {
      if (!text || !text.startsWith('https://')) return m.reply('❌ *Please provide a valid Twitter link!*');

      await Matrix.sendMessage(m.from, { react: { text: '⏳', key: m.key } });

      const data = await fetchJson(`https://www.dark-yasiya-api.site/download/twitter?url=${encodeURIComponent(text)}`);

      if (!data || !data.status || !data.result) return m.reply('⚠️ *Failed to retrieve Twitter video!*');

      const { desc, thumb } = data.result;

      const caption = `
╭───⧉  *🐦 Tweeter Downloader*
│🛠️  *Description:*  ${desc || 'No description'}
│📥  *Options:*
│    1. SD Video
│    2. HD Video
│    3. Audio
│    4. Document
│    5. Voice
╰────⟡ *Xeon-AI Tweeter Panel*
➥ *Reply with a number to download.*
${POWERED_BY}`;

      await Matrix.sendMessage(m.from, {
        image: { url: thumb },
        caption: caption.trim()
      }, { quoted: m });

    } catch (error) {
      console.error("Twitter Error:", error);
      m.reply('❌ *An error occurred while processing Twitter link.*');
    }
  }

  // MediaFire Download
  if (['mediafire2', 'mfire'].includes(cmd)) {
    try {
      if (!text) return m.reply('❌ *Provide a valid MediaFire link!*');

      await Matrix.sendMessage(m.from, { react: { text: '⏳', key: m.key } });

      const data = await fetchJson(`https://www.dark-yasiya-api.site/download/mfire?url=${encodeURIComponent(text)}`);

      if (!data || !data.status || !data.result || !data.result.dl_link)
        return m.reply('⚠️ *Failed to fetch MediaFire download link.*');

      const { dl_link, fileName, fileType } = data.result;

      const caption = `
╭───⧉  *Mediafire Downloader*
│✅
│📂  *File:*  ${fileName}
│📦  *Type:*  ${fileType || 'Unknown'}
│🔧
╰────⟡ *Xeon-AI Mediafire Panel*
${POWERED_BY}`;

      await Matrix.sendMessage(m.from, {
        document: { url: dl_link },
        mimetype: fileType || 'application/octet-stream',
        fileName: fileName,
        caption: caption.trim()
      }, { quoted: m });

      await Matrix.sendMessage(m.from, { react: { text: '✅', key: m.key } });

    } catch (error) {
      console.error("Mediafire Error:", error);
      m.reply('❌ *Error occurred during MediaFire download.*');
    }
  }

  // APK Download
  if (cmd === 'apk') {
    try {
      if (!text) return m.reply('❌ *Please provide an app name to search!*');

      await Matrix.sendMessage(m.from, { react: { text: '⏳', key: m.key } });

      const data = await fetchJson(`http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(text)}/limit=1`);

      if (!data || !data.datalist || !data.datalist.list.length)
        return m.reply('⚠️ *No apps found with the given name.*');

      const app = data.datalist.list[0];
      const appSize = (app.size / 1048576).toFixed(2); // MB

      const caption = `
╭───⧉  *Apk Downloader*
│✅
│🗃️  *Name:*  ${app.name}
│📥  *Size:*  ${appSize} MB
│📦  *Package:*  ${app.package}
│🔁  *Updated:*  ${app.updated}
│👨‍💻  *Dev:*  ${app.developer.name}
│🔧
╰────⟡ *Xeon-AI Apk Panel*
${config.CAPTION}`;

      await Matrix.sendMessage(m.from, {
        document: { url: app.file.path_alt },
        fileName: `${app.name}.apk`,
        mimetype: 'application/vnd.android.package-archive',
        caption: caption.trim()
      }, { quoted: m });

      await Matrix.sendMessage(m.from, { react: { text: '✅', key: m.key } });

    } catch (error) {
      console.error("APK Error:", error);
      m.reply('❌ *Error occurred while fetching APK.*');
    }
  }

  // Google Drive Download
  if (cmd === 'gdrive') {
    try {
      if (!text) return m.reply('❌ *Provide a valid Google Drive link!*');

      await Matrix.sendMessage(m.from, { react: { text: '⬇️', key: m.key } });

      const data = await fetchJson(`https://api.fgmods.xyz/api/downloader/gdrive?url=${encodeURIComponent(text)}&apikey=mnp3grlZ`);

      if (!data.result || !data.result.downloadUrl)
        return m.reply('⚠️ *No downloadable file found from GDrive!*');

      const caption = `
╭───⧉  *Gdrive Downloader*
│✅
│📂  *File:*  ${data.result.fileName}
│📥  *Size:*  ${data.result.fileSize || 'Unknown'}
│🔧
╰────⟡ *Xeon-AI Gdrive Panel*
${POWERED_BY}`;

      await Matrix.sendMessage(m.from, {
        document: { url: data.result.downloadUrl },
        fileName: data.result.fileName,
        mimetype: data.result.mimetype || 'application/octet-stream',
        caption: caption.trim()
      }, { quoted: m });

      await Matrix.sendMessage(m.from, { react: { text: '✅', key: m.key } });

    } catch (error) {
      console.error("GDrive Error:", error);
      m.reply('❌ *Error occurred while downloading from GDrive.*');
    }
  }
};

export default downloadCommand;
