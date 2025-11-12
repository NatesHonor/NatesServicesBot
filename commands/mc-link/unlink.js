const { SlashCommandBuilder } = require('discord.js');
const pool = require('../../data/MySQL/database');
const { EmbedBuilder } = require('discord.js');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlinks your Minecraft account from your Discord'),
  async execute(interaction) {
    const discordUserId = interaction.user.id;

    const sql = 'DELETE FROM account_links WHERE discord_user_id = ?';
    pool.query(sql, [discordUserId], (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        return interaction.reply('An error occurred while unlinking your account. Please try again later.');
      }

      if (result.affectedRows === 0) {
        return interaction.reply('Your account is not linked. There is no data to unlink.');
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Account Unlinked')
        .setDescription('Your Minecraft account has been successfully unlinked from your Discord.');

      interaction.reply({ embeds: [embed] });
    });
  },
};
