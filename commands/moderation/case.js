const { SlashCommandBuilder } = require('discord.js');
const {
  getOpenCaseByDiscordId,
  updateCaseStatus
} = require('../../data/SqLite/case');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Manage cases')
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close a user\'s open case')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user whose case you want to close')
            .setRequired(true)
        )
    ),

  async execute(interaction) {

    if (interaction.options.getSubcommand() === 'close') {

      const target = interaction.options.getUser('user');
      const openCase = getOpenCaseByDiscordId(target.id);

      if (!openCase) {
        return interaction.reply({
          content: `${target.tag} does not have an open case.`,
          ephemeral: true
        });
      }

      updateCaseStatus(openCase.id, 'closed');

      const channel = interaction.guild.channels.cache.get(openCase.channelId);

      if (channel) {
        await channel.delete().catch(() => {});
      }

      await interaction.reply({
        content: `✅ Successfully closed case #${openCase.id} for ${target.tag}.`
      });

    }

  },
};