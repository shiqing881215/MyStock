1. Use Node.js to set up the server to do the yahoo finance api call
   https://github.com/pilwon/node-yahoo-finance
2. Use node-inspector you can debug the node in your chrome
   https://github.com/node-inspector/node-inspector
3. User Express.js http://expressjs.com/ to set up the web container for Node.js, so you can set a RESTFUL service
   in which way you can set the data from node.js back to client side
   One thing to note is when you use the jQuery to do the ajax call, if you meet "Access-Control-Allow-Origin" issue,
   usually the way you did is set dataType as "jsonp" in your jQeury ajax call. But here, if we want to get the json
   back from our express container, don't set the json dataType which will confuse jQuery and make it throw parseError.
   Instead, in your express response, write the hearder by adding 'Access-Control-Allow-Origin : *' and Content-Type : application/json.
4. For get the Date, use the moment js - https://github.com/abritinthebay/datejs. (Try to use Datejs first, seems not working well)   

https://cloud.githubusercontent.com/assets/2434215/8039555/7358a45e-0dbf-11e5-814f-8586be000290.png
