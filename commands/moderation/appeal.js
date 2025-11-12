const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const pool = require('../../data/MySQL/database');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('appeal')
    .setDescription('Appeal a Discord or Minecraft Mute!'),
  async execute(interaction) {
    const user = interaction.user;
    const channelName = `${user.username}s-appeal`;
    await interaction.reply({
      content: 'Attempting to create your appeal...',
    });
    const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Appeal Information')
    .addFields(
      { name: 'To appeal for minecraft', value: '"Click the ', inline: true },
      { name: 'To appeal for our discord', value: '"Click the ', inline: true },
      { name: 'To appeal for our website', value: '"Click the ', inline: true },
    )
    const existingChannel = interaction.guild.channels.cache.find(
      (channel) => channel.name === channelName && channel.type === ChannelType.GuildText
    );

    if (existingChannel) {
      await interaction.editReply({
        content: `You already have an appeal open! Click <#${existingChannel.id}> to go to your appeal channel.`,
      });                                             `                    `
    } else {
      try {
        const createdChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
        });
        
        try {
          await createdChannel.send({ embeds: [embed] });
        
          await interaction.editReply({
            content: `Your channel was successfully created! Click <#${createdChannel.id}> to go to your appeal channel.`,
          });
        
          setTimeout(() => {
            createdChannel.delete();
          }, 1000 * 60 * 60);
        } catch (error) {
          console.log(error);
          await interaction.editReply({
            content:
              'Your channel could not be created! Please check if the bot has the necessary permissions!',
          });
        }
      } catch (error) {
        console.log(error)
      }
    } 
  },
};
