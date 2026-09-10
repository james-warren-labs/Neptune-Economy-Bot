require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check if Neptune is online'),
  new SlashCommandBuilder().setName('balance').setDescription('View your wallet and bank balance'),
  new SlashCommandBuilder().setName('daily').setDescription('Claim your daily reward'),
  new SlashCommandBuilder().setName('work').setDescription('Work to earn coins'),
  new SlashCommandBuilder().setName('deposit').setDescription('Deposit coins into your bank').addIntegerOption(o => o.setName('amount').setDescription('Amount to deposit').setMinValue(1).setRequired(true)),
  new SlashCommandBuilder().setName('withdraw').setDescription('Withdraw coins from your bank').addIntegerOption(o => o.setName('amount').setDescription('Amount to withdraw').setMinValue(1).setRequired(true)),
  new SlashCommandBuilder().setName('pay').setDescription('Pay another user').addUserOption(o => o.setName('user').setDescription('User to pay').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Amount to pay').setMinValue(1).setRequired(true)),
  new SlashCommandBuilder().setName('richest').setDescription('View the richest Neptune users'),
  new SlashCommandBuilder().setName('help').setDescription('Show Neptune economy commands')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) throw new Error('DISCORD_TOKEN and CLIENT_ID are required.');
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log(`✅ Registered ${commands.length} global slash commands.`);
})().catch(console.error);
