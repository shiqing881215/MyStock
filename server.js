var yahooFinance = require('yahoo-finance'),
    express = require('express'),
    moment = require('moment'),
    path = require('path'),
    mongodb = require('mongodb');;

// Global variables 
var SYMBOLS, PERIOD, ALL_DONE = {}, ALL_QUOTES = {};
initialize();

var app = express();
// Set up the index page
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
});

// Set a sample post endpoint
app.get('/addSymbol', function(req, res){
	var symbol = req.param('symbol');
	console.log('Get new symbol : ' + symbol);

	saveNewSymbol(symbol.toUpperCase(), req, res);

});

// This is necessary for deploying to Heroku
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

function initialize() {
	mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, db) {
  
		if(err) throw err;

		// Add new symbol to existing symbols list
		db.collection('stockConfig').find({name : 'stockConfig'}).toArray(function(err, configs) {
			// Initialize global variables
			var config = configs[0];
			SYMBOLS = config['symbols'];
	    	PERIOD = config['period'];

			for (i = 0; i < PERIOD.length; i++) {
				ALL_DONE[PERIOD[i].toString()] = 0;
				ALL_QUOTES[PERIOD[i].toString()] = [];
			}

			for (i = 0; i < PERIOD.length; i++) {
				for (j = 0; j < SYMBOLS.length; j++) {
					// Note this is async call and we don't wait the response back
					getStockHistoricalPrice(SYMBOLS[j], PERIOD[i]);	
				} 
			}
		});
	});
}

function getStockHistoricalPrice(symbol, numOfDays) {
	yahooFinance.historical({
		symbol: symbol,
		from: moment().subtract(numOfDays,'days').format().slice(0,10),
		to: moment().format().slice(0,10)
		// period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
	}, function (err, quotes) {
		if (err) { throw err; }

		// console.log(quotes);
		ALL_DONE[numOfDays.toString()]++;
		if (quotes) {
			ALL_QUOTES[numOfDays.toString()].push(quotes);
		}

		// After get all symbol price then set up the Express
		if (ALL_DONE[numOfDays] == SYMBOLS.length) {
			app.get('/yahooFinance/' + numOfDays, function(req, res){
				// Define the required header. Important
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Access-Control-Allow-Origin', '*');
			    
			    // Send back the data
			    res.json(ALL_QUOTES[numOfDays.toString()]);
			});
			console.log('Endpoint : /yahooFinance/' + numOfDays + ' is ready to use');
		}
	});
}


function saveNewSymbol(newSymbol, req, res) {
	console.log("ADD NEW SYMBOL ************** " + newSymbol);
	// Follow this to generate this MONGODB_URI to your app
	// https://devcenter.heroku.com/articles/mongolab#connecting-to-existing-mlab-deployments-from-heroku
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

	                // Send 200 code back and redraw
	                res.sendStatus(200);
	                initialize();
	            });
			}
		);
	});
}