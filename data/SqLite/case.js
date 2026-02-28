const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordId TEXT NOT NULL,
    channelId TEXT,
    status TEXT DEFAULT 'open',
    reason TEXT,
    assigned TEXT DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function createCase(discordId, channelId = null, reason = null) {
  const stmt = db.prepare(`
    INSERT INTO cases (discordId, channelId, status, reason, assigned)
    VALUES (?, ?, 'open', ?, NULL)
  `);

  const info = stmt.run(discordId, channelId, reason);
  return getCaseById(info.lastInsertRowid);
}

function listCases() {
  return db.prepare(`SELECT * FROM cases ORDER BY id DESC`).all();
}

function getCaseById(id) {
  return db.prepare(`SELECT * FROM cases WHERE id = ?`).get(id);
}

function getCasesByDiscordId(discordId) {
  return db.prepare(`
    SELECT * FROM cases 
    WHERE discordId = ? 
    ORDER BY id DESC
  `).all(discordId);
}

function getOpenCaseByDiscordId(discordId) {
  return db.prepare(`
    SELECT * FROM cases 
    WHERE discordId = ? AND status = 'open'
    LIMIT 1
  `).get(discordId);
}

function updateCaseStatus(id, status) {
  db.prepare(`UPDATE cases SET status = ? WHERE id = ?`)
    .run(status, id);
  return getCaseById(id);
}

function assignCase(id, assignedDiscordId) {
  db.prepare(`UPDATE cases SET assigned = ? WHERE id = ?`)
    .run(assignedDiscordId, id);
  return getCaseById(id);
}

module.exports = {
  createCase,
  listCases,
  getCaseById,
  getCasesByDiscordId,
  getOpenCaseByDiscordId,
  updateCaseStatus,
  assignCase
};