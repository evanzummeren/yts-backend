require('dotenv').config();
const SDK = require('@directus/sdk-js').default;
const ytChannelCall = require('./yt_channel_call.js')
const ytGetVideos = require('./yt_get_videos.js')
const ytGetMetadata = require('./yt_get_metadata.js')
const bot = require('./bot.js')
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const app = express();

const client = new SDK({
  url: process.env.DIRECTUS_URL,
  project: process.env.DIRECTUS_PROJECT,
  token: process.env.DIRECTUS_TOKEN
});

function getVideosWithoutMeta () {
  client.getItems("video", {
    fields: ["video_id"],
    filter: {
      metadata_checked: { empty: true }
    },
    limit: 50
  })
  .then(data => {
    if(data.data.length === 0) {
      return process.exit(0)
    } else {
      return ytGetMetadata.getAdditionalMetadata(data.data)
    }
  })
  .catch(error => { return console.log(error) });
}

function getLastChannelEntry () {
  client.getItems("channel", {
    fields: ["created_on", "id", "name"],
    sort: "-created_on",
    limit: 1
  })
  .then(data => {
    console.log(data.data[0]);
    return ytChannelCall.getInitialData(data.data[0].id)
  })
  .catch(error => { return error });
}

function getChannelsForNewVideos () {
  client.getItems("channel", {
    fields: ["id", "upload_playlist_id"],
    limit: -1
  })
  .then(data => { return ytGetVideos.getNewVideosOnPlaylist(data.data) })
  .catch(error => { return error });
}

function getChannelsForStats () {
  client.getItems("channel", {
    fields: ["id"],
    limit: -1
  })
  .then(data => { return ytChannelCall.updateStats(data.data) })
  .catch(error => { return error });
}

function getVideosLast14Days () {
  let minimumDate = moment().subtract(14, 'days').format("YYYY/MM/DD");
  client.getItems("video", {
    fields: ["video_id"],
    sort: "-created_on",
    filter: {
      reason: {
        empty: false
      },
      video_added_on: {
        gt: minimumDate
      }
    },
    limit: -1
  })
  .then(data => { return ytGetMetadata.getDailyViews(data.data) })
  .catch(error => { return console.log(error) });
}


// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// build multiple CRUD interfaces:
app.post('/:apikey', (req, res) => {
  if(req.params.apikey === process.env.FIREBASE_DIRECTUS_VERIFICATION_KEY) {
    console.log('getting channels')
    getLastChannelEntry();
    res.send('processing');
  } else {
    res.send("api key is wrong");
  }
});

// Expose Express API as a single Cloud Function:
exports.channelapi = functions.https.onRequest(app);

// Timescheduled
exports.updateChannelStats = functions.pubsub.topic('send-update').onPublish((message) => { getChannelsForStats(); }); 
exports.getNewVideos = functions.pubsub.topic('check-new-video').onPublish((message) => { getChannelsForNewVideos(); });
exports.updateAdditionalMeta = functions.pubsub.topic('check-additional-meta').onPublish((message) => { getVideosWithoutMeta(); });
exports.videosLast14Days = functions.pubsub.topic('check-additional-meta').onPublish((message) => { getVideosLast14Days(); });

exports.updateInternalStats = functions.pubsub.topic('update-internal-stats').onPublish((message) => { bot.calculateStats(); });
