require('dotenv').config();
const SDK = require('@directus/sdk-js').default;
var admin = require('firebase-admin');
var key = require('./credentials.json');

const client = new SDK({
  url: process.env.DIRECTUS_URL,
  project: process.env.DIRECTUS_PROJECT,
  token: process.env.DIRECTUS_TOKEN
});

const defaultApp = admin.initializeApp({
  credential: admin.credential.cert(key),
  databaseURL: "https://ytchannelcallwebhook.firebaseio.com"
});

const defaultDatabase = defaultApp.database();

module.exports = {
  calculateStats: function() {
    client.getItems("channel", {
      fields: ["view_count", "subscriber_count", "video_count"],
      sort: "-created_on",
      limit: -1
    })
    .then(data => {
      var dataArray = data.data;

      var dataObj = {
        total_views: 0,
        total_subscribers: 0,
        total_videos: 0,
        total_channels: dataArray.length
      }

      dataArray.forEach(el => {
        dataObj.total_views += el.view_count;
        dataObj.total_subscribers +=  el.subscriber_count;
        dataObj.total_videos += el.video_count;
      }) 

      return dataObj;
    })
    .then(dataObj => {
      let statsRef = defaultDatabase.ref('stats');
      statsRef.set(dataObj)
      .then(() => {
        return process.exit(0);
      })
      .catch(error => { return console.log(error) })
 
      return true;
    })
    .catch(error => { return error });  
  },
  notify: function(actionType, activity, details) {
    client.createItem("internal_stats", {
      action_type: actionType,
      activity: activity,
      details: details
    })
    .catch(error => console.log(error));
  }
}