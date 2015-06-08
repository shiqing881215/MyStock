var yahooFinance = require('yahoo-finance');
var express = require('express');
var moment = require('moment');

var app = express();

var SYMBOLS = ['CRM','FB','APPL','GOOG','YHOO','EA','SCTY','GRPN','BABA','MSFT','AMZN','JD','LNKD','BIDU','TWTR','HDP'];
var allDone = 0;
var allQuotes = [];

SYMBOLS.forEach(getStockHistoricalPrice);

app.listen(3000);
console.log('Server start on 3000');

function getStockHistoricalPrice(symbol) {
	debugger;
	yahooFinance.historical({
		symbol: symbol,
		from: moment().subtract(90,'days').format().slice(0,10),
		to: moment().format().slice(0,10)
		// period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
	}, function (err, quotes) {
		// console.log(quotes);
		allDone++;
		if (quotes) {
			allQuotes.push(quotes);
		}

		// After get all symbol price then set up the Express
		if (allDone == SYMBOLS.length) {
			app.get('/yahooFinance', function(req, res){
				// Define the required header. Important
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Access-Control-Allow-Origin', '*');
			    
			    // Send back the data
			    res.json(allQuotes);
			});
		}
	});
}