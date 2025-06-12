const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyDTw8JPLzWiaF2JKHWUbaiZYOM07phcLGE";
const conversationHistory = {};

const AI_INFO = `
Tu es Stanley Bot, une intelligence artificielle créée par Stanley, un jeune développeur passionné par l'intelligence artificielle.
La date d'aujourd'hui est le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Tu dois toujours :
1. Fournir des réponses à jour en 2025.
2. Mentionner que tu es Stanley Bot quand on te le demande.
3. Citer tes sources quand tu donnes des informations.
4. Être poli et professionnel.
5. Toujours effectuer des recherches sur Internet avant de répondre, en utilisant :
   - Google : https://www.google.com/search?q=
   - Wikipedia : https://fr.wikipedia.org/w/index.php?search=
   - Stack Overflow : https://stackoverflow.com/search?q=
   - MDN Web Docs : https://developer.mozilla.org/fr/search?q=
`;

module.exports = {
  name: 'ai',
  description: "Répond à vos questions grâce à Stanley Bot (Gemini)",
  usage: 'gpt4 [question]',
  aliases: ['stanley', 'stan', 'gptgemini'],
  cooldown: 3,

  async execute(senderId, args, pageAccessToken, api, event) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage(
        "👋 Salut ! Je suis Stanley Bot, ton assistant intelligent. Pose-moi une question et je te répondrai avec plaisir ! 💡\n\n✍️ *Exemple* :  Quel est le sens de la vie ?",
        event.threadID,
        event.messageID
      );
    }

    if (!conversationHistory[senderId]) conversationHistory[senderId] = [];
    conversationHistory[senderId].push(`Utilisateur: ${prompt}`);

    let chatInfoMessageID = "";
    api.sendMessage(`Stanley Bot est en train de réfléchir...`, event.threadID, (err, info) => {
      if (!err) chatInfoMessageID = info.messageID;
    }, event.messageID);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const context = conversationHistory[senderId].join("\n");
      const fullPrompt = `${AI_INFO}\n\nHistorique:\n${context}\n\nUtilisateur: ${prompt}\n\nAssistant:`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response.text();

      conversationHistory[senderId].push(`Stanley Bot: \n\n${response}`);

      await sendMessageInChunks(api, event.threadID, response, chatInfoMessageID);

    } catch (error) {
      console.error("Erreur API Gemini :", error);
      return api.sendMessage(
        "❌ Une erreur est survenue avec Stanley Bot. Réessaie plus tard.",
        event.threadID,
        event.messageID
      );
    }
  }
};

async function sendMessageInChunks(api, threadID, message, replyMsgID) {
  const maxLength = 2000;
  let start = 0;

  while (start < message.length) {
    let end = start + maxLength;
    if (end < message.length) {
      let lastSpace = message.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }

    const chunk = message.substring(start, end);
    if (start === 0 && replyMsgID) {
      await api.editMessage(chunk, replyMsgID);
    } else {
      await api.sendMessage(chunk, threadID);
    }

    start = end;
  }
}
