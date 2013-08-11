// Require our dependencies
var express = require("express");
var Twitter = require("mtwitter");
var async   = require("async");
var nconf   = require("nconf");
var express = require("express");
var winston = require("winston");

// Setup the modules that we're using
var app = express();
nconf.file("./config.json");

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level: 'silly', colorize: true }),
  ]
});

// Set up our Twitter auth keys
var twitter = new Twitter(nconf.get("twitter:oauth"));

// If redis is enabled, use it to cache data. If you don't
// want to hit rate limits every 2 minutes, I advise using
// this. You'll probably hit limits until you've looked
// up a few users and start building up a database

var useRedis = nconf.get("redis:enabled");
if (useRedis){
  var redis = require("redis"),
  client = redis.createClient();
}

// Next, load our local modules to keep things a bit tidier
var loadUserFollowing = require("./lib/load-user-following")(logger, client, twitter);
var loadCachedIds= require("./lib/load-cached-ids")(logger, client, twitter);
var loadUserFromTwitter = require("./lib/load-user-from-twitter")(logger, client, twitter);

/**
 * This is where the magic happens. You hit /?id=<id of user>
 * and we look up the ID of everyone that they're following
 * and translate those ID's into usernames
 */

// We only have one endpoint, /
app.get("/", function(req, res){
  logger.debug("Incoming request to /?id=" + req.param("id"));

  // Load the ID's of everyong that <id> is following
  loadUserFollowing(req.param("id"), function(err, data) {
    if (err){
      logger.error(err);
      res.send({}, 500);
    }


    // This function will augment any items in data that were found in Redis
    // to have a username property too
    loadCachedIds(data, function(err, data){
      if (err){
        logger.error(err);
        res.send({}, 500);
      }
      // At this point, everything has an ID property.
      // Those that also have a username property are ones that were
      // cached in Redis
      //
      // We have two arrays:
      //  toLookup: An array of ID's to request
      //  complete: Users that we already know about. We populate
      //            this again later whilst we get data from Twitter
      var toLookup = [];
      var complete = {};
      for (var i in data){
        if (!data[i].username){
          toLookup.push(data[i].id);
        } else {
          complete[data[i].id] = data[i].username;
        }
      }

      loadUserFromTwitter(toLookup, complete, function(err, data){

        // Was there an error?
        if (err){
          logger.error(err);
          res.send({}, 500);
        }

        // Send back the data
        res.send(data);
      });

    });

  });
});

var listenPort = 3000;
app.listen(listenPort, function(){
  logger.debug('Listening on port ' + listenPort);
});;
