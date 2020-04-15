require('dotenv').config();
var bot = require('./bot.js');
var ytGetVideos = require('./yt_get_videos.js')
var ytGetMetadata = require('./yt_get_metadata.js')
const SDK = require('@directus/sdk-js').default;
const moment = require('moment');


const client = new SDK({
  url: process.env.DIRECTUS_URL,
  project: process.env.DIRECTUS_PROJECT,
  token: process.env.DIRECTUS_TOKEN
});



function getVideosWithoutMeta () {
  client.getItems("video", {
    fields: ["video_id"],
    // filter: {
    //   metadata_checked: { empty: false }
    // },
    limit: 10
  })
  .then(data => {
    if(data.data.length === 0) {
      return process.exit(0)
    } else {
      // console.log(data.data)
      return ytGetMetadata.proxyTest(data.data);

      // return ytGetMetadata.getAdditionalMetadata(data.data)
    }
  })
  .catch(error => { return console.log(error) });
}

getVideosWithoutMeta()
