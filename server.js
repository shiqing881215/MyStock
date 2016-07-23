var yahooFinance = require('yahoo-finance'),
    express = require('express'),
    moment = require('moment'),
    path = require('path'),
    fs = require('fs'), 
    https = require('https');

var app = express();

var SYMBOLS = ['CRM','SCTY','APPL','AMZN','BABA','EA','FB','GOOG','GRPN','HDP','LNKD','MSFT','TWTR','YHOO','BIDU','JD','TECHY','SOHU','SINA','QIHU','NETS'];
// var PERIOD = [7,30,90,180,365,730];
var PERIOD = [];

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

// Set up the index page
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
});
console.log('Index page is ready to use');

// This is necessary for deploying to Heroku
app.set('port', (process.env.PORT || 5000));
// app.listen(app.get('port'), function() {
//   console.log('Node app is running on port', app.get('port'));
// });

console.log('__dirname is : ' + __dirname);
console.log('join is : ' + path.join(__dirname + '/server.key'));

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}, app).listen(app.get('port'));
console.log('app listening on port ' + app.get('port') + '...........................................');

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
