var yahooFinance = require('yahoo-finance');
var express = require('express');
var moment = require('moment');

var app = express();

var SYMBOLS = ['CRM','SCTY','APPL','AMZN','BABA','EA','FB','GOOG','GRPN','HDP','LNKD','MSFT','TWTR','YHOO','BIDU','JD','TECHY','SOHU','SINA','QIHU','NETS'];
var PERIOD = [7,30,90,180,365,730];

// Initialize 
var allDone = {}, allQuotes = {};
for (i = 0; i < PERIOD.length; i++) {
	allDone[PERIOD[i].toString()] = 0;
	allQuotes[PERIOD[i].toString()] = [];
}

for (i = 0; i < PERIOD.length; i++) {
	for (j = 0; j < SYMBOLS.length; j++) {
		// Note this is async call and we don't wait the response back
		getStockHistoricalPrice(SYMBOLS[j], PERIOD[i]);	
	} 
}

app.listen(3000);
console.log('Server start on 3000');

function getStockHistoricalPrice(symbol, numOfDays) {
	yahooFinance.historical({
		symbol: symbol,
		from: moment().subtract(numOfDays,'days').format().slice(0,10),
		to: moment().format().slice(0,10)
		// period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
	}, function (err, quotes) {
		// console.log(quotes);
		allDone[numOfDays.toString()]++;
		// console.log(allDone + " : " + symbol + " : " + numOfDays);
		if (quotes) {
			allQuotes[numOfDays.toString()].push(quotes);
		}

		// After get all symbol price then set up the Express
		if (allDone[numOfDays] == SYMBOLS.length) {
			app.get('/yahooFinance/' + numOfDays, function(req, res){
				// Define the required header. Important
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Access-Control-Allow-Origin', '*');
			    
			    // Send back the data
			    res.json(allQuotes[numOfDays.toString()]);
			});
			console.log('Endpoint : /yahooFinance/' + numOfDays + ' is ready to use');

		}
	});
}
