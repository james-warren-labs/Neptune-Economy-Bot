require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

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

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'economy.json');
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const WORK_COOLDOWN = 60 * 60 * 1000;
const STARTING_BALANCE = 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return {}; }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function getUser(data, id) {
  if (!data[id]) data[id] = { wallet: STARTING_BALANCE, bank: 0, lastDaily: 0, lastWork: 0 };
  return data[id];
}
function money(n) { return `🪙 ${n.toLocaleString('en-IN')}`; }
function cooldownText(ms) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}
function total(u) { return u.wallet + u.bank; }

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ ${readyClient.user.tag} is online.`);
  console.log(`💰 Neptune Economy is ready.`);
  console.log(`📦 Client ID: ${clientId}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const user = getUser(data, interaction.user.id);
  const command = interaction.commandName;

  try {
    if (command === 'ping') return interaction.reply('🏓 Pong!');

    if (command === 'balance') {
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`💰 ${interaction.user.username}'s Balance`).setDescription(`**Wallet:** ${money(user.wallet)}\n**Bank:** ${money(user.bank)}\n**Total:** ${money(total(user))}`).setColor(0x00ae86)] });
    }

    if (command === 'daily') {
      const remaining = DAILY_COOLDOWN - (Date.now() - user.lastDaily);
      if (remaining > 0) return interaction.reply(`⏳ You already claimed your daily reward. Try again in **${cooldownText(remaining)}**.`);
      const reward = 500 + Math.floor(Math.random() * 501);
      user.wallet += reward;
      user.lastDaily = Date.now();
      saveData(data);
      return interaction.reply(`🎁 Daily reward claimed! You received **${money(reward)}**.`);
    }

    if (command === 'work') {
      const remaining = WORK_COOLDOWN - (Date.now() - user.lastWork);
      if (remaining > 0) return interaction.reply(`⏳ You can work again in **${cooldownText(remaining)}**.`);
      const reward = 100 + Math.floor(Math.random() * 401);
      user.wallet += reward;
      user.lastWork = Date.now();
      saveData(data);
      return interaction.reply(`💼 You worked hard and earned **${money(reward)}**!`);
    }

    if (command === 'deposit') {
      const amount = interaction.options.getInteger('amount');
      if (amount > user.wallet) return interaction.reply('❌ You do not have enough money in your wallet.');
      user.wallet -= amount; user.bank += amount; saveData(data);
      return interaction.reply(`🏦 Deposited **${money(amount)}** into your bank.`);
    }

    if (command === 'withdraw') {
      const amount = interaction.options.getInteger('amount');
      if (amount > user.bank) return interaction.reply('❌ You do not have enough money in your bank.');
      user.bank -= amount; user.wallet += amount; saveData(data);
      return interaction.reply(`💵 Withdrew **${money(amount)}** from your bank.`);
    }

    if (command === 'pay') {
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      if (target.bot) return interaction.reply('❌ You cannot pay a bot.');
      if (target.id === interaction.user.id) return interaction.reply('❌ You cannot pay yourself.');
      if (amount > user.wallet) return interaction.reply('❌ You do not have enough money.');
      const receiver = getUser(data, target.id);
      user.wallet -= amount; receiver.wallet += amount; saveData(data);
      return interaction.reply(`💸 Sent **${money(amount)}** to **${target.username}**.`);
    }

    if (command === 'richest') {
      const entries = Object.entries(data).sort((a, b) => total(b[1]) - total(a[1])).slice(0, 10);
      const lines = entries.length ? entries.map(([id, u], i) => `**${i + 1}.** <@${id}> — ${money(total(u))}`) : ['No economy users yet.'];
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🏆 Neptune Richest').setDescription(lines.join('\n')).setColor(0xffd700)] });
    }

    if (command === 'help') {
      return interaction.reply('💰 **Neptune Economy Commands**\n`/balance` `/daily` `/work` `/deposit` `/withdraw` `/pay` `/richest`');
    }
  } catch (error) {
    console.error(error);
    const message = { content: '❌ Something went wrong while processing that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) return interaction.followUp(message);
    return interaction.reply(message);
  }
});

client.login(token).catch((error) => {
  console.error('Failed to login to Discord:', error.message);
  process.exit(1);
});
