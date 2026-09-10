require('dotenv').config();

const { Client, GatewayIntentBits, Events } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

if (!clientId) {
  console.error('Missing CLIENT_ID in environment.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ ${readyClient.user.tag} is online.`);
  console.log(`📦 Client ID: ${clientId}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply({ content: '🏓 Pong!', ephemeral: true });
  }
});

client.login(token).catch((error) => {
  console.error('Failed to login to Discord:', error.message);
  process.exit(1);
});
