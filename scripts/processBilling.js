var config = require('../config')
	, mongoose = require('mongoose')
	, redis = require("redis")
	, client = redis.createClient()
	, bugsnag = require('bugsnag')
	, async = require('async')
	, stripe = config.stripe
	, moment = require('moment')

var models = require('ng-models').init(mongoose, config)

if (config.env == 'production') {
	client.auth(config.redis_key)
}

bugsnag.register("c0c7568710bb46d4bf14b3dad719dbbe", {
//	notifyReleaseStages: ["production"],
//	releaseStage: config.env
});

mongoose.connect(config.db, config.db_options);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongodb Connection Error:'));
db.once('open', function callback () {
	console.log("Mongodb connection established")
});

// How this works:
// 1. Get users
// 2. For each user, find AppProcessUptime
// 3. Mark AppProcessUptime as Paid
// 4. send @PUBLISH via Redis to Backend. Backend starts a new AppProcessUptime for the process
// 5. 

models.User.find({
	disabled: false
}).exec(function(err, users) {
	if (err) throw err;

	async.each(users, function(user, cb) {

		models.AppProcessUptime.find({
			paid: false,
			user: user._id
		}).populate('server process').exec(function(err, usages) {
			if (err) throw err;

			var now = Date.now();

			var usage = 0;
			var charges = [];
			for (var i = 0; i < usages.length; i++) {
				var minutes = usages[i].minutes;
				if (!minutes && !usages[i].end) {
					minutes = (now - usages[i].start) / 1000 / 60;
				}

				var hours = minutes / 60;
				var usage_total = usages[i].price_per_hour * hours;
				usage += usage_total;

				usages[i].paid = true;
				if (!usages[i].end) {
					usages[i].end = now;
					usages[i].minutes = Math.round(minutes);

					client.publish('server_'+usages[i].server.identifier, JSON.stringify({
						id: usages[i].process,
						action: 'restart_uptime'
					}));
				}

				usages[i].sealed = true;
				usages[i].save();

				charges.push({
					is_app: true,
					app: usages[i].app,
					name: hours.toFixed(2)+' Hours',
					description: 'Process "'+usages[i].process.name+'" - From '+moment(usages[i].start).format('DD/MM/YYYY hh:mm:ss')+' to '+moment(usages[i].end).format('DD/MM/YYYY hh:mm:ss'),
					total: usage_total,
					has_hours: true,
					hours: {
						number: hours,
						price: usages[i].price_per_hour
					}
				});
			}

			// Just rounding..
			usage = Math.round(usage * 100) / 100;

			if (usage == 0) {
				console.log("no charge.. skipping");
				cb(null);
				return;
			}

			console.log("Charging £", usage);
			var transaction = new models.Transaction({
				charges: charges,
				user: user._id,
				paid: true,
				total: usage,
				payment_method: null,
				status: 'complete',
				details: "Monthly Charge for Month "+((new Date()).getMonth() + 1),
				type: 'automatic',
				old_balance: user.balance,
			});
			user.balance -= usage;
			transaction.new_balance = user.balance;

			user.save();
			transaction.save();

			user.sendEmail("NodeGear Payment Gateway <payments@nodegear.com>", "Application Invoice", "emails/billing/automaticConfirm.jade", {
				user: user,
				transaction: transaction
			});

			cb(null);
			return;
		});

	});

})