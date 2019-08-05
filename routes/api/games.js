const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Game = require('../../models/Game');

// @route GET api/games
// @desc  Get all Games
// @route Public
router.get('/', auth, async(req, res) => {
	try {
		const game = await Game.find();
		res.json(game);
	
	} catch(err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route GET api/game/game_id
// @desc  Get game by game_id
// @route Public
router.get('/:game_id', async(req, res) => {
	try {
		const game = await Game.findOne({ _id: req.params.game_id });

		if(!game) return res.status(400).json({ msg: 'Game not found'});
		res.json(game);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route DELETE /api/games/
// @desc  DELETE all documents
// @route Private admin 1
router.delete('/', auth, async(req, res) => {
	try {

		const game = await Game.deleteMany();
		res.json({ msg: 'Games deleted' });

	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});




// @route    GET api/player_two/playertwo_userId
// @desc     Get profile by user id
// @access   Public
router.get('/player_two/:playertwo_userId', async(req,res) => {
	try {

		const player_two = await Game
			.find({ player_two: req.params.playertwo_userId});

		if(!player_two) return res.status(400).json({ msg: 'Player not found'});
		res.json(player_two);

		console.log(player_two);

	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});
// @route    GET api/profile/user_id
// @desc     Get profile by user id
// @access   Public
router.get('/player_one/:playerOne_userId', async(req,res) => {
	try {

		const player_one = await Game
			.find({ player_one: req.params.playerOne_userId});

		if(!player_one) return res.status(400).json({ msg: 'Player not found'});
		res.json(player_one);

		console.log(player_one);

	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});



// @route POST api/games
// @desc  Create and Update a Game Schedule
// @route Private
router.post('/', auth, async(req, res) => {

	// Check errors and validation
	const errors = validationResult(req);
		if(!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	// Fetch user model and input to player_one and two
	const user = await User.find();
	
	// pull out fields from model
	// const {
	// 	player_one,
	// 	player_two,
	// 	player_won,
	// 	game_type,
	// 	date,
	// } = req.body;

	// Build game object
	// const gameFields = {};
	// if(player_one) gameFields.player_one = player_one;
	// if(player_two) gameFields.player_two = player_two;
	// if(game_type) gameFields.game_type = game_type;
	// if(date) gameFields.date = date;

	// Build Bets object
	// gameFields.bets = {};
	// gameFields.bets.user = req.user.id;

	try {
		// Fetch user model and input to player_one and two
		const user = await User.find();
		// fetch Game model
		// let game = await Game.find();

		const newGame = new Game({
			player_one: req.body.player_one,
			player_two: req.body.player_two,
			game_type: req.body.game_type,
			date: req.body.date
		});

		const game = await newGame.save();
		res.json(game);

		console.log(chips);

		// Create A Game
		// game = new Game(gameFields);
		// await game.save();
		// res.json(game);

	} catch(err) {
		console.error(err.message);
		res.status(400).send('Server Error');
	}

});


// @route  PATCH api/game/game_id
// @desc   Update the fields bets and betted_player
// @route  Private
router.patch('/:game_id', auth, async(req, res) => {
	try {

		// fetch user.chips by userId
		let userBet = await User.findById(req.user.id).select('chips');
		
		// destructure chips
		const {chips, betted_player} = req.body;
		
		// fetch gameFields
		const gameFields = {};
		if(betted_player) gameFields.betted_player = betted_player;

		gameFields.bets = {};
		if(chips) gameFields.bets.chips = chips;
		
		console.log(userBet.chips + 'This is my chip before betting')

		// condition to recognize or validate the amount of bet of the user
		if(chips < userBet.chips || chips === userBet.chips) {
			let myBet = gameFields.bets.chips = chips;

			// deduct the amount of bet to the total bet of user
			userBet.chips -= myBet;
			await userBet.save();
			
			console.log(myBet + 'This is my bet');	
			console.log(userBet.chips + 'This is my user chip after betting');

		} else if(chips > userBet.chips) {
			res.status(404).send('Not enough chips')
		};

		// Update game.chips and game.betted_player
		const game = await Game.findOneAndUpdate(
			{ _id: req.params.game_id },
			{ $set: { 'bets.0.chips': req.body.chips, 'betted_player': req.body.betted_player} },
			{ new: true }
		);
		
		res.json(game);


	} catch(err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}

});

// @route  PUT api/game/game_id
// @desc   Update player_won
// @route  Private
router.put('/:game_id', auth, async(req, res) => {
	
	try {
		
		// fetch user.chips by userId
		
		const {player_won} = req.body;

		let betAmount = await Game.distinct('bets.0.chips', { _id: req.params.game_id }); // amount of bet

		let userBet = await User.findById(req.user.id).select('chips'); // chips from user

		let myBet = await Game.distinct('betted_player._id', { _id: req.params.game_id }); // player who i bet to
		
		// convert myBet to a string
		const betted_player = myBet.toString();
		
		// convert betAmout to an integer
		const bet_amount = parseInt(betAmount);

		// Update player_won
		const game = await Game.findOneAndUpdate(
			{ _id: req.params.game_id },
			{ $set: { player_won: req.body.player_won} },
			{ new: true }
		);

		// condition to match player_won with amount of bet
		if( bet_amount === 50 && betted_player == player_won._id) {
			userBet.chips += 150;
			await userBet.save();
			console.log(userBet.chips + 'This is my 50 winning bet');
		} else if( bet_amount === 100 && betted_player == player_won._id) {
			userBet.chips += 250;
			await userBet.save();
			console.log(userBet.chips + 'This is my 100 winning bet');
		} else if( bet_amount === 150 && betted_player == player_won._id) {
			userBet.chips += 400;
			await userBet.save();
			console.log(userBet.chips + 'This is my 150 winning bet');
		} else if( bet_amount === 200 && betted_player === player_won._id) {
			userBet.chips += 500;
			await userBet.save();
			console.log(userBet.chips + 'This is my 200 winning bet');
		} else if( bet_amount === 250 && betted_player === player_won._id) {
			userBet.chips += 500;
			await userBet.save();
			console.log(userBet.chips + 'This is my 250 winning bet');
		} else if( bet_amount === 300 && betted_player === player_won._id) {
			userBet.chips += 600;
			await userBet.save();
			console.log(userBet.chips + 'This is my 300 winning bet');
		} else if( bet_amount === 400 && betted_player === player_won.name) {
			userBet.chips += 800;
			await userBet.save();
			console.log(userBet.chips + 'This is my 400 winning bet');
		} else if( bet_amount === 500 && betted_player === player_won.name) {
			userBet.chips += 1000;
			await userBet.save();
			console.log(userBet.chips + 'This is my 500 winning bet');
		} else {
			res.status(404).send('No bet');
		}


		console.log(userBet.chips + 'This is my bet after winning');


		res.json(game);

	} catch(err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	};
});

module.exports = router;