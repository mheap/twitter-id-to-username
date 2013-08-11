# About
A lot of my ideas hinge on knowing the username of everyone that a specific Twitter user is following.
Unfortunately Twitter doesn't make this easy. So, I hacked together a little web service that would do 
it for me and cache the results.


# Installation
Clone the repo, run `npm install` then run `node index.js`. 

# Usage
Send a request to `localhost:3000/?id=<id of the user you want to know who they're following>`.
You'll get back a JSON response. The key is the user's Twitter ID, the value is their username.
