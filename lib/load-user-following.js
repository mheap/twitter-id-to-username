module.exports = function(logger, redis, twitter){
  var redisFollowingPrefix = "following:";

  return function loadUserFollowing(userId, callback){
    logger.debug("Loading following list for " + userId);
    // Should we bother checking Redis?
    if (redis){
      logger.debug("Checking for following list in Redis");
      // Try and look it up in Redis
      redis.get(redisFollowingPrefix + userId, function(err, data){
        if (err){ return callback(err, null); }

        if (data){
          logger.debug("Found follower list in Redis for " + userId);
          return callback(null, JSON.parse(data));
        }

        // Otherwise, go to Twitter
        return loadFromTwitter(userId, callback);
      });
    } else {
      // Just go straight to twitter
      return loadFromTwitter(userId, callback);
    }
  }

  function loadFromTwitter(id, callback){
    logger.debug("Loading following list from Twitter for " + id);
    twitter.get('friends/ids', {"user_id": id}, function(err, data) {
      if (err){ return callback(err, null); }
      logger.debug("Got data returned from Twitter");

      // If redis is in use, cache it in there
      if (redis){
        redis.set(redisFollowingPrefix + id, JSON.stringify(data.ids));
      }
      callback(null, data.ids);
    });
  }
}

