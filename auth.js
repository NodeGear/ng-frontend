var passport = require('passport')
	, models = require('./models')
	, LocalStrategy = require('passport-local').Strategy

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	models.User.findById(id, function(err, user) {
		done(err, user)
	})
})

passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password'
},
function (email, password, cb) {
	models.User.findOne({ email: email }, function(err, user) {
		if (err) {
			return cb(err);
		}
		
		// TODO hash
		if (!user || user.password != password) {
			return cb(null, false, 'Incorrect credentials');
		}
		
		return cb(null, user);
	})
}))