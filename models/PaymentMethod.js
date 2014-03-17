var mongoose = require('mongoose')
var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	type: {
		type: String,
		default: 'card'
	},
	id: String,
	name: String,
	cardholder: String,
	created: Date,
	last4: String,
	disabled: {
		type: Boolean,
		default: false
	},
	user: {
		type: ObjectId,
		ref: 'User'
	}
});

module.exports = model = mongoose.model('PaymentMethod', scheme);