const { SlashCommandBuilder } = require('discord.js');
const pool = require('../../data/MySQL/database');
const config = require('../../config.json');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your email and password.')
    .addStringOption((option) =>
      option.setName('email').setDescription('Your email').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('password').setDescription('Your password').setRequired(true)
    ),
  async execute(interaction) {
    const staffRoleId = '1130557413989290136';
    const member = interaction.member;
    const hasStaffRole = member.roles.cache.has(staffRoleId);

    if (!hasStaffRole) {
      return interaction.reply('You do not have the required role to use this command.');
    }

    const email = interaction.options.getString('email');
    const password = interaction.options.getString('password');
    const userId = interaction.user.id;

    const checkSql = 'SELECT * FROM logins WHERE uuid = ?';
    pool.query(checkSql, [userId], (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        return interaction.reply('An error occurred while checking your account link. Please try again later.');
      }

      if (result.length > 0) {
        return interaction.reply('You are already registered. You cannot register again.');
      }

      const sql = 'INSERT INTO logins (uuid, email, password) VALUES (?, ?, ?)';
      pool.query(sql, [userId, email, password], (err, result) => {
        if (err) {
          console.error('Error storing login information in the database:', err);
          return interaction.reply('An error occurred while registering your email and password. Please try again later.');
        }

        console.log('Login information stored in the database');

        interaction.reply('Your email and password have been registered successfully.');
      });
    });
  },
};
