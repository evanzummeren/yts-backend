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

