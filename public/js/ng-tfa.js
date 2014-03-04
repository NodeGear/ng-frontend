angular.module('nodecloud')

.controller('TFAController', function($scope, $http) {
	$scope.tfa = {
		hide: false,
		status: "",
		showConfirm: false,
		enabled: true,
		qr: null,
		token: ""
	};
	$scope.loginAction = false;
	
	$scope.init = function() {
		if ($scope.loginAction == true) {
			$scope.tfa.status = "Please Enter Your TFA Token"
			return;
		}
		
		$http.get('/auth/tfa').success(function(data) {
			if (data.status == 200) {
				$scope.tfa.enabled = data.enabled;
				$scope.tfa.showConfirm = !data.confirmed;
			
				if ($scope.tfa.enabled == true) {
					$scope.tfa.status = "TFA Is Enabled"
				} else {
					$scope.tfa.status = "TFA Is Disabled"
				}
				if ($scope.tfa.showConfirm) {
					$scope.tfa.status = "Please Scan the QR Code, then confirm by entering the code.";
					$scope.tfa.qr = data.qr;
				}
			}
		})
	}
	
	$scope.enableTFA = function(csrf) {
		$scope.tfa.hide = true;
		$scope.tfa.status = "Enabling...";
		
		$http.put('/auth/tfa', {
			_csrf: csrf
		}).success(function(data, status) {
			if (data.status == 200) {
				$scope.tfa.status = "Please Scan the QR Code, then confirm by entering the code.";
				$scope.tfa.showConfirm = true;
				$scope.tfa.enabled = true;
				$scope.tfa.hide = false;
				$scope.tfa.qr = data.qr;
			}
		})
	}
	
	$scope.disableTFA = function (csrf) {
		$scope.tfa.hide = true;
		$scope.tfa.status = "Disabling...";
		
		$http.delete('/auth/tfa?_csrf='+csrf).success(function(data) {
			if (data.status == 200) {
				$scope.tfa.status = "TFA Disabled.";
				$scope.tfa.enabled = false;
				$scope.tfa.confirmed = false;
				$scope.tfa.hide = false;
			} else {
				$scope.tfa.status = data.message;
				$scope.tfa.hide = false;
			}
		})
	}
	
	$scope.confirmTFA = function (csrf) {
		$scope.tfa.hide = true;
		$scope.tfa.status = "Confirming...";
		
		var token = $scope.tfa.token;
		$scope.tfa.token = "";
		
		$http.post('/auth/tfa', {
			_csrf: csrf,
			token: token
		}).success(function(data) {
			if (data.status == 200) {
				if ($scope.loginAction == true) {
					window.location = "/";
					$scope.tfa.status = "Success!";
					
					return;
				}
				
				$scope.tfa.showConfirm = false;
				$scope.tfa.enabled = true;
				$scope.tfa.hide = false;
				$scope.tfa.status = "Two Factor Authentication has been enabled."
			} else {
				$scope.tfa.status = data.message;
				$scope.tfa.hide = false;
			}
		})
	}
})