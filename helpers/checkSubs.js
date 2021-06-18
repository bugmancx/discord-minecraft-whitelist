const config = require('../config.json');
const { updatePlayer, removePlayer } = require('./player');
const { sendRcon } = require('./rcon');
const Discord = require('discord.js');

const checkSubs = () => {
  const players = global.db.get('players').value();
  console.log(players.length);
  let users = {
    removed: [],
    gracePeriod: [],
  };

  global.client.channels.cache
    .get(config.channels.debug)
    .send('Checking all users')
    .then(async (message) => {
      for (let player of players) {
        var discordMember = null;

        try {
          discordMember = await message.guild.members.fetch(player.discordID);
        } catch (e) {
          console.log(
            `${player.minecraftUser} is no longer in Discord, removing from the whitelist and the system`
          );
          sendRcon(`whitelist remove ${player.minecraftUser}`);
          removePlayer('id', player.discordID);
          continue;
        }

        if (discordMember.roles.cache.has(config.subRole)) {
          console.log(
            `${player.minecraftUser} has SMP-Server role, ensuring they're on the whitelist`
          );
          updatePlayer(player.discordID, {
            subbed: true,
            cyclesSinceSubLost: false,
          });
          sendRcon(`whitelist add ${player.minecraftUser}`);

// ## FINSHED ADDED TO WHITELIST

// ## CHECK NOW FOR OTHER LOGIC BEFORE PROCEEDING

          if (discordMember.roles.cache.has(config.patreonRole)) {
             console.log(` > ${player.minecraftUser} is a Patreon.`);
             updatePlayer(player.discordID, {
               patreon: true,
             });
             // Loop tiers

             // DRAGONFLY
             if (discordMember.roles.cache.has(config.patreonDragonflyRole)) {
                console.log(` >> ${player.minecraftUser} is a Dragonfly Patreon. Updating player data.`);
                updatePlayer(player.discordID, {
                patreonTier: 'dragonfly',
              });
             }

             // BUTTERFLY
             if (discordMember.roles.cache.has(config.patreonButterflyRole)) {
                console.log(` >> ${player.minecraftUser} is a Butterfly Patreon. Updating player data.`);
                updatePlayer(player.discordID, {
                patreonTier: 'butterfly',
              });
             }

             // MANTIS
             if (discordMember.roles.cache.has(config.patreonMantisRole)) {
                console.log(` >> ${player.minecraftUser} is a Mantis Patreon. Updating player data.`);
                updatePlayer(player.discordID, {
                patreonTier: 'mantis',
              });
             }

             // SCARAB
             if (discordMember.roles.cache.has(config.patreonScarabRole)) {
                console.log(` >> ${player.minecraftUser} is a Scarab Patreon. Updating player data.`);
                updatePlayer(player.discordID, {
                patreonTier: 'scarab',
              });
             }


          } // else { // END PATREON LOGIC 
              // Not patreon, remove that data
 //                updatePlayer(player.discordID, {
   //              patreonTier: 'false',
     //            patreon: 'false',
       //      }),
//          }

          if (!discordMember.roles.cache.has(config.patreonRole)) {
             updatePlayer(player.discordID, {
               patreon: false,
               patreonTier: false,
             });
          }

          continue;

        } // END SMP-SERVER ROLE LOGIC

        if (!player.whitelisted) {
          console.log(
            `${player.minecraftUser} is not on the whitelist, ignoring them`
          );
          continue;
        }

        if (player.cyclesSinceSubLost || config.gracePeriod === 0) {
          let cycles = player.cyclesSinceSubLost;
          cycles += 1;

          if (cycles >= config.gracePeriod) {
            console.log(
              `${player.minecraftUser} has exceeded the grace period, removing from the whitelist`
            );
            sendRcon(`whitelist remove ${player.minecraftUser}`);
            updatePlayer(player.discordID, {
              subbed: false,
              cyclesSinceSubLost: false,
              whitelisted: false,
            });

            users.removed.push(discordMember.displayName);
          } else {
            console.log(
              `${player.minecraftUser} is within the grace period, updating their information`
            );
            updatePlayer(player.discordID, {
              subbed: false,
              cyclesSinceSubLost: cycles,
            });

            users.gracePeriod.push(discordMember.displayName);
          }
        } else {
          console.log(
            `${player.minecraftUser} has started the grace period, updating their information`
          );
          updatePlayer(player.discordID, {
            subbed: false,
            cyclesSinceSubLost: 1,
          });

          users.gracePeriod.push(discordMember.displayName);
        }
      }

      const embedReport = new Discord.MessageEmbed()
        .setColor('#AD1041')
        .setTitle('User Check Report')
        .setDescription(
          'Some user may have been removed from the whitelist. See the report below.'
        )
        .addFields(
          {
            name: 'Users Removed',
            value: users.removed.length ? users.removed.join(', ') : 'None',
          },
          {
            name: 'Users in the Grace Period',
            value: users.gracePeriod.length
              ? users.gracePeriod.join(', ')
              : 'None',
          }
        );
      message.edit(embedReport);
    });

  return;
};

module.exports = checkSubs;

