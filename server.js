var yahooFinance = require('yahoo-finance'),
    express = require('express'),
    moment = require('moment'),
    path = require('path'),
    fs = require('fs'),
    mongodb = require('mongodb');;

var obj = JSON.parse(fs.readFileSync('config.txt', 'utf8'));
var SYMBOLS = obj['symbols'],
    PERIOD = obj['period'];

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

var app = express();
// Set up the index page
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
});

// Set a sample post endpoint
app.get('/addSymbol', function(req, res){
	var symbol = req.param('symbol');
	console.log('Get new symbol : ' + symbol);

	// Sample db stuff
	saveNewSymbol(symbol.toUpperCase());

});

// This is necessary for deploying to Heroku
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

function getStockHistoricalPrice(symbol, numOfDays) {
	yahooFinance.historical({
		symbol: symbol,
		from: moment().subtract(numOfDays,'days').format().slice(0,10),
		to: moment().format().slice(0,10)
		// period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
	}, function (err, quotes) {
		if (err) { throw err; }

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


function saveNewSymbol(newSymbol) {
	console.log("ADD NEW SYMBOL ************** " + newSymbol);
	mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, db) {
  
		if(err) throw err;
		  
		/*
		 * The db should be like 
		 * {
		 *   symbols : [xx,xx,xx,newSymbol]
		 *   period : [xx,xx,xx,xx]
		 * }
		 */
		var stockConfig = db.collection('stockConfig');

		// Add new symbol to existing symbols list
		stockConfig.update(
			{ name : 'stockConfig'},
			{ $push : { symbols : newSymbol} },
			function (err, result) {
				if(err) throw err;

				db.close(function (err) {
	                if(err) throw err;
	            });
			}
		);
	});
}