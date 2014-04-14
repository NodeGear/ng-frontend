define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('PaymentMethodsController', function ($scope, $http, $rootScope) {
		$scope.cards = [];
		$scope.cardFormDisabled = false;
		$scope.csrf = "";
		$scope.card = {};
		$scope.showEditCard = false;
		
		$scope.init = function (csrf, key) {
			$scope.csrf = csrf;
			require(['https://js.stripe.com/v2/'], function() {
				Stripe.setPublishableKey(key);
			})
			
			// get cards
			$scope.getCards()
			
			$scope.card = $scope.getNewCard();
		}
		
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
		
		$scope.addCard = function () {
			$scope.card = $scope.getNewCard();
			$scope.showEditCard = true;
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

		$scope.makeDefault = function (card) {
			for (var i = 0; i < $scope.cards.length; i++) {
				$scope.cards[i].default = false;
			}

			card.default = true;
			
			$http.put('/profile/card', {
				_csrf: $scope.csrf,
				_id: card._id,
				cardholder: card.cardholder,
				name: card.name,
				default: card.default
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.getCards()
				} else {
					alert("Could not card as default: "+data.message);
				}
			}).error(function(data, status) {
				alert("Request to save a new default card has failed. Please Try Again later");
			});
		}
		
		$scope.cancelSave = function () {
			$scope.card = $scope.getNewCard();
			$scope.showEditCard = false;
			$scope.status = "";
		}
		
		$scope.selectCard = function (card) {
			$scope.card = {
				_id: card._id,
				number: 'XXXX XXXX XXXX '+card.last4,
				name: card.name,
				cardholder: card.cardholder,
				cvc: 'XXX',
				expiry: 'XX/XXXX',
				default: card.default,
				errors: {
					name: 'inherit',
					number: 'inherit',
					cvc: 'inherit',
					expiry: 'inherit'
				}
			}
			$scope.showEditCard = true;
			$scope.status = "";
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
				_csrf: $scope.csrf,
				card: $scope.card._id,
				cardholder: $scope.card.cardholder,
				name: $scope.card.name,
				default: $scope.card.default
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Saved.";
					$scope.getCards()
					$scope.showEditCard = false;
					$scope.status = "";
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
		
		$scope.deleteCard = function (card) {
			$http.delete('/profile/card?_csrf='+$scope.csrf+'&_id='+card._id)
			.success(function(data, status) {
				if (data.status == 200) {
					$scope.getCards();
				} else {
					alert(data.message);
				}
			})
		}
		
		$scope.cardResponse = function (status, response) {
			if (response.error) {
				$scope.status = response.error.message;
				$scope.cardFormDisabled = false;
			} else {
				$scope.status = "Saving Card...";
				
				var data = {
					_csrf: $scope.csrf,
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
						$scope.showEditCard = false;
						$scope.status = "";
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
	})
});