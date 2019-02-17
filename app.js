var config = require('./config.js');
var Twit = require('twit'); // Twit object to connect to the Twitter API

// Initializes Twit object
console.log(config.twitter_api);
var peliBot = new Twit(config.twitter_api);

var stream = peliBot.stream('statuses/filter', {follow : config.twitter_user_id});

// When the user receives a tweet, it calls the checkEvent() function
stream.on('tweet', checkEvent);

// Receives an Event Message and evaluates if the event is a Twitter Mention
// If it's a Mention, it calls the getRandomMovie()
function checkEvent(eventMsg) {
    var replyTo = eventMsg.in_reply_to_screen_name;

    if (replyTo === 'nosequever') {
        getRandomMovie(eventMsg.user.screen_name, eventMsg.id_str);
    }
}

// Searches for a random movie within the Open Movie DataBase API
// The movie should have an Average Score of 7 points and at least 50 reviews
// So the bot doesn't recommend shitty movies.
function getRandomMovie(user, mentionID) {
    // TheMovieDB credentials
    var api_key = require('./config.js').movies_database_api_key;
    var api_page = Math.floor((Math.random() * 10) + 1); // Random results page
    var api_url = 'https://api.themoviedb.org/3/discover/movie?api_key=' + api_key + '&language=en-US&sort_by=vote_average.desc&include_adult=false&include_video=false&page=' + api_page + '&vote_count.gte=50&vote_average.gte=7';

    // API Request
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var request = new XMLHttpRequest();
    request.open('GET', api_url, true);
    request.onload = function () {
        var data = JSON.parse(this.responseText);
        var toTweet;
        if (request.status >= 200 && request.status < 400) {
            var randomResult = Math.floor((Math.random() * (data['results'].length - 1)) + 0); // Random item
            var movie = (data['results'][randomResult]);
            var movieTitle = movie['title'];
            var movieURL = 'https://www.themoviedb.org/movie/' + movie['id'];
            var moviePosterURL = 'https://image.tmdb.org/t/p/w500' + movie['poster_path '];
            var movieReleaseYear = movie['release_date'].split("-")[0];

            toTweet = "@" + user + " Hoy podrías ver " + movieTitle + " (" + movieReleaseYear + "). Más info: " + movieURL;
        } else {
            toTweet = "@" + user + " Algo salió mal al intentar recomendarte una película. Puedes intentarlo de nuevo más tarde?";
        }
        tweetIt(toTweet, mentionID);
    }
    request.send();
}

// Posts a tweet on Twitter
function tweetIt(tweet, mentionID) {
    var params = {
        status: tweet,
        in_reply_to_status_id: mentionID
    }

    peliBot.post('statuses/update', params, tweeted);

    function tweeted(err, data, response) {
        if (err) {
            console.log(err);
        } else {
            console.log('Tweeted!');
        }
    }
}

// Handles error
stream.on('error', function (err) {
    console.log(err);
});
