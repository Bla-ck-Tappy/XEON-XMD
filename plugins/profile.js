import config from '../../config.cjs';

const profileCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === 'profile') {
    let sender = m.quoted ? m.quoted.sender : m.sender;
    let name = m.quoted ? "@" + sender.split("@")[0] : m.pushName;

    let ppUrl;
    try {
      ppUrl = await Matrix.profilePictureUrl(sender, 'image');
    } catch {
      ppUrl = "https://telegra.ph/file/95680cd03e012bb08b9e6.jpg";
    }

    let status;
    try {
      status = await Matrix.fetchStatus(sender);
    } catch (error) {
      status = { status: "About not accessible due to user privacy" };
    }

    const mess = {
      image: { url: ppUrl },
      caption: `🤦 Name: ${name}\n🔗 About:\n${status.status}\n\n*⏩ Powered By Black-Tappy*`,
      ...(m.quoted ? { mentions: [sender] } : {}) // Mention only if quoted
    };

    await Matrix.sendMessage(m.from, mess, { quoted: m });
  }
};

export default profileCommand;
