
/**
 * Push notifications
 * https://www.parse.com/
 * 
 * iOS basics from here: https://parse.com/questions/push-notifications-when-using-titanium
 * Android basics from here: https://github.com/timanrebel/Parse/tree/master/android
 * 
 * JSON:
 * 
 * {
 *	"alert": "TEST - alert",
 *	"badge": "Increment",			// iOS only
 * 	"sound": "chime",				// iOS only
 * 	"title": "TEST - title"			// Android only
 *  "category" : "TEST - category"	// iOS only
 *	}
 * 
 * Add the following lines to tiapp.xml and include the bits:
 * https://dashboard.parse.com/apps/parsetest--2438/settings/keys
 * <property name="Parse_AppId" type="string"></property>
 * <property name="Parse_ClientKey" type="string"></property> 
 * 
 */


//bootstrap and check dependencies
if (Ti.version < 1.8) {
	alert('Sorry - this application template requires Titanium Mobile SDK 1.8 or later');
}
 
// ANDROID
function initializePushAndroid(){
	console.log("======== initializePushAndroid");
	
	var Parse = require('eu.rebelcorp.parse');
    Parse.start();
    
    Parse.addEventListener('notificationreceive', function(e) {
        Ti.API.log("notification: ", JSON.stringify(e));
    });

    Parse.addEventListener('notificationopen', function(e) {
        Ti.API.log("notification: ", JSON.stringify(e));
    });
}


// iOS
function initializePushIOS(){
	console.log("======== initializePushIOS");
	console.log("======== iOS Version: "+parseInt(Titanium.Platform.version));

	if (parseInt(Titanium.Platform.version) >= 8 && parseFloat(Ti.version) > 3.3) {
		console.log("======== iOS >= 8 detected");

		Ti.App.iOS.addEventListener('usernotificationsettings', e = function() {
			Ti.App.iOS.removeEventListener('usernotificationsettings', e);
			Ti.Network.registerForPushNotifications({
				success : deviceTokenSuccess,
				error : deviceTokenError,
				callback : receivePushIOS
			});
		});

		Ti.App.iOS.registerUserNotificationSettings({
			types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
		});
	} else {
		console.log("======== iOS <= 7 detected");
		Ti.Network.registerForPushNotifications({
			types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE],
			success : deviceTokenSuccess,
			error : deviceTokenError,
			callback : receivePushIOS
		});
	}

	function receivePushIOS(e) {
		var message;
		if (e['aps'] !== undefined) {
			if (e['aps']['alert'] !== undefined) {
			if (e['aps']['alert']['body'] !== undefined) {
				message = e['aps']['alert']['body'];
			} else {
				message = e['aps']['alert'];
			}
				} else {
					message = 'No Alert content';
				}
			} else {
				message = 'No APS content';
			}
		alert(message);
	}
}

function deviceTokenSuccess(e) {
    deviceToken = e.deviceToken;
    console.info("======== Device Token received: " + deviceToken);

	var request = Titanium.Network.createHTTPClient({
		onload: function(e) {
			if (request.status != 200 && request.status != 201) {
				request.onerror(e);
				return;
			}
		},
		onerror: function(e) {
			Ti.API.info("Push Notifications registration with Parse failed. Error: " + e.error);
		}
	});

	var params = {
		'deviceType': 'ios',
		'deviceToken': e.deviceToken,
		'channels': ['']
	};

	// Register device token with Parse
	request.open('POST', 'https://api.parse.com/1/installations', true);
	request.setRequestHeader('X-Parse-Application-Id', '-----------');
	request.setRequestHeader('X-Parse-REST-API-Key', '-----------');
	request.setRequestHeader('Content-Type', 'application/json');
	
	request.send(JSON.stringify(params));
}

function deviceTokenError(e) {
    alert('Failed to register for push notifications! ' + e.error);
}


// GO
(function() {
	var osname = Ti.Platform.osname,
		version = Ti.Platform.version,
		height = Ti.Platform.displayCaps.platformHeight,
		width = Ti.Platform.displayCaps.platformWidth;

	function checkTablet() {
		var platform = Ti.Platform.osname;
		
		switch (platform) {
			case 'ipad':
				return true;
			case 'android':
				var psc = Ti.Platform.Android.physicalSizeCategory;
				var tiAndroid = Ti.Platform.Android;
				return psc === tiAndroid.PHYSICAL_SIZE_CATEGORY_LARGE || psc === tiAndroid.PHYSICAL_SIZE_CATEGORY_XLARGE;
		default:
			return Math.min(
				Ti.Platform.displayCaps.platformHeight,
				Ti.Platform.displayCaps.platformWidth
			) >= 400;
		}
	}

	var isTablet = checkTablet();
	console.log(isTablet);

	var Window;

	if (isTablet) {
		if (osname === 'android') {
			initializePushAndroid();
		} else {
			initializePushIOS();
		}
		Window = require('ui/tablet/ApplicationWindow');
	} else {
		if (osname === 'android') {
			initializePushAndroid();
			Window = require('ui/handheld/android/ApplicationWindow');
		} else {
			console.log("START IOS");
			initializePushIOS();
			Window = require('ui/handheld/ApplicationWindow');
		}
	}

	new Window().open();
})();

