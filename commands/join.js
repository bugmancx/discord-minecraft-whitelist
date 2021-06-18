const { sendRcon } = require('../helpers/rcon.js');
const { getPlayer, updatePlayer, createPlayer } = require('../helpers/player');
const { subRole, address } = require('../config.json');

module.exports = {
  args: true,
  name: 'join',
  description: 'Add yourself to the server allowlist!',
  aliases: ['add'],
  usage: '<minecraftusername>',
  cooldown: 0,
  guildOnly: true,
  execute(message, args) {
    const id = message.member.id;
    let player = getPlayer(id);
    const subbed = message.member.roles.cache.has(subRole);

    if (!player) {
      createPlayer(id, args[0], false, subbed, !subbed);

      player = getPlayer(id);
    }

    if (player.whitelisted) {
      message.reply(
        'You already have have already have an account on the server\'s allowlist. To correct this, try `!mc reset` to remove it, and then try again with `!mc join`.'
      );
      return;
    }

    if (!player.subbed) {
      if (subbed) {
        updatePlayer(id, { subbed: true, cyclesSinceSubLost: false });
      } else {
        message.reply(
          'You need to have the `SMP` role in order to be able to access the server.'
        );
        return;
      }
    }

    sendRcon(`whitelist add ${args[0]}`).then((reply) => {
      let encodedReply = JSON.parse(JSON.stringify(reply));
      const expectedReplies = [
// Note: These are server responses
        `added ${args[0]} to the whitelist`.toLowerCase().trim(),
        `§a${args[0]} has been added to the whitelist.`.toLowerCase().trim(),
      ];
      console.log(expectedReplies);
      if (expectedReplies.includes(encodedReply.toLowerCase().trim())) {
        updatePlayer(id, { whitelisted: true });
        message.reply("Your account has been added!");
        message.author.send(
          'Thanks for your interest in joining bugmancx\'s free Minecraft SMP servers!\n\nYour account has now been activated and will give you access to both public servers.\n\nPlease take a moment to familiarise yourself with the rules posted in the #👉welcome-smp channel. You will also find instructions on how to join each server in its respective FAQ channel.\n\nPlease enjoy yourself and reach out if you have any questions.');
      } else {
        message.reply(
          'There was an error adding you to the allowlist. The server returned this message: ' +
            reply
        );
      }
    });
  },
};
