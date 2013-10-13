var passport = require('passport')
	, models = require('./models')

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	models.User.findById(id, function(err, user) {
		done(err, user)
	})
})