exports.authorized = function (req, res, next) {
	if (res.locals.loggedIn) {
		next()
	} else {
		res.format({
			html: function() {
				req.session.flash = [exports.buildFlash(
					["You must be logged in to access the page.."], {
						class: "info",
						title: "Please Log In!"
					})];
				res.redirect('/')
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
	}
}

exports.buildFlash = function (errs, opts) {
	if (opts.dismissable == null) {
		opts.dismissable = true;
	}
	var err = {
		class: opts.class,
		title: opts.title,
		message: "",
		dismissable: opts.dismissable
	}
	
	for (var i = 0; i < errs.length; i++) {
		err.message += errs[i];
		if (i != errs.length -1) {
			// !last
			err.message += ", ";
		}
	}
	
	return err;
}