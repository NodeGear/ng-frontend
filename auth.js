var passport = require('passport')
	, models = require('ng-models')

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	models.User.findOne({
		_id: id,
		disabled: false
	}, function(err, user) {
		done(err, user)
	})
})