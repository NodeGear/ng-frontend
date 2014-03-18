var mongoose = require('mongoose')
	, schema = mongoose.Schema
	, ObjectId = schema.ObjectId

// Serves as invoice, as well as Transaction.
// Unpaid invoices are to be marked with paid: false, status: pending
var scheme = schema({
	charges: [{
		is_app: {
			type: Boolean,
			default: false
		},
		app: {
			type: ObjectId,
			ref: 'Drone'
		},
		
		name: String, // Name of the Charge..
		description: String,
		total: {
			type: Number,
			default: 0
		},

		has_hours: {
			type: Boolean,
			default: false
		},
		hours: { // Total Hours invoiced
			number: {
				type: Number,
				default: 0
			},
			price: {
				type: Number,
				default: 0
			}
		},
	}],
	paid: {
		type: Boolean,
		default: false
	},
	//what user got charged
	total: Number,
	user: {
		type: ObjectId,
		ref: 'User'
	},
	payment_method: {
		type: ObjectId,
		ref: 'PaymentMethod'
	},
	created: {
		type: Date,
		default: Date.now
	},
	// created | complete | cancelled | pending | failed
	status: {
		type: String,
		default: 'created'
	},
	// additional details
	details: String,
	//payment id
	payment_id: String,
	 // manual | automatic
	type: {
		type: String,
		default: 'automatic'
	},
	old_balance: {
		type: Number,
		default: 0
	},
	new_balance: {
		type: Number,
		default: 0
	}
})

module.exports = mongoose.model("Transaction", scheme);