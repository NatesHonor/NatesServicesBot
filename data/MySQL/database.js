require('dotenv').config
const mysql = require('mysql2');
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MySQL_HOST,
  database: process.env.MySQL_DATABASE,
  user: process.env.MySQL_USERNAME,
  password: process.env.MySQL_PASSWORD,
});


pool.on('acquire', () => {
  console.log("Acquired MySQL Connection")
});
  

module.exports = pool;
