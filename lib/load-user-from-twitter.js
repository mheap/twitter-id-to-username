var async = require("async");
module.exports = function(logger, redis, twitter){
  var redisUserPrefix = "user:";

  return function loadUserFromTwitter(userIds, completeUsers, callback){
    logger.debug("Names to look up: " + userIds.length);
    logger.debug("Names from cache: " + Object.keys(completeUsers).length);

    // If we have anyone to look up, chunk them into batches of 100
    // as we can only do 100 at once
    var chunkedArray = [];
    // Only do this if we have any to pull down
    if (userIds.length){
      var i, j, chunked, chunkSize = 100;
      for (i=0, j=userIds.length; i<j; i+=chunkSize) {
        chunkedArray.push(userIds.slice(i,i+chunkSize));
      }
    }

    logger.debug("Number of chunked arrays: " + chunkedArray.length);

    // Look up all batches asynchronously. Populate "complete" with the data
    // Worth noting here that there might not be anything in chunkedArray
    // Make sure to cache it in Redis if we can
    async.each(chunkedArray, function(item, cb){
      twitter.get('users/lookup', {user_id: item.join(",")}, function(err, reply) {
        // Was there an error? Possibly rate limit related?
        if (err){
          callback(err, null);
        }

        // Populate the complete array
        for (var i in reply){
          var j = reply[i];

          // Save to Redis
          if (redis){
            redis.set(redisUserPrefix + j.id_str, j.screen_name, function(){});
          }

          completeUsers[j.id_str] = j.screen_name;
        }

        // Then say that we're done
        cb();
      });

    // Send back the complete user object
    }, function(err){
      logger.debug("Sending back complete users");
      callback(null, completeUsers);
    });

  }

}

