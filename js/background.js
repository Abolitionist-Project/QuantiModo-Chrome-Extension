/***
****	EVENT HANDLERS
***/

/*
**	Called when the extension is installed
*/
chrome.runtime.onInstalled.addListener(function() 
{
	//var notificationInterval = parseInt(localStorage["notificationInterval"] || "180");
	var notificationInterval = -1;
	
	if(notificationInterval == -1)
	{
		chrome.alarms.clear("moodReportAlarm");
		console.log("Alarm cancelled");
	}
	else
	{
		var alarmInfo = {periodInMinutes: notificationInterval}
		chrome.alarms.create("moodReportAlarm", alarmInfo)
		console.log("Alarm set, every " + notificationInterval + " minutes");
	}
});

/*
**	Called when an alarm goes off (we only have one)
*/
chrome.alarms.onAlarm.addListener(function(alarm)
{
	var showNotification = (localStorage["showNotification"] || "true") == "true" ? true : false;
	if(showNotification)
	{
		var notificationParams = {
			type: "basic",
			title: "How are you?",
			message: "It's time to report your mood!",
			iconUrl: "images/icon_full.png",
			priority: 2
		}
		chrome.notifications.create("moodReportNotification", notificationParams, function(id){});
	}
	
	var showBadge = (localStorage["showBadge"] || "true") == "true" ? true : false;
	if(showBadge)
	{
		var badgeParams = {text:"?"};
		chrome.browserAction.setBadgeText(badgeParams);
	}
});

/*
**	Called when the "report your mood" notification is clicked
*/
chrome.notifications.onClicked.addListener(function(notificationId)
{
	if(notificationId == "moodReportNotification")
	{
		var windowParams = {url: "popup.html", 
							type: 'panel',
							width: 346,
							height: 70,
							top: screen.height,
							left: screen.width
						   };
		chrome.windows.create(windowParams);
	}
});

/*
**	Handles extension-specific requests that come in, such as a 
** 	request to upload a new measurement
*/
chrome.extension.onMessage.addListener(function(request, sender, sendResponse)
{
	console.log("Received request: " + request.message);
	if(request.message == "uploadMeasurements") 
	{
		pushMeasurements(request.payload, null);
	}
});

chrome.tabs.getSelected(null, function(tab){
    chrome.tabs.executeScript(tab.id, {code: "alert('test');"}, function(response) {
        
    });
});

/***
****	HELPER FUNCTIONS
***/

function pushMeasurements(measurements, onDoneListener)
{
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "https://localhost/api/measurements/v2", true);
	//xhr.open("POST", "https://quantimo.do/api/measurements/v2", true);
	xhr.onreadystatechange = function() 
		{
			// If the request is completed
			if (xhr.readyState == 4) 
			{
				console.log("QuantiModo responds:");
				console.log(xhr.responseText);
				
				if(onDoneListener != null)
				{
					onDoneListener(xhr.responseText);
				}
			}
		};
	xhr.send(JSON.stringify(measurements));
}