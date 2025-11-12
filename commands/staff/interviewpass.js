const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('interviewpass')
        .setDescription('Pass a user\'s interview')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to pass')
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRoleId = '1294351092213219461';
        const passedRoleId = '1216236838344200232';
        const logChannelId = '1399450022487130304';
        const vcTag = '<#1216241453588676699>';

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

        const role = interaction.guild.roles.cache.get(passedRoleId);
        if (role) await member.roles.add(role).catch(() => {});

        let dmSuccess = true;
        try {
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Interview Passed')
                        .setDescription(`You have passed the interview stage. Please join the ${vcTag} voice channel and wait for staff.`)
                        .setColor('Green')
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
                            .setDescription(`Could not send interview pass message to ${targetUser}.`)
                            .setColor('Red')
                            .setTimestamp()
                    ]
                });
            }
        }

        await interaction.reply({
            content: `✅ Interview passed for ${member}.`,
            ephemeral: true
        });
    }
};
