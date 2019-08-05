const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');

// @route POST api/users
// @desc Register user
// @access Public
// set validation
router.post('/', 
	[
		check('name', 'Name is required').not().isEmpty(),
		check('email', 'Email is required').isEmail(),
		check('password', 'Please enter password with 6 or more characters')
		.isLength({min: 6})
	],
	async(req,res) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {name, email, password} = req.body;

		try {
			//See if user exists
			let user = await User.findOne({ email });

			if (user) {
				return res.status(400).json({ error: [{ msg: 'User already exists'}] });
			}

			//Get users gravatar
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				p: 'mm'
			});

			// generate a Default total BETS
			const chips = 5;
			
			// generate a Default value for win and lose
			const total_wins = 0;
			const total_lose = 0;

			// generate a USER role
			const role = 1;

			user = new User({
				name,
				email,
				avatar,
				password,
				chips,
				total_wins,
				total_lose,
				role
			});

			//NOTE TO ENCRYPT USER ROLE
			// const roleSalt = await bcrypt.genSalt(10);
			// user.role = await bcrypt.hash(role, roleSalt);

			//Encrypt password and save
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);
			await user.save();

			//Return jwt
			//Note: we could use id because mongoose has id and not __id
			const payload = {
				user: {
					id: user.id
				}
			}
			
			// sign the token pass payload, secret and draw callback
			jwt.sign(payload, config.get('jwtSecret'), 
			{ expiresIn: 360000 },
			(err, token) => {
				if(err) throw err; 
				res.json({ token });
			});


		} catch(err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
});

module.exports = router;