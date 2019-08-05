const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, async(req,res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch(err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});


// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post('/', 
	[
		check('email', 'Email is required').isEmail(),
		check(
			'password', 
			'Password is required'
		).exists()
	],
	async(req,res) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { email, password } = req.body;

		try {
			//See if invalid user credentials
			let user = await User.findOne({ email });

			if (!user) {
				return res
					.status(400)
					.json({ error: [{ msg: 'Invalid Credentials'}] });
			}
			
			// match using bcrypt
			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return res
					.status(400)
					.json({error: [{ msg: 'Invalid Credentials'}] });
			}

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