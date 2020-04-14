// YT CHANNEL CALL
require('dotenv').config();
const axios = require('axios');
const pushToDb = require('./push_to_db.js');
const ytGetVideos = require('./yt_get_videos.js')
const bot = require('./bot.js')
const dayjs = require('dayjs');

const todaysDate = dayjs().format("DD-MM-YYYY");

module.exports = {
  getInitialData: function(channelId) {
    return axios.get('https://www.googleapis.com/youtube/v3/channels?part=snippet%2Cstatistics%2CcontentDetails&id=' + channelId + '&key=' + process.env.YT_API)
    .then( response => {
      var snippet = response.data.items[0].snippet,
          stats = response.data.items[0].statistics,
          contentDetails = response.data.items[0].contentDetails,
          obj = {};

      obj.name = snippet.title;
      obj.description = snippet.description;
      obj.custom_url = snippet.customUrl; 
      obj.published_at = snippet.publishedAt; 
      obj.thumb_url = snippet.thumbnails.medium.url; 
      obj.view_count = stats.viewCount; 
      obj.upload_playlist_id = contentDetails.relatedPlaylists.uploads;
      obj.subscriber_count = stats.subscriberCount; 
      obj.video_count = stats.videoCount; 
      obj.subscriber_count_history = [{ date: todaysDate, subscriberCount: stats.subscriberCount }]; 
      obj.view_count_history = [{ date: todaysDate, viewCount: stats.viewCount }]; 

      ytGetVideos.getVideosOnPlaylist(obj.upload_playlist_id);
      bot.notify('bot', 'Pull metadata channel', `Add metadata to ${channelId} (${obj.name}) database`);
      return pushToDb.updateChannel(channelId, obj);
    })
    .catch( error => { return error })
  },
  updateStats: function(arr) {
    const initialArrayLength = arr.length; 

    function updateSingleStat(arr) {
      let currentId = arr.pop();
      
      let directusAPI = 'https://zummie.com/yt888/items/channel/' + currentId.id;
      let ytAPI = 'https://www.googleapis.com/youtube/v3/channels?part=statistics&id=' + currentId.id + '&key=' + process.env.YT_API;
      
      const requestDirectus = axios.get(directusAPI);
      const requestYt = axios.get(ytAPI);

      axios.all([requestDirectus, requestYt]).then(axios.spread((...responses) => {
        const responseDirectus = responses[0].data.data
        const responseYt = responses[1].data.items[0].statistics;

        let obj = {};

        obj.subscriber_count_history = responseDirectus.subscriber_count_history;
        obj.view_count_history = responseDirectus.view_count_history;
        obj.view_count = responseYt.viewCount;
        obj.subscriber_count = responseYt.subscriberCount;
        obj.video_count = responseYt.videoCount;
        obj.subscriber_count_history.push({ date: todaysDate,  subscriberCount: responseYt.subscriberCount })
        obj.view_count_history.push({ date: todaysDate, viewCount: responseYt.viewCount })

        pushToDb.updateChannel(currentId.id, obj);

        if (arr.length === 1) {
          bot.notify('bot', 'Update stats channels', `Update YouTube stats for ${initialArrayLength} different channels`);
        } else if (arr.length) { 
          updateSingleStat(arr); // recursion
        } else {
          return true
        }
      })).catch( errors => { console.log(errors) })
    }

    updateSingleStat(Array.from(arr))
  }
}