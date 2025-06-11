const db = require('./firebase');

async function savePageToken(pageId, token) {
  await db.collection('pages').doc(pageId).set({ token });
}

async function getPageToken(pageId) {
  const doc = await db.collection('pages').doc(pageId).get();
  if (!doc.exists) return null;
  return doc.data().token;
}

module.exports = { savePageToken, getPageToken };
