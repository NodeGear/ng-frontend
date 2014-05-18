define([
	'angular',
	'app',
	'moment',
	'../services/csrf'
], function(angular, app, moment) {
	app.registerController('PaymentMethodsController', function ($scope, $http, $rootScope, csrf) {
		$scope.cards = [];
		
		$scope.init = function () {
			// get cards
			$scope.getCards()
		}
		
		$scope.getCards = function () {
			$http.get('/profile/cards').success(function(data, status) {
				if (data.status == 200) {
					$scope.cards = data.cards;
				}
				
				if (!$scope.$$phase) {
					$scope.$digest()
				}
			})
		}
	})
	
	.registerController('PaymentMethodController', function($scope, $http, $state, csrf, paymentMethod) {
		$("#paymentMethodModal").modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('profile.billing.paymentMethods');
		});

		$scope.cardFormDisabled = false;
		$scope.card = paymentMethod.paymentMethod;

		$scope.getNewCard = function () {
			return {
				_id: '',
				name: '',
				cardholder: '',
				number: '',
				expiry: '',
				cvc: '',
				default: true,
				errors: {
					name: 'inherit',
					number: 'inherit',
					cvc: 'inherit',
					expiry: 'inherit'
				}
			};
		}

		$scope.init = function (stripe_pub) {
			require(['https://js.stripe.com/v2/'], function() {
				Stripe.setPublishableKey(stripe_pub);
			})
		}

		if ($scope.card._id == '') {
			$scope.card = $scope.getNewCard();
		} else {
			$scope.card.number = 'XXXX XXXX XXXX '+$scope.card.last4;
			$scope.card.cvc = 'XXX';
			$scope.card.expiry = 'XX/XXXX';
			$scope.card.errors = {
				name: 'inherit',
				number: 'inherit',
				cvc: 'inherit',
				expiry: 'inherit'
			}
		}

		$scope.cardResponse = function (status, response) {
			if (response.error) {
				$scope.status = response.error.message;
				$scope.cardFormDisabled = false;
			} else {
				$scope.status = "Saving Card...";
				
				var data = {
					_csrf: csrf.csrf,
					card_id: response.id,
					name: $scope.card.name,
					default: $scope.card.default
				};
				
				$http.post('/profile/card', data).success(function(data, status) {
					if (data.status == 200) {
						$scope.card.number = "XXXX XXXX XXXX "+response.card.last4
						if ($scope.card.cvc.length > 0) {
							$scope.card.cvc = "XXX"
						}
						$scope.card.expiry = "XX/XXXX";
						
						$scope.status = "Card Saved";
						$scope.getCards();
						$scope.$parent.getCards();
						$("#paymentMethodModal").modal('hide');
					} else {
						$scope.status = data.message;
					}
					
					$scope.cardFormDisabled = false;
					
				}).error(function(data, status) {
					$scope.cardFormDisabled = false;
					$scope.status = "The Request has Failed. Please try again later."
				})
			}
		
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}
		
		$scope.validateCard = function () {
			var valid = true;
		
			if ($scope.card.cardholder.length == 0) {
				$scope.card.errors.name = 'red';
				valid = false;
			} else {
				$scope.card.errors.name = 'inherit'
			}
		
			if ($scope.card._id.length > 0 || Stripe.card.validateCardNumber($scope.card.number)) {
				$scope.card.errors.number = 'inherit';
			} else {
				$scope.card.errors.number = 'red';
				valid = false;
			}
		
			var expiry = $scope.card.expiry;
			if ($scope.card._id.length > 0) {
				// do not check expiry date
			} else if (expiry.length == 0) {
				valid = false;
				$scope.card.errors.expiry = 'red';
			} else {
				var split = expiry.split('/');
				if (split.length != 2) {
					valid = false
					$scope.card.errors.expiry = 'red';
				} else {
					if (Stripe.card.validateExpiry(split[0], split[1])) {
						$scope.card.errors.expiry = 'inherit';
					} else {
						valid = false
						$scope.card.errors.expiry = 'red';
					}
				}
			}
		
			if ($scope.card._id.length == 0 && $scope.card.cvc.length != 0 && !Stripe.card.validateCVC($scope.card.cvc)) {
				$scope.card.errors.cvc = 'red';
				valid = false;
			} else {
				$scope.card.errors.cvc = 'inherit'
			}
		
			return valid;
		}

		$scope.saveCard = function () {
			if ($scope.cardFormDisabled) return;
			
			if ($scope.validateCard()) {
				$scope.status = "Validating Card..."
				$scope.cardFormDisabled = true;
				
				if ($scope.card._id.length > 0) {
					// Update the card
					return $scope.updateCard();
				}
				
				var expiry = $scope.card.expiry;
				var split = expiry.split('/');
				
				Stripe.card.createToken({
					number: $scope.card.number,
					cvc: $scope.card.cvc,
					exp_month: split[0],
					exp_year: split[1],
					name: $scope.card.cardholder
				}, $scope.cardResponse);
			}
		}
		
		$scope.updateCard = function () {
			$http.put('/profile/card', {
				_csrf: csrf.csrf,
				card: $scope.card._id,
				cardholder: $scope.card.cardholder,
				name: $scope.card.name,
				default: $scope.card.default
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Saved.";
					$scope.$parent.getCards();
					$("#paymentMethodModal").modal('hide');
				} else {
					$scope.status = data.message;
				}
				
				$scope.cardFormDisabled = false;
			}).error(function(data, status) {
				$scope.status = "Request Failed. Please Try Again";
				$scope.cardFormDisabled = false;

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}

		$scope.deleteCard = function () {
			$http.delete('/profile/card?_id='+$scope.card._id+'&_csrf='+csrf.csrf)
			.success(function(data, status) {
				if (data.status == 200) {
					$scope.$parent.getCards();
					$("#paymentMethodModal").modal('hide');
				} else {
					alert(data.message);
				}
			})
		}
	})
});