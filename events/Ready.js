const { fetchAndCreateEmbed, fetchIncidentsForToday } = require('../commands/announcements/status');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { loadIncidents, saveIncidents } = require('../data/sqlite/incidents');

const incidentsFilePath = path.resolve(__dirname, '../data/JSON/incidents.json');


async function getMonitorName(incident) {
    try {
        const monitor = incident.included ? incident.included.find(item => item.type === 'monitor') : null;
        return monitor ? monitor.attributes.pronounceable_name : 'Unknown Monitor';
    } catch (error) {
        console.error(`Error fetching monitor name for incident ID ${incident.id}:`, error);
        return 'Unknown Monitor';
    }
}

async function updateEmbed(client) {
    try {
        const channelId = '1281398517943898192';
        const messageId = '1477351825215590613';
        const channel = await client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);
        const embed = await fetchAndCreateEmbed(true);
        await message.edit({ embeds: [embed] });
        console.log('Embed updated successfully.');
    } catch (error) {
        console.error('Error updating embed:', error);
    }
}


async function sendIncidentReports(client) {
  try {
    const channelId = '1059267544818667552';
    const channel = await client.channels.fetch(channelId);
    const incidents = await fetchIncidentsForToday();
    const existingIncidents = loadIncidents();

    for (const incident of incidents) {
      if (!incident || !incident.incidentId) continue;

      const incidentId = incident.incidentId;
      const monitorName = incident.monitorName;
      const resolved = incident.status.toLowerCase() === 'resolved';

      if (existingIncidents[incidentId]) {
        if (resolved && existingIncidents[incidentId].status !== 'resolved') {
          const messageId = existingIncidents[incidentId].messageId;
          const message = await channel.messages.fetch(messageId).catch(() => null);
          if (message) await message.delete();

          const resolvedEmbed = new EmbedBuilder()
            .setTitle(`Incident ID: ${incidentId} Resolved`)
            .setColor(0x00ff00)
            .setTimestamp()
            .addFields(
              { name: 'Status', value: 'Resolved', inline: true },
              { name: 'Monitor', value: monitorName, inline: true }
            );

          await channel.send({ embeds: [resolvedEmbed] });
          delete existingIncidents[incidentId];
        }
      } else if (!resolved) {
        const embed = new EmbedBuilder()
          .setTitle(`Incident ID: ${incidentId}`)
          .setColor(0xff0000)
          .setTimestamp()
          .addFields(
            { name: 'Status', value: incident.status, inline: true },
            { name: 'Monitor', value: monitorName, inline: true }
          );

        const message = await channel.send({ embeds: [embed] });
        existingIncidents[incidentId] = {
          status: 'unresolved',
          messageId: message.id
        };
      }
    }

    saveIncidents(existingIncidents);
  } catch (error) {
    console.error('Error sending incident reports:', error);
  }
}

module.exports = { sendIncidentReports };
async function checkForNewIncidents(client) {
    try {
        const channelId = '1281346844319813652';
        const channel = await client.channels.fetch(channelId);
        const incidents = await fetchIncidentsForToday();
        const existingIncidents = loadIncidents();


        for (const incident of incidents) {
            const incidentId = incident.incidentId;
            const monitorName = await getMonitorName(incident);
            const resolved = incident.attributes.status === 'resolved';

            if (!existingIncidents[incidentId] && !resolved) {
                const embed = new EmbedBuilder()
                    .setTitle(`Incident ID: ${incidentId}`)
                    .setColor(0xFF0000)
                    .setTimestamp()
                    .addFields(
                        { name: 'Status', value: incident.attributes.status, inline: true },
                        { name: 'Started At', value: incident.attributes.started_at, inline: true },
                        { name: 'Ended At', value: 'Ongoing', inline: true },
                        { name: 'Monitor', value: monitorName, inline: true }
                    );

                const message = await channel.send({ embeds: [embed] });
                existingIncidents[incidentId] = { status: 'unresolved', messageId: message.id, monitorName };
            } else if (existingIncidents[incidentId] && resolved && existingIncidents[incidentId].status !== 'resolved') {
                const messageId = existingIncidents[incidentId].messageId;
                const message = await channel.messages.fetch(messageId);
                await message.delete();

                const resolvedEmbed = new EmbedBuilder()
                    .setTitle(`Incident ID: ${incidentId} Resolved`)
                    .setColor(0x00FF00)
                    .setTimestamp()
                    .addFields(
                        { name: 'Status', value: 'Resolved', inline: true },
                        { name: 'Monitor', value: monitorName, inline: true }
                    );

                await channel.send({ embeds: [resolvedEmbed] });
                delete existingIncidents[incidentId];
            }
        }

        saveIncidents(existingIncidents);
        console.log('Incident checks completed and incidents updated.');
    } catch (error) {
        console.error('Error checking for new incidents:', error);
    }
}

async function onReady(client) {
    console.log('Ready!');
    await updateEmbed(client);
    await sendIncidentReports(client);

    setInterval(async () => {
        await updateEmbed(client);
        await checkForNewIncidents(client);
    }, 10 * 60 * 1000);
}

module.exports = onReady;
