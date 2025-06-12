const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ai',
  description: 'Interact with AI using Gemini (fastest responder wins)',
  usage: 'gpt4 [your message]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(senderId, {
        text: "❓ Veuillez poser votre question ou tapez 'help' pour voir les commandes disponibles."
      }, pageAccessToken);
    }

    const lowerPrompt = prompt.toLowerCase();
    const greetings = ['salut', 'hi', 'hello', 'bonjour'];

    if (greetings.includes(lowerPrompt)) {
      return sendMessage(senderId, {
        text:
          "👋 Bonjour et bienvenue !\n\n" +
          "Merci d'utiliser notre intelligence artificielle. 🙏\n\n" +
          "✨ Pour nous soutenir, partagez cette IA avec vos amis ou dans vos groupes.\n\n" +
          "🚀 Posez votre question pour commencer."
      }, pageAccessToken);
    }

    const GEMINI_API_KEYS = [
      'AIzaSyDIGG4puPZ6kPIUR0CSD6fOgh6PNWqYFuM',
      'AIzaSyCPCItkc_2hGwufiiTgz1dqvyLbBnmozMA',
      'AIzaSyAV0s2XU0gkrfkWiBOMxx6d6AshqnyPbiE'
    ];

    try {
      const geminiRequests = GEMINI_API_KEYS.map(key =>
        axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ).then(res => res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '')
      );

      const firstResponse = await Promise.any(geminiRequests);

      const response = typeof firstResponse === 'string'
        ? firstResponse
        : JSON.stringify(firstResponse);

      if (response) {
        const parts = [];
        for (let i = 0; i < response.length; i += 1800) {
          parts.push(response.substring(i, i + 1800));
        }

        for (const part of parts) {
          await sendMessage(senderId, { text: part + ' 🪐' }, pageAccessToken);
        }
      } else {
        await sendMessage(senderId, {
          text: "⚠️ Une erreur est survenue, et aucune réponse n'a pu être obtenue. Veuillez réessayer plus tard."
        }, pageAccessToken);
      }

    } catch (err) {
      console.error("Erreur Gemini API:", err.message || err);
      await sendMessage(senderId, {
        text:
          "🚫 Oups, toutes nos IA sont actuellement inaccessibles.\n\n" +
          "💡 Réessayez dans quelques instants. En cas de problème persistant, contactez notre support. Merci pour votre patience !"
      }, pageAccessToken);
    }
  }
};
