var models = require('ng-models')

exports.map = [{
	url: '/invitations',
	call: getAll
}, {
	url: '/invitation/:invitation_id/approve',
	call: approve
}, {
	url: '/invitation/:invitation_id/reject',
	call: reject
}]

function getAll (req, res) {
	res.format({
		json: function () {
			var sort = '-created';
			var limit = 25;
			var offset = 0;

			if (req.query.sorting) {
				sort = "";
				for (var s in req.query.sorting) {
					var desc = false;
					if (req.query.sorting[s] == 'desc') {
						desc = true;
					}

					sort += (desc ? '-' : '') + s + ' ';
				}
			}
			if (req.query.count) {
				limit = parseInt(req.query.count);
			}
			if (req.query.page) {
				offset = (parseInt(req.query.page) - 1) * limit;
			}

			var query = {};
			if (req.query.filter) {
				query = req.query.filter;
				for (var q in query) {
					if (q == 'isConfirmed') {
						query[q] = !!query[q];
					} else if (!isNaN(parseInt(query[q]))) {
						query[q] = parseInt(query[q]);
					} else {
						query[q] = new RegExp(query[q], 'gi');
					}
				}
			}

			var q = models.Invitation.find(query)
			.sort(sort)
			.limit(limit)
			.skip(offset)
			.lean()
			.populate({
				path: 'user',
				select: 'name disabled email _id',
				options: {
					lean: true
				}
			})
			.populate({
				path: 'confirmed_by',
				select: 'name _id',
				options: {
					lean: true
				}
			})
			.exec(function(err, invites) {
				if (err) throw err;

				models.Invitation.count(query, function(err, total) {
                 res.send(200, {
                     total: total,
                     data: invites
                 })
             })
			})
		},
		html: function () {
			res.render('admin/invitations')
		}
	})
}

function approve (req, res) {
	models.Invitation.findOne({
		_id: req.params.invitation_id
	}).populate('user').exec(function(err, invitation) {
		invitation.isConfirmed = true;
		invitation.confirmed = Date.now();
		invitation.confirmed_by = req.user._id;
		invitation.user.invitation_complete = true;

		// Send email verification code..
		var emailVerification = new models.EmailVerification({
			email: invitation.user.email,
			user: invitation.user._id
		});

		emailVerification.generateCode(function(code) {
			emailVerification.save();

			invitation.user.sendEmail('NodeGear Registrations <registration@nodegear.com>', 'Confirm Your NodeGear Account', 'emails/register.jade', {
				user: invitation.user,
				code: code,
				host: req.hostname
			});
			invitation.user.save();
			invitation.save();

			res.send({
				message: "User Invited. They were sent an email confirmation email. Might also want to personally notify them.",
				links: [{
					back: (req.secure ? 'https' : 'http') + '://' + req.hostname + '/admin/invitations'
				}]
			})
		});
	})
}

function reject (req, res) {
	models.Invitation.findOne({
		_id: req.params.invitation_id
	}).populate('user').exec(function(err, invitation) {
		invitation.user.disabled = true;
		invitation.user.save();

		invitation.remove(function (err) {
		});

		res.send({});
	})
}