const mongoose = require('mongoose');

const RankingSchema = new mongoose.Schema({
	player: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user'
	},
	record: [
		{
			win: {
				type: Number,
				ref: 'user'
			}
			lose: {
				type: Number,
				ref: 'user'
			}
			percentage: {
				type: Number
			}
		}
	]
});

module.exports = Ranking = mongoose.model('ranking', RankingSchema);