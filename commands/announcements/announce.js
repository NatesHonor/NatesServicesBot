const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement message')
    .addSubcommand(subcommand =>
      subcommand
        .setName('everyone')
        .setDescription('Announce to everyone')
        .addStringOption(option =>
          option.setName('service_name').setDescription('Service name').setRequired(true))
        .addStringOption(option =>
          option.setName('bold_content').setDescription('Bolded content').setRequired(true))
        .addStringOption(option =>
          option.setName('plain_content').setDescription('Plain content under bolded content').setRequired(true))
        .addStringOption(option =>
          option.setName('more_bold_content').setDescription('More bolded content').setRequired(false))
        .addStringOption(option =>
          option.setName('more_plain_content').setDescription('Plain content under more bolded content').setRequired(false))
        .addStringOption(option =>
          option.setName('link').setDescription('Optional link').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('staff')
        .setDescription('Announce to staff')
        .addStringOption(option =>
            option.setName('service_name').setDescription('Service name').setRequired(true))
        .addStringOption(option =>
            option.setName('bold_content').setDescription('Bolded content').setRequired(true))
        .addStringOption(option =>
            option.setName('plain_content').setDescription('Plain content under bolded content').setRequired(true))
        .addStringOption(option =>
            option.setName('more_bold_content').setDescription('More bolded content').setRequired(false))
        .addStringOption(option =>
            option.setName('more_plain_content').setDescription('Plain content under more bolded content').setRequired(false))
        .addStringOption(option =>
            option.setName('link').setDescription('Optional link').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('missionchief')
        .setDescription('Announce to Missionchief Users')
        .addStringOption(option =>
            option.setName('service_name').setDescription('Service name').setRequired(true))
        .addStringOption(option =>
            option.setName('bold_content').setDescription('Bolded content').setRequired(true))
        .addStringOption(option =>
            option.setName('plain_content').setDescription('Plain content under bolded content').setRequired(true))
        .addStringOption(option =>
            option.setName('more_bold_content').setDescription('More bolded content').setRequired(false))
        .addStringOption(option =>
            option.setName('more_plain_content').setDescription('Plain content under more bolded content').setRequired(false))
        .addStringOption(option =>
            option.setName('more_bold_content2').setDescription('More bolded content').setRequired(false))
        .addStringOption(option =>
            option.setName('more_plain_content2').setDescription('Plain content under more bolded content').setRequired(false))
            
            
        .addStringOption(option =>
            option.setName('link').setDescription('Optional link').setRequired(false))
    ),
    async execute(interaction) {
      const requiredRoleId = '1092450066402398371';
  
      if (!interaction.member.roles.cache.has(requiredRoleId)) {
          await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
          return;
      }
    const subcommand = interaction.options.getSubcommand();
    const serviceName = interaction.options.getString('service_name');
    const boldContent = interaction.options.getString('bold_content');
    const plainContent = interaction.options.getString('plain_content');
    const moreBoldContent = interaction.options.getString('more_bold_content') || '';
    const morePlainContent = interaction.options.getString('more_plain_content') || '';
    const moreBoldContent2 = interaction.options.getString('more_bold_content2') || '';
    const morePlainContent2 = interaction.options.getString('more_plain_content2') || '';
    
    const link = interaction.options.getString('link') || '';

    let role;
    if (subcommand === 'everyone') {
        role = '@everyone';
    } else if (subcommand === 'staff') {
        role = '<@&YOUR_STAFF_ROLE_ID>';
    } else if (subcommand === 'missionchief') {
        role = '<@&1274268443864072262>';
    }

    const embed = new EmbedBuilder()
        .setDescription(`**${boldContent}**\n${plainContent}`)
        .setColor(0x0099FF)
        .setTimestamp();
    if (moreBoldContent && morePlainContent) {
        embed.addFields(
        { name: '\u200B', value: '\u200B' },
        { name: moreBoldContent, value: morePlainContent, inline: true }
        );
    }
    if (moreBoldContent2 && morePlainContent2) {
      embed.addFields(
      { name: '\u200B', value: '\u200B' },
      { name: moreBoldContent2, value: morePlainContent2, inline: true }
      );
  }
    if (link) {
        embed.setTitle(serviceName)
             .setURL(link);
    }
    embed.setFooter({ text: 'All my work is free and any donations are appreciated', iconURL: 'https://cdn.discordapp.com/avatars/1119080731939966986/6a891acc09a56151dcfe09cd4c14fa2a.webp?size=40' });
    await interaction.channel.send({ content: role, allowedMentions: { parse: ['roles'] } });
    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: 'Announcement sent!', ephemeral: true });
  }
};
