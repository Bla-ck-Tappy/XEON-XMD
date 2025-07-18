import moment from 'moment-timezone';
import config from '../../config.cjs';

const newsletterName = "𝐗ҽσɳ-𝐗ƚҽƈ𝐡";
const fallbackPP = "https://i.ibb.co/fqvKZrP/ppdefault.jpg";

function getNewsletterContext(jid) {
   return {
      mentionedJid: [jid],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
         newsletterJid: "120363369453603973@newsletter",
         newsletterName,
         serverMessageId: 101,
      },
   };
}

export default async function GroupParticipants(sock, { id, participants, action }) {
   try {
      const metadata = await sock.groupMetadata(id);

      for (const jid of participants) {
         let profilePic;

         try {
            profilePic = await sock.profilePictureUrl(jid, "image");
         } catch {
            profilePic = fallbackPP;
         }

         const userName = jid.split("@")[0];
         const membersCount = metadata.participants.length;
         const groupName = metadata.subject;
         const date = moment.tz('Africa/Nairobi').format('DD/MM/YYYY');
         const time = moment.tz('Africa/Nairobi').format('HH:mm:ss');

         if (action === "add" && config.WELCOME === true) {
            const welcomeMessage = {
               image: { url: profilePic },
               caption: `
┌─❖
│『  *Hi..!! 😊👋*  』
└┬
 ◎ 「  @${userName} 」
  │ ➪  *Wᴇʟᴄᴏᴍᴇ Tᴏ*
 ◎      *${groupName}*
  │ ➪  *Mᴇᴍʙᴇʀ :*
 ◎      *${membersCount}th*
  │ ➪  *Jᴏɪɴᴇᴅ :*
 ◎      *${date}* *${time}*
  │ ➪  *Support by Following My Channel :*
 ◎      https://whatsapp.com/channel/0029VasHgfG4tRrwjAUyTs10
 └─────────────||
⬡ Powered By ${newsletterName}`,
               mentions: [jid],
               contextInfo: getNewsletterContext(jid)
            };

            await sock.sendMessage(id, welcomeMessage);
         }

         if (action === "remove" && config.WELCOME === true) {
            const goodbyeMessage = {
               image: { url: profilePic },
               caption: `
┌─❖
│『  *Gᴏᴏᴅʙʏᴇ..!! 🍁*  』 
└┬
 ◎ 「  @${userName}   」
 │ ➪  *Lᴇғᴛ ғʀᴏᴍ*
 ◎      *${groupName}*
 │ ➪  *Mᴇᴍʙᴇʀ :*
 ◎      *${membersCount}th*
 │ ➪  *Tɪᴍᴇ :*
 ◎      *${date}* *${time}*
 │ ➪  *Support by Following My Channel :*
 ◎      https://whatsapp.com/channel/0029VasHgfG4tRrwjAUyTs10
 └─────────────||
⬡ Powered By ${newsletterName}`,
               mentions: [jid],
               contextInfo: getNewsletterContext(jid)
            };

            await sock.sendMessage(id, goodbyeMessage);
         }
      }
   } catch (e) {
      console.error("🔴 Error in GroupParticipants:", e);
   }
}
