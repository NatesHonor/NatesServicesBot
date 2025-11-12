const { SelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

async function handleApplication(buttonInteraction) {
    if (!buttonInteraction.deferred && !buttonInteraction.replied) {
        await buttonInteraction.deferReply({ ephemeral: true });
    }
    const applicationCategoryId = '1399446894920335381';
    const applicationCategory = await buttonInteraction.guild.channels.fetch(applicationCategoryId);
    const buttonClickerId = buttonInteraction.user.id;

    try {
      const existingChannels = await buttonInteraction.guild.channels.fetch();

        const existingChannel = existingChannels.find(
        (channel) =>
            channel.type === ChannelType.GuildText &&
            channel.parentId === applicationCategory.id &&
            channel.name.toLowerCase() === `${buttonInteraction.user.username}s-application`.toLowerCase()
        );

      
      if (existingChannel) {
          await buttonInteraction.editReply({ content: 'You already have an application channel!', components: [] });
          return;
      }
        const ticketChannel = await buttonInteraction.guild.channels.create({
            name: `${buttonInteraction.user.username}s-application`,
            type: ChannelType.GuildText,
            parent: applicationCategory,
            permissionOverwrites: [
                {
                    id: buttonInteraction.guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: buttonClickerId,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        const user = await buttonInteraction.guild.members.fetch(buttonClickerId);
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Welcome to your application!`)
            .setDescription(`Please follow this format, and whenever you're done with the application simply type /submit and we will send off your application!`)
            .setTimestamp();

            const row = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('select_a_position')
                    .setPlaceholder('Select a position!')
                    .addOptions([
                        {
                            label: 'Helper',
                            value: 'helper',
                        },
                        {
                            label: 'Moderator',
                            value: 'moderator',
                        },
                        {
                          label: 'GameMaster',
                          value: 'gamemaster',
                      },                        
                        {
                          label: 'Contractor',
                          value: 'contractor',
                        },
                    ]),
            );
        await ticketChannel.setTopic(`UserID: ${user.id}`)
        await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
        await buttonInteraction.editReply({ content: 'Your application has been created!', components: [] });
    } catch (channelError) {
        console.error('Error creating application channel:', channelError);
        await buttonInteraction.editReply({ content: 'There was an error creating the application channel, use the website instead.' });
    }
}

module.exports = { handleApplication };