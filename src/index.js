require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency.'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show the available commands.'),
  new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Show information about the bot.'),
].map((command) => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const route = GUILD_ID
    ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    : Routes.applicationCommands(CLIENT_ID);

  await rest.put(route, { body: commands });
  console.log(`Registered ${commands.length} slash commands.`);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', (bot) => {
  console.log(`Logged in as ${bot.user.tag}`);
  bot.user.setActivity('/help | James Warren Labs');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'ping') {
      return interaction.reply(`Pong! ${client.ws.ping}ms`);
    }

    if (interaction.commandName === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('Probable Carnival')
        .setDescription('Node.js Discord bot by James Warren Labs.')
        .addFields(
          { name: '/ping', value: 'Check bot latency.', inline: true },
          { name: '/help', value: 'Show this help menu.', inline: true },
          { name: '/botinfo', value: 'Show bot information.', inline: true },
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'botinfo') {
      const embed = new EmbedBuilder()
        .setTitle('Bot Information')
        .setDescription('Probable Carnival is a Node.js Discord bot.')
        .addFields(
          { name: 'Developer', value: 'James Warren Labs', inline: true },
          { name: 'Runtime', value: 'Node.js 20+', inline: true },
          { name: 'Library', value: 'discord.js v14', inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Interaction error:', error);
    const message = { content: 'Something went wrong while processing that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(message);
    else await interaction.reply(message);
  }
});

(async () => {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
})();
