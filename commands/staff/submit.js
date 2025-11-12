const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submitapplication')
        .setDescription('Submit your application'),

    async execute(interaction) {
        const channel = interaction.channel;
        const member = interaction.member;
        const applicantRoleId = '1294351092213219461';
        const pingRoleId = '1399446443063902348';

        if (!channel.name.endsWith('-application')) {
            return await interaction.reply({
                content: 'This command can only be used in application ticket channels.',
                ephemeral: true
            });
        }

        await channel.send(`Okay! Submitting your application, ${member.displayName} in...`);
        for (let i = 5; i >= 1; i--) {
            await channel.send(`${i}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const pingRole = interaction.guild.roles.cache.get(pingRoleId);
        if (pingRole) {
            await channel.send(`Attention ${pingRole}, ${member.displayName}'s application has been submitted!`);
        }

        const applicantRole = interaction.guild.roles.cache.get(applicantRoleId);
        if (applicantRole) {
            await member.roles.add(applicantRole);
            await channel.send(`${member} has been given the Applicant role.`);
        }

        await channel.permissionOverwrites.edit(member.id, {
            [PermissionsBitField.Flags.ViewChannel]: false
        });

        if (interaction.user.id !== member.id) {
            await channel.permissionOverwrites.edit(interaction.user.id, {
                [PermissionsBitField.Flags.ViewChannel]: false
            });
        }

        await interaction.reply({ content: 'Application submitted!', ephemeral: true });
    },
};
