require('dotenv').config();
var bot = require('./bot.js');
var ytGetVideos = require('./yt_get_videos.js')
var ytGetMetadata = require('./yt_get_metadata.js')
var ytGetSubtitle = require('./yt_get_subtitle.js')
const SDK = require('@directus/sdk-js').default;
const moment = require('moment');


const client = new SDK({
  url: process.env.DIRECTUS_URL,
  project: process.env.DIRECTUS_PROJECT,
  token: process.env.DIRECTUS_TOKEN
});

// ytGetSubtitle.getSubtitles('a6bZi8N8drk', 'en');

// function getVideosLast14Days () {
//   let minimumDate = moment().subtract(14, 'days').format("YYYY/MM/DD");
//   client.getItems("video", {
//     fields: ["video_id"],
//     sort: "-created_on",
//     filter: {
//       reason: {
//         empty: false
//       },
//       video_added_on: {
//         gt: minimumDate
//       }
//     },
//     limit: -1
//   })
//   .then(data => { return ytGetMetadata.getDailyViews(data.data) })
//   .catch(error => { return console.log(error) });
// }

// getVideosLast14Days();

// function getChannelsForNewVideos () {
//   client.getItems("channel", {
//     fields: ["id", "upload_playlist_id"],
//     filter: {
//       channel_active: { nempty: true }
//     },
//     limit: -1
//   })
//   .then(data => { 
//     // console.log(data.data.length)
//     return ytGetVideos.getNewVideosOnPlaylist(data.data) 
//   })
//   .catch(error => { return error });
// }

// getChannelsForNewVideos();

ytGetMetadata.proxyTest();