const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config.json');
const pool = require('../../data/MySQL/database');


function generateUniqueToken() {
  const tokenLength = 10;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < tokenLength; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report an offense')
    .addSubcommand(subcommand =>
      subcommand
        .setName('discord')
        .setDescription('Report an offense that occurred on Discord')
        .addStringOption(option =>
          option.setName('user')
            .setDescription('The Discord ID of the reported user')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('The reason for the report')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('evidence')
            .setDescription('Evidence for the report (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('minecraft')
        .setDescription('Report an offense that occurred in Minecraft')
        .addStringOption(option =>
          option.setName('user')
            .setDescription('The Minecraft username of the reported user')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('The reason for the report')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('evidence')
            .setDescription('Evidence for the report (optional)')
            .setRequired(false)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getString('user');
    const reason = interaction.options.getString('reason');
    const evidence = interaction.options.getString('evidence');
    const reporterId = interaction.user.id;

    let platformName = '';
    if (subcommand === 'discord') {
      platformName = 'Discord';
    } else if (subcommand === 'minecraft') {
      platformName = 'Minecraft';
    }

    const reportChannelId = '1131582786365554810';
    const reportChannel = interaction.guild.channels.cache.get(reportChannelId);

    function insertReport(reportKey) {
      const sql = 'INSERT INTO reports (report_key, reporter_id, platform, user, reason, evidence, claimed) VALUES (?, ?, ?, ?, ?, ?, ?)';
      pool.query(sql, [reportKey, reporterId, platformName, user, reason, evidence, false], (err, result) => {
        if (err) {
          console.error('Error storing the report in the database:', err);
          return interaction.reply('An error occurred while submitting the report. Please try again later.');
        }

        console.log('Report submitted and stored in the database');

        const reportEmbed = {
          color: parseInt('FF0000', 16),
          title: 'New Report',
          fields: [
            { name: 'Reporter', value: `<@${reporterId}>`, inline: true },
            { name: 'Platform', value: platformName, inline: true },
            { name: 'User', value: user },
            { name: 'Reason', value: reason },
            { name: 'Evidence', value: evidence || 'No evidence provided', inline: true },
          ],
          timestamp: new Date(),
        };

        reportChannel.send({ embeds: [reportEmbed] });

        interaction.reply('Your report has been submitted successfully.');
      });
    }

    // Generate a unique token for the report and check if it already exists in the database
    function generateAndCheckToken() {
      const reportToken = generateUniqueToken();
      const checkTokenQuery = 'SELECT COUNT(*) as count FROM reports WHERE report_key = ?';
      pool.query(checkTokenQuery, [reportToken], (err, rows) => {
        if (err) {
          console.error('Error checking token in the database:', err);
          return interaction.reply('An error occurred while submitting the report. Please try again later.');
        }

        const tokenExists = rows[0].count > 0;
        if (tokenExists) {
          // If the generated token already exists, generate a new one
          return generateAndCheckToken();
        }

        // Insert the report with the generated token
        insertReport(reportToken);
      });
    }

    generateAndCheckToken();
  },
};
