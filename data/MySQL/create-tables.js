const pool = require('./database');

function createTables() {
    const tables = [
        {
            name: 'nates_services_tickets',
            query: `CREATE TABLE IF NOT EXISTS tickets (
                ticket_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                guild_id VARCHAR(255) NOT NULL,
                channel_id VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_closed BOOLEAN NOT NULL DEFAULT FALSE,
                category VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`,
        },
        {
            name: 'user_levels',
            query: `CREATE TABLE IF NOT EXISTS user_levels (
                user_id VARCHAR(18) PRIMARY KEY,
                level INT NOT NULL DEFAULT 1,
                exp INT NOT NULL DEFAULT 0
            );`,
        }
    ];

tables.forEach((table) => {
    pool.query(table.query, (err, result) => {
        if (err) {
            console.error(`❌ Error creating table ${table.name}:`, err.message);
            console.error(err.stack);
        } else if (result.warningCount === 0) {
            console.log(`✅ Table ${table.name} created or already exists.`);
        }
    });
});

}

module.exports = createTables;
