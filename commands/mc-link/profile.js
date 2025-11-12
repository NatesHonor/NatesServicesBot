const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../../data/MySQL/database');
const fetch = require('node-fetch');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Displays profile information'),

  async execute(interaction) {
    await interaction.deferReply();

    const discordUserId = interaction.user.id;
    const sql = 'SELECT minecraft_username FROM account_links WHERE discord_user_id = ?';

    pool.query(sql, [discordUserId], async (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        return interaction.editReply('An error occurred while fetching the profile. Please try again later.');
      }

      if (result.length === 0) {
        return interaction.editReply('You have not linked your Minecraft account.');
      }

      const minecraftUsername = result[0].minecraft_username;

      try {
        const response = await fetch(`http://localhost:3000/player/${encodeURIComponent(minecraftUsername)}`);
        const data = await response.json();

        if (!data) {
          console.error('No data received from the API.');
          return interaction.editReply('An error occurred while fetching the profile. Please try again later.');
        }

        const rank = data.rank || 'N/A';
        const level = data.level || 1;
        const avatarUrl = data.avatarUrl || 'https://example.com/default-avatar.png';

        const embed = new EmbedBuilder()
          .setColor(rank.toLowerCase() === 'admin' ? '#FF0000' : '#0099ff')
          .setTitle('Profile Information')
          .addFields(
            { name: 'Rank', value: rank, inline: true },
            { name: 'Minecraft Username', value: minecraftUsername, inline: true },
            { name: 'Level', value: level.toString(), inline: true },
          )
          .setThumbnail(avatarUrl);

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error fetching player data:', error);
        await interaction.editReply('An error occurred while fetching the profile. Please try again later.');
      }
    });
  },
};
