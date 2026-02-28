const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS incidents (
    incidentId TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    messageId TEXT NOT NULL,
    monitorName TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

function loadIncidents() {
  const rows = db.prepare(`SELECT * FROM incidents`).all();
  const mapped = {};
  for (const row of rows) {
    mapped[row.incidentId] = {
      status: row.status,
      messageId: row.messageId,
      monitorName: row.monitorName
    };
  }
  return mapped;
}

function getIncident(incidentId) {
  return db
    .prepare(`SELECT * FROM incidents WHERE incidentId = ?`)
    .get(incidentId);
}

function saveIncident({ incidentId, status, messageId, monitorName }) {
  db.prepare(`
    INSERT INTO incidents (incidentId, status, messageId, monitorName)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(incidentId) DO UPDATE SET
      status = excluded.status,
      messageId = excluded.messageId,
      monitorName = excluded.monitorName
  `).run(incidentId, status, messageId, monitorName || null);
}

function saveIncidents(incidentObject) {
  const insert = db.prepare(`
    INSERT INTO incidents (incidentId, status, messageId, monitorName)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(incidentId) DO UPDATE SET
      status = excluded.status,
      messageId = excluded.messageId,
      monitorName = excluded.monitorName
  `);

  const transaction = db.transaction((incidents) => {
    for (const [incidentId, data] of Object.entries(incidents)) {
      insert.run(
        incidentId,
        data.status,
        data.messageId,
        data.monitorName || null
      );
    }
  });

  transaction(incidentObject);
}

function deleteIncident(incidentId) {
  db.prepare(`DELETE FROM incidents WHERE incidentId = ?`).run(incidentId);
}

function clearIncidents() {
  db.prepare(`DELETE FROM incidents`).run();
}

module.exports = {
  loadIncidents,
  getIncident,
  saveIncident,
  saveIncidents,
  deleteIncident,
  clearIncidents
};