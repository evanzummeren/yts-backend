require('dotenv').config();
const axios = require('axios');
const pushToDb = require('./push_to_db.js');
const bot = require('./bot.js');

const proxies = require('./proxies.json');
const _ = require('lodash');
const ytKey = _.sample(proxies.YtApiKey);

module.exports = {
  formatVideoMetadata: function(results) {
    let arr = [];

    results.forEach(function (entry) {
      const { title, publishedAt, description, thumbnails, channelId, channelTitle } = entry.snippet;
      const videoId = entry.contentDetails.videoId;

      let obj = {
        video_id: videoId,
        title: title,
        published_at: publishedAt,
        video_added_on: publishedAt.substring(0,10),
        description: description,
        thumb_url: thumbnails.high.url,
        channel_id: channelId,
        username: channelTitle
      }

      arr.push(obj);
    });

    pushToDb.addVideos(arr);
  },
  getVideosOnPlaylist: function(playlistId) {
    let thisChannelName;

    function pullPlaylist (nextPageToken) {
      let pageToken;
      if (nextPageToken) { pageToken = "&pageToken=" + nextPageToken } else { pageToken = ""}

      axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${ytKey}${pageToken}`)
      .then(response => {
        let results = response.data.items;
        let nextPageToken = response.data.nextPageToken;
        let thisChannelName = results[0].snippet.channelTitle

        module.exports.formatVideoMetadata(results);

        if(nextPageToken) {
          setTimeout(() => {
            pullPlaylist(nextPageToken)
          }, 1000);
        } else {
          bot.notify('bot', 'Add videos', `Add initial videos (${response.data.pageInfo.totalResults}) for ${thisChannelName}`);
          return true;
        }

        return true;
      })
      .catch(error => {
        console.log(error);
      })
    }

    pullPlaylist(); // recursive function
  },
  getNewVideosOnPlaylist(arr) {
    const initialArrayLength = arr.length; 
    let numVideos;

    function getNewOnSinglePlaylist(channelArray) {
      let currentChannel = channelArray.pop();
      let channelId = currentChannel.id;
      let playlistId = currentChannel.upload_playlist_id;

      if (playlistId === null) { // in case channel id hasnt been indexed properly
        currentChannel = channelArray.pop()
        channelId = currentChannel.id;
        playlistId = currentChannel.upload_playlist_id;
      }

      let directusApi = `https://zummie.com/yt888/items/video?filter[channel_id]=${channelId}&sort=-video_added_on&limit=40&access_token=${process.env.DIRECTUS_TOKEN}`;
      let youtubeApi = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=3&playlistId=${playlistId}&key=${ytKey}`

      const requestDirectus = axios.get(directusApi);
      const requestYoutube = axios.get(youtubeApi);

        axios.all([requestDirectus, requestYoutube]).then(axios.spread((...responses) => {
          const responseDirectus = responses[0].data.data
          const responseYt = responses[1].data.items;

          // This could probably use some refactoring
          let alreadyIndexed = [];
          let toBeIndexed = [];

          responseYt.forEach(obj => {
            let idYoutubeApi = obj.contentDetails.videoId;

            for(var i = 0; i < responseDirectus.length; i++) {
              if (responseDirectus[i].video_id === idYoutubeApi) {
                alreadyIndexed.push(responseDirectus[i].video_id);
                break;
              }
            }
          })

          responseYt.forEach(obj => {
            let idYoutubeApi = obj.contentDetails.videoId;
            if (!alreadyIndexed.includes(idYoutubeApi)) {
              toBeIndexed.push(obj)
            }
          })

          if (toBeIndexed.length >= 1) { 
            numVideos =+ toBeIndexed.length;
            module.exports.formatVideoMetadata(toBeIndexed) 
          } 

          if (channelArray.length) { 
            setTimeout(() => {
              getNewOnSinglePlaylist(channelArray); // recursion
            }, 1000);
          } else {
            bot.notify('bot', 'Add new videos', `Add ${numVideos} video(s) for ${initialArrayLength} channels`);
            return true
          }

          return true
        }
      ))
      .catch(errors => { 
        if (errors.response.data.error.errors[0]["reason"] !== undefined) {
          let reason = errors.response.data.error.errors[0].reason;
          if (reason === "playlistNotFound") {
            pushToDb.updateChannel(channelId, { channel_active: false});
            // set this chhannel on inactive
            bot.notify('bot', "Can't find playlist", `Couldn't find playlist for ${channelId}. Channel probably deleted.`);
          } else if (reason === "dailyLimitExceeded") {
            bot.notify('bot', "API Quota exceeded :(((", `Error: ${errors.response.data.error.errors[0].reason}`);
          }
        }
        console.log(errors.response.data.error.errors);
      })
    }

    getNewOnSinglePlaylist(Array.from(arr))
  }
}