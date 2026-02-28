const { 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder 
} = require('discord.js');

const {
  createCase: createCaseRecord,
  getOpenCaseByDiscordId,
  updateCaseReason
} = require('../../data/SqLite/case');

async function listener(client) {

  const TRIGGER_CHANNEL_ID = '1059267544818667552';
  const CATEGORY_ID = '1059267443492651028';
  const MAX_REASON_LENGTH = 300;

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.channel.id !== TRIGGER_CHANNEL_ID) return;

    const openCase = getOpenCaseByDiscordId(message.author.id);
    if (openCase) return;

    const createdCase = createCaseRecord(
      message.author.id,
      null,
      message.content
    );

    const channel = await message.guild.channels.create({
      name: `case-${createdCase.id}`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      topic: `case-${message.author.id}`,
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: message.author.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
          deny: [PermissionsBitField.Flags.SendMessages],
        },
      ],
    });

    const caseEmbed = new EmbedBuilder()
      .setTitle(`Case #${createdCase.id}`)
      .addFields(
        { name: 'Reason', value: message.content || 'No reason provided' },
        { name: 'Assigned', value: 'Unassigned' }
      )
      .setColor('Blue')
      .setTimestamp();

    await channel.send({ embeds: [caseEmbed] });

    const confirmEmbed = new EmbedBuilder()
      .setDescription(`Your case has been created: ${channel}`)
      .setColor('Green');

    await message.channel.send({
      content: `<@${message.author.id}>`,
      embeds: [confirmEmbed]
    });

    await message.channel.send(
      `I will try to help you to the best of my ability and please be aware that you can call a support staff at ANY time!\n\n***_NOTE: AI is in beta_***`
    );

    await message.channel.send(
      `You stated your reason as:\n\n> ${message.content}\n\nIf this is correct, type **yes**.\nIf not, type anything else to update it.`
    );

    const filter = m => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 60000,
      max: 1
    });

    collector.on('collect', async (reply) => {

      if (reply.content.toLowerCase() === 'yes') {
        await message.channel.send(`✅ Reason confirmed.`);
        return;
      }

      await message.channel.send(
        `Please type your new reason below.\nMaximum ${MAX_REASON_LENGTH} characters.`
      );

      const reasonCollector = message.channel.createMessageCollector({
        filter,
        time: 60000,
        max: 1
      });

      reasonCollector.on('collect', async (newReasonMsg) => {

        if (newReasonMsg.content.length > MAX_REASON_LENGTH) {
          await message.channel.send(
            `❌ Reason exceeds ${MAX_REASON_LENGTH} characters. Case reason was not updated.`
          );
          return;
        }

        updateCaseReason(createdCase.id, newReasonMsg.content);

        await message.channel.send(`✅ Your case reason has been updated.`);
      });
    });

  });

}

module.exports = { listener };