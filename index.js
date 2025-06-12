const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Pour servir la page HTML statique

const VERIFY_TOKEN = 'pagebot';
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Fonction pour lire les tokens stockés
function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, '{}');
  }
  const data = fs.readFileSync(TOKENS_FILE, 'utf8');
  return JSON.parse(data);
}

// Fonction pour sauvegarder les tokens
function saveTokens(tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

// Vérification du webhook (Facebook)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Réception des événements Messenger
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const pageId = entry.id;
      const tokens = loadTokens();
      const pageToken = tokens[pageId];

      if (!pageToken) {
        console.log(`Aucun token enregistré pour la page ${pageId}`);
        return;
      }

      entry.messaging.forEach(event => {
        if (event.message) {
          handleMessage(event, pageToken);
        } else if (event.postback) {
          handlePostback(event, pageToken);
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Route pour sauvegarder un nouveau token + page ID
app.post('/api/save-token', (req, res) => {
  const { page_id, token } = req.body;

  if (!page_id || !token) {
    return res.status(400).json({ message: 'page_id et token sont requis' });
  }

  const tokens = loadTokens();
  tokens[page_id] = token;
  saveTokens(tokens);

  console.log(`Token enregistré pour la page ${page_id}`);

  res.json({ message: 'Token enregistré avec succès' });
});

// ✅ Route pour UptimeRobot
app.get('/', (req, res) => {
  res.send('Bot en ligne 🚀');
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
