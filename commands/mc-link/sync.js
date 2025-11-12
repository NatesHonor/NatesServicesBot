const { SlashCommandBuilder } = require('discord.js');
const pool = require('../../data/MySQL/database');
const cooldowns = new Map();


module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Syncs your Discord role with your account in the database'),
  async execute(interaction) {
    const discordUserId = interaction.user.id;
    if (cooldowns.has(discordUserId)) {
      const cooldown = cooldowns.get(discordUserId);
      const remainingTime = cooldown - Date.now();

      if (remainingTime > 0) {
        const minutes = Math.ceil(remainingTime / 1000 / 60);
        return interaction.reply({ content: `You are on cooldown. Please wait ${minutes} minutes before running this command again.`, ephemeral: true });
      }
    }

    const cooldownTime = Date.now() + 30 * 60 * 1000;
    cooldowns.set(discordUserId, cooldownTime);

    await interaction.reply({ content: 'Checking...', ephemeral: true });

    const sql = 'SELECT `rank` FROM fakenetwork_accounts WHERE discord_user_id = ?';

    pool.query(sql, [discordUserId], (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        cooldowns.delete(discordUserId);
        return interaction.editReply({ content: 'An error occurred while syncing. Please try again later.', ephemeral: true });
      }

      if (result.length === 0) {
        cooldowns.delete(discordUserId);
        return interaction.editReply({ content: 'No account found for your Discord ID.', ephemeral: true });
      }

      interaction.editReply({ content: 'Account found! Syncing roles...', ephemeral: true });

      const ranks = result[0].rank;
      const rankArray = ranks.split(',').map((rank) => rank.trim());

      const guild = interaction.guild;
      let roleMap;
      if (guild.id === '1216197789156118558') {
        staffRoleId = '1216758557803024405';
        roleMap = {
            'administrator': '1216205298579144794',
            'gamemaster': '1216859346307383466',
            'mod': '1216859344432402543',
            'helper': '1216859294839083079',
            'youtuber+': '1218372298025996429',
            'youtuber': '1218372298025996429',
            'twitch': 'TWITCH_ROLE_ID',
            'mvp++': 'MVPPLUSPLUS_ROLE_ID',
            'mvp+': 'MVPPLUS_ROLE_ID',
            'mvp': 'MVP_ROLE_ID',
            'vip+': 'VIPPLUS_ROLE_ID',
            'vip': 'VIP_ROLE_ID',
            'admin': 'ADMIN_ROLE_ID',
            'emerald': 'EMERALD_ROLE_ID',
            'diamond': 'DIAMOND_ROLE_ID',
            'gold': 'GOLD_ROLE_ID',
            'default': 'DEFAULT_ROLE_ID',
        };
    } else {
      staffRoleId = '1057800828049694730';
        roleMap = {
            'administrator': '1092450066402398371',
            'gamemaster': '1131576612563996743',
            'mod': '1130557445169758278',
            'helper': '1130557445169758278',
            'youtube': 'YOUTUBER_ROLE_ID',
            'twitch': '1130557445169758278',
            'mvp++': 'MVPPLUSPLUS_ROLE_ID',
            'mvp+': 'MVPPLUS_ROLE_ID',
            'mvp': 'MVP_ROLE_ID',
            'vip+': 'VIPPLUS_ROLE_ID',
            'vip': '1211356888122396682',
            'admin': '1130557445169758278',
            'emerald': '1130557445169758278',
            'diamond': '1130557445169758278',
            'gold': '1130557445169758278',
            'default': 'DEFAULT_ROLE_ID',
        };
    }

      const roleIds = rankArray.map((rank) => roleMap[rank]).filter(Boolean);

      
      if (guild && guild.available) {
        const member = guild.members.cache.get(discordUserId);
        if (member) {
          if (rankArray.includes('administrator') || rankArray.includes('gamemaster') || rankArray.includes('moderator')|| rankArray.includes('helper')) {
            roleIds.push(staffRoleId);
          }
          if (guild.id === '1216197789156118558') {
            roleIds.push('1218369797251661949');
          }
          const addedRoles = [];
          const currentRoles = member.roles.cache.map((role) => role.id);

          for (const roleId of roleIds) {
            if (!currentRoles.includes(roleId)) {
              const role = guild.roles.cache.get(roleId);
              if (role) {
                member.roles.add(role);
                addedRoles.push(role.name);
              }
            }
          }

          const addedRolesString = addedRoles.join(', ');

          if (addedRoles.length === 0) {
              interaction.editReply({ content: `No roles available to sync!`, ephemeral: true });
          } else {
              interaction.editReply({ content: `Roles synced successfully! Added roles: ${addedRolesString}`, ephemeral: true });
          }
        } else {
          interaction.editReply({ content: 'Failed to fetch member from the guild. Please try again later.', ephemeral: true });
        }
      } else {
        interaction.editReply({ content: 'The guild is not available. Please try again later.', ephemeral: true });
      }
    });
  },
};
