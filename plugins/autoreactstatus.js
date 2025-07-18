import config from '../../config.cjs';

// Main command function
const anticallCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  // Ensure OWNER_NUMBER is correctly formatted for comparison, assuming it's just the number
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();
  
  // Updated validCommands to include 'autoreactstatus'
  const validCommands = ['autoreactstatus']; // Removed 'autolike', 'autoslike' as per request

  if (validCommands.includes(cmd)){
    if (!isCreator) return m.reply("*⛔ THIS IS AN OWNER COMMAND*");
    let responseMessage;

    if (text === 'on') {
      // Changed to control AUTO_STATUS_REACT
      config.AUTO_STATUS_REACT = 'true'; // Set as string 'true' as it's likely read as string from env
      responseMessage = "🟢 AUTO STATUS REACT has been enabled.";
    } else if (text === 'off') {
      // Changed to control AUTO_STATUS_REACT
      config.AUTO_STATUS_REACT = 'false'; // Set as string 'false'
      responseMessage = "🔴 AUTO STATUS REACT has been disabled.";
    } else {
      // Updated usage message for autoreactstatus
      responseMessage = `Usage:\n- *${prefix + cmd} on:* Enable AUTO STATUS REACT\n- *${prefix + cmd} off:* Disable AUTO STATUS REACT`;
    }

    try {
      await Matrix.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, { text: 'Error processing your request.' }, { quoted: m });
    }
  }
};

export default anticallCommand;
