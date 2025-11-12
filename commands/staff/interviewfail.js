const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('interviewfail')
        .setDescription('Deny a user\'s interview')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to deny')
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRoleId = '1294351092213219461';
        const deniedRoleId = '1216240820886175816';
        const logChannelId = '1399450022487130304';

        if (!interaction.member.roles.cache.has(allowedRoleId)) {
            return await interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return await interaction.reply({
                content: 'User not found in this server.',
                ephemeral: true
            });
        }

        const role = interaction.guild.roles.cache.get(deniedRoleId);
        if (role) await member.roles.add(role).catch(() => {});

        let dmSuccess = true;
        try {
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Interview Denied')
                        .setDescription(`Unfortunately, you did not pass the interview stage. You may reapply in the future.`)
                        .setColor('Red')
                        .setTimestamp()
                ]
            });
        } catch {
            dmSuccess = false;
        }

        if (!dmSuccess) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                await logChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('DM Failed')
                            .setDescription(`Could not send interview denial message to ${targetUser}.`)
                            .setColor('Red')
                            .setTimestamp()
                    ]
                });
            }
        }

        await interaction.reply({
            content: `❌ Interview denied for ${member}.`,
            ephemeral: true
        });
    }
};