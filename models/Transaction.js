var mongoose = require('mongoose')
	, schema = mongoose.Schema
	, ObjectId = schema.ObjectId
	
var scheme = schema({
	drones: [{
		drone: { type: ObjectId, ref: 'Drone' },
		name: String, // Name of the Drone.. Just in case
		// Price Class?
		hours: { type: Number, default: 0 }, // total hours invoiced
		charge: { type: Number, default: 0 }, // hours * price
		price: { type: Number, default: 0 } // price per hour
	}],
	total: Number, //what user got charged
	user: { type: ObjectId, ref: 'User' },
	card: { type: ObjectId }, // user.stripe_cards
	created: { type: Date, default: Date.now },
	status: { type: String, default: 'pending' }, // complete | cancelled | pending | failed
	details: String, // additional details
	payment_id: String, //payment id
	type: { type: String, default: 'automatic' }, // manual | automatic
	old_balance: { type: Number, default: 0 },
	new_balance: { type: Number, default: 0 }
})

module.exports = mongoose.model("Transaction", scheme);