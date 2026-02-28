const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { format } = require('date-fns');

async function fetchIncidentById(incidentId) {
  const apiToken = process.env.BETTERSTACK_API_TOKEN;
  const incidentUrl = `https://uptime.betterstack.com/api/v2/incidents/${incidentId}`;
  
  try {
    const response = await fetch(incidentUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    const data = await response.json();
    
    if (response.ok) {
      if (data && data.data) {
        console.log(`Fetched incident ${incidentId}`);
        const monitor = data.included.find(item => item.type === 'monitor');
        const monitorName = monitor ? monitor.attributes.pronounceable_name : 'Unknown Monitor';
        return {
          incidentId: data.data.id,
          monitorName,
          status: data.data.attributes.status,
        };
      } else {
        throw new Error('Data property is undefined');
      }
    } else {
      throw new Error(data.errors || 'Unknown error');
    }
  } catch (error) {
    console.error(`Error fetching incident with ID ${incidentId}:`, error);
    throw new Error(`There was an error fetching the incident with ID ${incidentId}. Please try again later.`);
  }
}

async function fetchIncidentsForToday() {
  const apiToken = process.env.BETTERSTACK_API_TOKEN;
  const incidentsUrl = 'https://uptime.betterstack.com/api/v2/incidents';
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`Fetching incidents for date: ${today}`);
  
  try {
    const response = await fetch(`${incidentsUrl}?from=${today}&to=${today}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    const data = await response.json();

    if (!data.data) {
      throw new Error('Data property is undefined');
    }

    const incidents = data.data.map(incident => incident.id);
    console.log('Incident IDs:', incidents); 

    const detailedIncidents = [];
    for (const incidentId of incidents) {
      const incidentDetails = await fetchIncidentById(incidentId);
      detailedIncidents.push(incidentDetails);
    }

    return detailedIncidents;
  } catch (error) {
    console.error('Error fetching incidents:', error);
    throw new Error('There was an error fetching the incidents. Please try again later.');
  }
}

async function fetchAndCreateEmbed(addFooter = false) {
  const apiToken = process.env.BETTERSTACK_API_TOKEN;
  const monitorsUrl = 'https://uptime.betterstack.com/api/v2/monitors';
  try {
    const response = await fetch(monitorsUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    const data = await response.json();
    if (!data.data) {
      throw new Error('Data property is undefined');
    }

    const embed = new EmbedBuilder()
      .setTitle('Current Service Status')
      .setColor(0x0099FF)
      .setTimestamp();

    if (addFooter) {
      embed.setFooter({ text: 'Status updates every 10 minutes', iconURL: 'https://cdn.discordapp.com/emojis/1281376366419378176.gif' });
    }

    const upMonitors = [];
    const downMonitors = [];

    for (const monitor of data.data) {
      const statusEmoji = monitor.attributes.status === 'up' ? '<:status_up:1281366011555352648>' : '<:status_down:1281366010682675242>';
      const monitorName = monitor.attributes.pronounceable_name;

      const monitorField = {
        name: `${monitorName}`,
        value: `**Status:** ${monitor.attributes.status} ${statusEmoji}`,
        inline: true
      };

      if (monitor.attributes.status === 'up') {
        upMonitors.push(monitorField);
      } else {
        downMonitors.push(monitorField);
      }
    }

    if (upMonitors.length > 0) {
      embed.addFields({ name: '🟢 Up Monitors', value: '\u200B' });
      upMonitors.forEach(field => embed.addFields(field));
      embed.addFields({ name: '\u200B', value: '\u200B' });
    }

    if (downMonitors.length > 0) {
      embed.addFields({ name: '🔴 Down Monitors', value: '\u200B' });
      downMonitors.forEach(field => embed.addFields(field));
      embed.addFields({ name: '\u200B', value: '\u200B' });
    }

    if (downMonitors.length === 0) {
      embed.addFields({
        name: '✅ All Systems Operational',
        value: 'No services are currently down.',
        inline: false
      });
    } 

    return embed;
  } catch (error) {
    console.error('Error fetching monitors:', error);
    throw new Error('There was an error fetching the monitors. Please try again later.');
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Fetch the status of all monitors from Better Stack and print it in the channel'),
  async execute(interaction) {
    try {
      const embed = await fetchAndCreateEmbed(false);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ content: error.message, ephemeral: true });
    }
  },
  fetchAndCreateEmbed,
  fetchIncidentsForToday,
  fetchIncidentById
};
