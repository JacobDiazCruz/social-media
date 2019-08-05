const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
	player_one: {
		type: mongoose.Schema.Types.Mixed,
		ref: 'user'
	},
	player_two: {
		type: mongoose.Schema.Types.Mixed,
		ref: 'user'
	},
	bets: [
		{
			user: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'user'
			},
			chips: {
				type: Number
			}
		}
	],
	betted_player: {
		type: mongoose.Schema.Types.Mixed,
		ref: 'user'
	},
	player_won: {
		type: mongoose.Schema.Types.Mixed,
		ref: 'user'
	},
	game_type: {
		type: String
	},
	date: {
		type: Date
	}
});

module.exports = Game = mongoose.model('game', GameSchema);