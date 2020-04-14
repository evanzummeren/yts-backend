require('dotenv').config();
const SDK = require('@directus/sdk-js').default;

const client = new SDK({
  url: process.env.DIRECTUS_URL,
  project: process.env.DIRECTUS_PROJECT,
  token: process.env.DIRECTUS_TOKEN
});

module.exports = {
  updateChannel: function(channelId, obj) {
    client.updateItem("channel", channelId, obj)
    .catch(error => {
      // Dit forwarden naar error device
      // Connection error
      console.log(error)
    });
  },
  addVideos: function(arr) {
    client.createItems("video", arr)
    .catch(error => console.log(error));
  },
  updateVideos: function(arr) {
    client.updateItems("video", arr)
    .catch(error => console.log(error));
  },
  updateVideo: function(channelId, obj) {
    client.updateItem("video", channelId, obj)
    .catch(error => console.log(error));
  }
}

