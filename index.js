const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const { MessageEmbed } = require("discord.js");
const config = require('./config.json');

let todos = [];

fs.readFile('todos.txt', (err, data) => {
	if (!err) {
		todos = JSON.parse(data);
	}
});

client.once('ready', () => {
	console.log(`Ready`);
});

client.on('message', async message => {
	if (message.author.bot) return; 
	if (!message.content.startsWith(config.prefix)) return;

	if (message.content === `${config.prefix}help`) {
		let embed = new MessageEmbed()
			.setTitle("Help")
			.addFields(
				{ name: "Commands", value: `${config.prefix}help\n${config.prefix}todoAdd\n${config.prefix}todoList\n${config.prefix}todoRemove\n${config.prefix}todoClear`, inline: true },
			) 
			.setColor("#F44336");
		message.channel.send(embed);
	} else if (message.content === `${config.prefix}todoList`) {
		if (todos.length === 0) {
			message.channel.send('Your to-do list is currently empty.');
			return;
		}

		const list = todos.map((todo, index) => `${index + 1}. ${todo}`).join('\n');
		message.channel.send(`Your to-do list:\n${list}`);
	} else if (message.content.startsWith(`${config.prefix}todoAdd`)) {
		const todo = message.content.slice(`${config.prefix}todoAdd`.length).trim();

		if (!todo) {
			message.channel.send('Please provide a description for the to-do item.');
			return;
		}

		todos.push(todo);

		fs.writeFile('todos.txt', JSON.stringify(todos), err => {
			if (err) {
				console.error(err);
			}
		});

		message.channel.send(`Added "${todo}" to your to-do list.`);
	} else if (message.content.startsWith(`${config.prefix}todoRemove`)) {
		const index = parseInt(message.content.slice(`${config.prefix}todoRemove`.length).trim()) - 1;

		if (isNaN(index)) {
			message.channel.send('Please provide a valid index number.');
			return;
		}

		if (index < 0 || index >= todos.length) {
			message.channel.send('Index out of range.');
			return;
		}

		const removed = todos.splice(index, 1)[0];

		fs.writeFile('todos.txt', JSON.stringify(todos), err => {
			if (err) {
				console.error(err);
			}
		});

		message.channel.send(`Removed "${removed}" from your to-do list.`);
	} else if (message.content === `${config.prefix}todoClear`) {
		const confirmMessage = await message.channel.send('Are you sure you want to clear your to-do list? React to confirm.');
		try {
			await confirmMessage.react('👍');
			const filter = (reaction, user) => user.id === message.author.id && reaction.emoji.name === '👍';
			const collected = await confirmMessage.awaitReactions(filter, { max: 1, time: 15000, errors: ['time'] });
			if (collected.size > 0) {
				todos = [];
				fs.writeFileSync('todos.txt', '');
				message.channel.send('Your to-do list has been cleared.');
			} else {
				message.channel.send('Clear action canceled.');
			}
		} catch (error) {
			confirmMessage.delete();
			message.channel.send('Clear action canceled.');
		}	
	}
});

client.login(config.token);