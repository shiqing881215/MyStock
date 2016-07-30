var currentActiveTab, customDays;

function initialize() {
	$('#spinner').hide();

	var spinner = new Spinner({
		lines: 12, // The number of lines to draw
		length: 7, // The length of each line
		width: 5, // The line thickness
		radius: 10, // The radius of the inner circle
		color: '#337ab7', // #rbg or #rrggbb
		speed: 1, // Rounds per second
		trail: 100, // Afterglow percentage
		shadow: true, // Whether to render a shadow
		zIndex: 100
	}).spin(document.getElementById("spinner"));

	// Default show 1 week
	currentActiveTab = 'tab7';
	showStockChart(7);
}

function showStockChart(numOfDays) {
	// Clear the existing chart first
	$('#charts').empty();

	$.ajax({
		url: '/yahooFinance/' + numOfDays,
		success: function(data, statusCode, jqXHR) {
			console.log(data);
			var polishedData = polishData(data);
			prepareChartPlaceholder(polishedData.length);
			drawChart(polishedData);
		},
		error: function(jqXHR, statusCode, e) {
			console.log(e);
		}
	});

	$('#' + currentActiveTab).removeClass('active');
	if ([7,30,90,365,730].indexOf(numOfDays) == -1) {
		currentActiveTab = 'tabCustom'
	} else {
		currentActiveTab = 'tab' + numOfDays;	
	}
	$('#' + currentActiveTab).addClass('active');
}

/*
 rawData format
 [  
   [  
      {  
         "date":"2015-05-01T07:00:00.000Z",
         "open":79.24,
         "high":79.76,
         "low":78.11,
         "close":78.99,
         "volume":22783300,
         "adjClose":78.99,
         "symbol":"FB"
      },
      {  
         "date":"2015-05-02T07:00:00.000Z",
         "open":79.24,
         "high":79.76,
         "low":78.11,
         "close":78.99,
         "volume":22783300,
         "adjClose":78.99,
         "symbol":"FB"
      }
   ],
   [  
      {  
         "date":"2015-05-01T07:00:00.000Z",
         "open":73.37,
         "high":74.5,
         "low":72,
         "close":73.36,
         "volume":9189500,
         "adjClose":73.36,
         "symbol":"CRM"
      },
      {  
         "date":"2015-05-02T07:00:00.000Z",
         "open":73.37,
         "high":74.5,
         "low":72,
         "close":73.36,
         "volume":9189500,
         "adjClose":73.36,
         "symbol":"CRM"
      }
   ]
]

 And polish data format
 [  
   {
	 'symbol' : 'CRM',
	 'price' : '75, 74, 76',
	 'data' : '2015-05-01, 2015-05-02'
   }, 
   {
	 'symbol' : 'FB',
	 'price' : '73, 74, 76',
	 'data' : '2015-05-01, 2015-05-02'
   }
 ]
 */
function polishData(rawData) {
	polishedData = [];
	rawData.forEach(function(stockDetail) {
		if (stockDetail.length > 0) {
			var singlePolishData = {
				symbol : stockDetail[0]['symbol'],
				price : [],
				date : []
			}
			stockDetail.forEach(function(singleDayDetail) {
				singlePolishData['price'].push(singleDayDetail['close']);
				singlePolishData['date'].push(singleDayDetail['date'].slice(0,10));
			})

			polishedData.push(singlePolishData);
		}
	});

	return polishedData;
}

function drawChart(data) {
	data.forEach(function(symbolDetail, index) {
		new Highcharts.Chart({
            chart: {
                renderTo: "chart"+index
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: true
                    },
                    shadow: true
                }
            },
            xAxis: {
	            categories: symbolDetail['date']
	        },
	        yAxis: {
	        	title: {text: 'Price'}
	        },
            series: [{
                data: symbolDetail['price']
            }],
            title: {
                text: symbolDetail['symbol']
            },
            tooltip: {
                enabled: true
            }
        });
	});
}

function prepareChartPlaceholder(numberOfChart) {
	var charts = document.getElementById('charts');
	for (var i = 0; i < numberOfChart; i++) {
		var div = document.createElement('div');
		div.setAttribute('id', 'chart'+i);
		div.setAttribute('style', 'width:50%;');
		charts.appendChild(div);
	}
}

function addSymbol() {
	$('#spinner').show();
	$.ajax({
		url: '/addSymbol?symbol=' + $('#newSymbol').val(),
		success: function(data, statusCode, jqXHR) {
			console.log('Success add new symbol');
			$('#newSymbol').val('');
			// Hack here, wait for 2.5 seconds and refresh the page
			setTimeout(function() {
				$('#spinner').hide();
				location.reload();
			}, 2500);
		},
		error: function(jqXHR, statusCode, e) {
			console.log(e);
			$('#newSymbol').val('');
		}
	});
}

function addCustomDays() {
	customDays = parseInt($('#customDays').val());
	$('#spinner').show();
	$.ajax({
		url: '/addCustomDays?days=' + $('#customDays').val(),
		success: function(data, statusCode, jqXHR) {
			console.log('Success add new days');
			$('#customDays').val('');
			// Hack here, wait for 2.5 seconds and refresh the page
			setTimeout(function() {
				$('#spinner').hide();
				$('#tabCustomLink').click(function() {showStockChart(customDays)});
				debugger;
				$('#tabCustomLink').text(customDays + " days");
				$('#tabCustom').css('visibility', 'visible');
			}, 2500);
		},
		error: function(jqXHR, statusCode, e) {
			console.log(e);
			$('#customDays').val('');
		}
	});
}