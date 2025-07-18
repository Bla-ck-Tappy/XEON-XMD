import axios from 'axios';
import config from '../../config.cjs'; // Assuming config.cjs is in the parent directory

const chatbotcommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  // Check if the sender is the bot owner or the bot itself
  const isCreator = [botNumber, config.OWNER_NUMBER + "@s.whatsapp.net"].includes(m.sender);
  const prefix = config.PREFIX;

  // Extract command and arguments
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : '';
  const args = m.body.slice(prefix.length + cmd.length).trim().split(/\s+/);
  const subCommand = args[0] ? args[0].toLowerCase() : '';
  const toggleState = args[1] ? args[1].toLowerCase() : ''; // 'on' or 'off'

  // Handle 'chatbot' command to toggle the feature
  if (cmd === 'chatbot') {
    if (!isCreator) {
      return m.reply("😂 *Access Denied*\n_Only bot owner can toggle this feature._");
    }

    let responseMessage;

    switch (subCommand) {
      case 'on':
        config.CHATBOT_PRIVATE = true;
        config.CHATBOT_GROUP = true;
        responseMessage = "🟢 Chatbot has been *enabled* for both private and group chats. I'm now live!";
        break;
      case 'off':
        config.CHATBOT_PRIVATE = false;
        config.CHATBOT_GROUP = false;
        responseMessage = "🔴 Chatbot has been *disabled* for both private and group chats. I'll turn off 📴.";
        break;
      case 'private':
        if (toggleState === 'on') {
          config.CHATBOT_PRIVATE = true;
          responseMessage = "🟢 Chatbot has been *enabled* for private chats.";
        } else if (toggleState === 'off') {
          config.CHATBOT_PRIVATE = false;
          responseMessage = "🔴 Chatbot has been *disabled* for private chats.";
        } else {
          responseMessage = `💡 *Chatbot Usage:*\n\n• ${prefix}chatbot private on\n• ${prefix}chatbot private off`;
        }
        break;
      case 'group':
        if (toggleState === 'on') {
          config.CHATBOT_GROUP = true;
          responseMessage = "🟢 Chatbot has been *enabled* for group chats.";
        } else if (toggleState === 'off') {
          config.CHATBOT_GROUP = false;
          responseMessage = "🔴 Chatbot has been *disabled* for group chats.";
        } else {
          responseMessage = `💡 *Chatbot Usage:*\n\n• ${prefix}chatbot group on\n• ${prefix}chatbot group off`;
        }
        break;
      default:
        responseMessage = `💡 *Chatbot Usage:*\n\n` +
          `• ${prefix}chatbot on: Enable for all chats\n` +
          `• ${prefix}chatbot off: Disable for all chats\n` +
          `• ${prefix}chatbot private on: Enable for private chats\n` +
          `• ${prefix}chatbot private off: Disable for private chats\n` +
          `• ${prefix}chatbot group on: Enable for group chats\n` +
          `• ${prefix}chatbot group off: Disable for group chats`;
        break;
    }

    // Send the response for the command
    return await Matrix.sendMessage(m.from, {
      text: responseMessage,
      contextInfo: {
        forwardingScore: 10,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363369453603973@newsletter",
          newsletterName: '𝐗ҽσɳ-𝐗ƚҽƈ𝐡'
        }
      }
    }, {
      quoted: m
    });
  }

  // Determine if the chatbot should process the current message based on chat type settings
  const remoteJid = m.key.remoteJid;
  const isGroup = remoteJid.endsWith("@g.us");

  let shouldProcessChatbot = false;

  if (isGroup) {
    if (config.CHATBOT_GROUP) {
      // For groups, still require mention or reply to bot
      const botMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(Matrix.user.id);
      const botReplied = m.message?.extendedTextMessage?.contextInfo?.participant === Matrix.user.id;
      const isReplyToBotMessage = m.message?.extendedTextMessage?.contextInfo?.stanzaId && botReplied;

      if (botMentioned || botReplied || isReplyToBotMessage) {
        shouldProcessChatbot = true;
      }
    }
  } else { // Private chat
    if (config.CHATBOT_PRIVATE) {
      shouldProcessChatbot = true;
    }
  }

  // If chatbot is enabled for this chat type and conditions are met, process the message
  if (shouldProcessChatbot) {
    // Ignore messages from the bot itself or empty messages
    if (!m.message || m.key.fromMe) {
      return;
    }

    const participantJid = m.key.participant || remoteJid; // Use participant for group, remoteJid for private
    const messageContent = m.body || '';

    // --- Chat History Management ---
    global.userChats = global.userChats || {};
    global.userChats[participantJid] = global.userChats[participantJid] || [];

    // Add user's message to history
    global.userChats[participantJid].push("👤 User: " + messageContent);

    // Keep history limited to prevent excessive length
    if (global.userChats[participantJid].length > 15) {
      global.userChats[participantJid].shift(); // Remove oldest message
    }

    const chatHistoryString = global.userChats[participantJid].join("\n");

    // System prompt for the AI
    const systemPrompt = `You are *Xeon-Xtech*, a smart and helpful AI WhatsApp bot created by Black-Tappy. Your job is to provide accurate, conversational, and friendly responses.

🧠 *Chat History:*\n${chatHistoryString}`;

    // --- API Call to Groq ---
    try {
      // Validate API key presence
      if (!config.GROQ_API_KEY) {
        console.error("GROQ_API_KEY is not set. Please provide it in your config.");
        // Optionally, send a message to the owner about the missing key
        if (isCreator) { // Only inform owner to avoid spamming
            await Matrix.sendMessage(m.from, { text: "⚠️ Chatbot API key (GROQ_API_KEY) is missing. Please set it in your config to enable full functionality." }, { quoted: m });
        }
        return; // Stop execution if API key is missing
      }

      // Do not send empty messages to the API
      if (!messageContent.trim()) {
        return;
      }

      const { data: groqResponse } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama3-70b-8192", // Using the specified model
        messages: [{
          role: 'system',
          content: systemPrompt
        }, {
          role: "user",
          content: messageContent
        }]
      }, {
        headers: {
          'Authorization': "Bearer " + config.GROQ_API_KEY,
          'Content-Type': "application/json"
        }
      });

      const chatbotResponse = groqResponse.choices?.[0]?.message?.content || "🤖 Sorry, I didn’t get that.";

      // Add bot's response to history
      global.userChats[participantJid].push("🤖 Bot: " + chatbotResponse);

      // Send the chatbot's response
      await Matrix.sendMessage(remoteJid, {
        text: chatbotResponse,
        contextInfo: {
          forwardingScore: 5,
          isForwarded: true,
        }
      }, {
        quoted: m
      });

    } catch (error) {
      console.error("Groq API error:", error.response?.data || error.message);
      // Send a user-friendly error message, not the raw error
      await Matrix.sendMessage(m.from, {
        text: "⚠️ Error getting response from chatbot. Please try again later.",
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
        }
      }, {
        quoted: m
      });
    }
  }
};

export default chatbotcommand;
