const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const PDFDocument = require('pdfkit');
const streamBuffers = require('stream-buffers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('denyapplication')
        .setDescription('Deny an application and notify the applicant.')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for denial')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const allowedRoleId = '1399446443063902348';
            const deniedRoleId = '1216240820886175816';
            const logChannelId = '1399450022487130304';

            if (!interaction.member.roles.cache.has(allowedRoleId)) {
                return await interaction.editReply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true
                });
            }

            const channel = interaction.channel;
            const reason = interaction.options.getString('reason');
            const deniedBy = interaction.member;

            if (!channel.name.endsWith('-application')) {
                return await interaction.editReply({
                    content: 'This command can only be used in application ticket channels.',
                    ephemeral: true
                });
            }

            const topic = channel.topic || '';
            const match = topic.match(/UserID:\s*(\d{17,20})/);
            if (!match) {
                return await interaction.editReply({
                    content: 'Could not find the applicant user ID in the channel topic.',
                    ephemeral: true
                });
            }

            const userId = match[1];
            const deniedUser = await interaction.guild.members.fetch(userId).catch(() => null);

            let dmSuccess = true;
            await interaction.deferReply({ ephemeral: false });

            if (deniedUser) {
                try {
                    await deniedUser.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Application Denied')
                                .setDescription(`We're sorry to inform you that your application has been denied.`)
                                .addFields(
                                    { name: 'Reason', value: reason },
                                    { name: 'Denied By', value: `${deniedBy}` }
                                )
                                .setColor('Red')
                                .setTimestamp()
                        ]
                    });
                } catch {
                    dmSuccess = false;
                }

                const deniedRole = interaction.guild.roles.cache.get(deniedRoleId);
                if (deniedRole) {
                    await deniedUser.roles.add(deniedRole).catch(() => {});
                }
            } else {
                dmSuccess = false;
            }

            const fetchedMessages = await channel.messages.fetch({ limit: 100 });
            const messages = fetchedMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
                initialSize: 100 * 1024,
                incrementAmount: 10 * 1024,
            });
            doc.pipe(writableStreamBuffer);

            // Header
            doc
                .font('Helvetica-Bold')
                .fontSize(22)
                .fillColor('#5865F2') // Discord blurple
                .text(`${deniedUser ? deniedUser.user.username : 'Applicant'}'s Application`, { align: 'center' })
                .moveDown();

            // Subtitle with channel and date
            doc
                .font('Helvetica')
                .fontSize(12)
                .fillColor('black')
                .text(`Application Channel: #${channel.name}`, { align: 'center' });
            doc
                .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
                .moveDown(2);

            // Add each message nicely formatted
            messages.forEach(msg => {
                const time = new Date(msg.createdTimestamp).toLocaleString();
                const author = msg.author.tag;
                const content = msg.content || '[No Text Content]';

                doc
                    .font('Helvetica-Bold')
                    .fontSize(12)
                    .fillColor('#23272A') // dark gray for username
                    .text(`${author} - ${time}`, { continued: false });

                doc
                    .font('Helvetica')
                    .fontSize(11)
                    .fillColor('black')
                    .text(content, { indent: 20, lineGap: 4 });

                if (msg.attachments.size > 0) {
                    doc
                        .fontSize(10)
                        .fillColor('#5865F2')
                        .text(`Attachments:`, { indent: 20 });
                    msg.attachments.forEach(att => {
                        doc.text(`• ${att.url}`, { indent: 30, link: att.url, underline: true, color: 'blue' });
                    });
                }
                doc.moveDown();
            });

            doc.end();

            await new Promise(resolve => writableStreamBuffer.on('finish', resolve));

            const buffer = writableStreamBuffer.getContents();
            const pdfAttachment = new AttachmentBuilder(buffer, { name: `${deniedUser ? deniedUser.user.username : 'Unknown'}-Application.pdf` });

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('Application Denied')
                    .addFields(
                        { name: 'User Denied', value: deniedUser ? `${deniedUser}` : `Unknown (Left?)`, inline: true },
                        { name: 'Denied By', value: `${deniedBy}`, inline: true },
                        { name: 'Reason', value: reason },
                        { name: 'DM Sent Successfully', value: dmSuccess ? '✅ True' : '❌ False' }
                    )
                    .setColor('Red')
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
                await logChannel.send({ files: [pdfAttachment] });
            }

            await interaction.editReply({
                content: deniedUser
                    ? `Denied ${deniedUser}'s application.`
                    : `Denied application. The user may have left the server.`,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in denyapplication command:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error executing this command.', ephemeral: true });
            } else {
                await interaction.editReply({ content: 'There was an error executing this command.', ephemeral: true });
            }
        }
    },
};
