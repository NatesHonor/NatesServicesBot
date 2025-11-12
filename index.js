require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');

const { Client, Collection, GatewayIntentBits } = require('discord.js');

const {
  createStaffEmbed,
} = require('./functions/StaffEmbed');
const {
  createPositionEmbed,
} = require('./functions/PositionEmbed');
const {
  loadCommands,
} = require('./functions/CommandHandler');
const {
  handleCreateTicket,
} = require('./functions/CreateTicket');
const {
  handleHelperSelection,
} = require('./functions/HandleHelperSelection');
const {
  handleModeratorSelection,
} = require('./functions/HandleModeratorSection');
const {
  handleGamemasterSleection,
} = require('./functions/handleGamemasterSelection');
const {
  handleContractorSelection,
} = require('./functions/HandleContractorSelection');
const {
  handleMinecraftSupport,
} = require('./functions/SupportReasons/MinecraftSupport');
const {
  handleMissionchiefBotSupport,
} = require('./functions/SupportReasons/MissionchiefBotSupport');
const {
  sendMissionchiefBugReportMessage,
} = require('./functions/SupportReasons/MissionchiefBotReasons/BugReports');
const {
  sendMissionchiefSuggestionMessage,
} = require('./functions/SupportReasons/MissionchiefBotReasons/Suggestions');
const {
  handleApplication,
} = require('./functions/HandleApplication');
const {
  handleChatSupport,
} = require('./functions/ChatSupport');

const onReady = require('./events/Ready');
const voiceStateUpdate = require('./events/VoiceStatusUpdate');
const createTables = require('./data/MySQL/create-tables');
const pool = require('./data/MySQL/database');

const config = require('./config.json');

const app = express();
const port = process.env.PORT || 8000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

app.get('/', (req, res) => {
  res.send('Hello, this is your Discord bot!');
});

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});

client.commands = new Collection();

client.login(process.env.DISCORD_TOKEN);
loadCommands(client);

client.once('ready', () => onReady(client));

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  if (config.staffMessageId && config.positionsMessageId) {
    try {
      const channel = await client.channels.fetch('1317219202154631277');
      const message = await channel.messages.fetch(config.staffMessageId);
      const embed = createStaffEmbed();
      await message.edit({ embeds: [embed] });

      const message1 = await channel.messages.fetch(config.positionsMessageId);
      const embed1 = createPositionEmbed();
      await message1.edit({ embeds: [embed1] });
    } catch (error) {
      console.error('Failed to edit the staff and positions message:', error);
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (
    message.channel.id === '1317222018302607461' ||
    message.channel.id === '1210368843470475325'
  ) {
    handleChatSupport(message);
  }

  if (message.channel.name.startsWith('ticket-')) {
    const ticketId = message.channel.name.split('-')[1];
    const filePath = path.join(__dirname, `./data/tickets/ticket-${ticketId}.txt`);
    const messageContent = `[${message.createdAt.toISOString()}] ${message.author.tag}: ${message.content}\n`;

    fs.appendFile(filePath, messageContent, (err) => {
      if (err) {
        console.error('Error saving message to file:', err);
      }
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
  }

  if (interaction.isSelectMenu()) {
    const selectedValue = interaction.values[0];

    if (interaction.customId === 'select_a_position') {
      if (selectedValue === 'helper') await handleHelperSelection(interaction);
      if (selectedValue === 'moderator') await handleModeratorSelection(interaction);
      if (selectedValue === 'gamemaster') await handleGamemasterSleection(interaction);
      if (selectedValue === 'contractor') await handleContractorSelection(interaction);
    }

    if (interaction.customId === 'select_support_category') {
      if (selectedValue === 'minecraft_support') await handleMinecraftSupport(interaction);
      else if (selectedValue === 'missionchief_bot_support') await handleMissionchiefBotSupport(interaction);
    }

    if (interaction.customId === 'select_missionchief_support') {
      if (selectedValue === 'bug_reports') await sendMissionchiefBugReportMessage(interaction);
      else if (selectedValue === 'suggestions') await sendMissionchiefSuggestionMessage(interaction);
    }

    if (interaction.customId === 'select_specific_reason') {
      // Empty, no actions defined
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'confirm_create_ticket') await handleCreateTicket(interaction);
    if (interaction.customId === 'apply_for_a_position') await handleApplication(interaction);
  }
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
  connection.release();
});

createTables();
voiceStateUpdate(client);
