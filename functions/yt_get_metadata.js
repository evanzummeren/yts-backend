require('dotenv').config();
const fs = require('fs');
const proxies = require('./proxies.json');
const axios = require('axios');
const http = require('http');
const https = require('https');
const pushToDb = require('./push_to_db.js');
const bot = require('./bot.js')
const queryString = require('query-string');
const parseStoryboard = require('yt-storyboard');
const dayjs = require('dayjs');
const _ = require('lodash');
const HttpsProxyAgent = require('https-proxy-agent');

const todaysDate = dayjs().format("DD-MM-YYYY");
const httpAgent = new http.Agent({ keepAlive: true, timeout: 4000 });
const httpsAgent = new https.Agent({ 
  keepAlive: true, 
  timeout: 4000,
  ca: fs.readFileSync("./crawlera-ca.crt")
});

// const proxyServer = _.sample(proxies.hostPool);
const proxyServer = proxies.crawlera;

let instance = axios.create({
  // baseURL: "https://www.youtube.com/",
  baseURL: "https://www.youtube.com/",
  httpAgent: httpAgent,
  httpsAgent: httpsAgent,
  proxy: {
    host: proxies.crawlera.host,
    port: 8010,
    auth: {
      username: proxies.crawlera.user
    }
  },
  shouldKeepAlive: true,
  headers: {
    'User-Agent': _.sample(proxies.userAgentPool)
  },
  timeout: 5000,
  maxSockets: 1
})

module.exports = {
  // proxyTest() {

  //   instance.get('get', { httpsAgent })
  //   .then( response => {
  //     console.log(response.data)
  //   })
  //   .catch( error => {
  //     console.log(error);
  //   })
  // },
  parseWebApiResponse(jsonString, currentVid) {
    // This has to become a seperate function
    if (jsonString.playabilityStatus.status === "ERROR" || jsonString.playabilityStatus.status === "LOGIN_REQUIRED") {
      let obj = {
        video_id: currentVid.video_id,
        online: false,
        metadata_checked: true,
        reason: jsonString.playabilityStatus.reason
      }

      console.log('error, vid not available or set to private.')
      return obj;
    } else {
      let videoDetails = jsonString.videoDetails;

      let obj = {
        video_id: currentVid.video_id,
        view_count: parseInt(videoDetails.viewCount),
        length_seconds: parseInt(videoDetails.lengthSeconds),
        metadata_checked: true,
        view_count_history: [ {date: todaysDate, views: parseInt(videoDetails.viewCount) } ],
        online: true
      }

      if ("storyboards" in jsonString) {
        obj.sgp = parseStoryboard('keys', jsonString.storyboards.playerStoryboardSpecRenderer.spec, true, 100).sgp;
        obj.sigh = parseStoryboard('keys', jsonString.storyboards.playerStoryboardSpecRenderer.spec, true, 100).sigh;
      }

      return obj;
    }
  },
  getAdditionalMetadata: function(arr) {
    const initialArrayLength = arr.length;
    let arrayToPush = [];

    function singlePull(arr) {
      let currentVid = arr.pop();
      let randomTime = _.random(200,700);

      instance.get(`get_video_info?video_id=${currentVid.video_id}&asv=3&el=detailpage&hl=en_US`, { httpsAgent })
      .then( response => {

        console.log(response);
        let jsonString = JSON.parse(queryString.parse(response.data).player_response);
        arrayToPush.push(module.exports.parseWebApiResponse(jsonString, currentVid))

        if (arr.length === 1) {
          bot.notify('bot', 'Update additional metadata', `Update YouTube stats for ${initialArrayLength} videos`);          
          pushToDb.updateVideos(arrayToPush);
        } else if (arr.length) {
          setTimeout(() => { singlePull(arr) }, randomTime)
        } else {
          pushToDb.updateVideos(arrayToPush);
          console.log('Finished getAdditionalMetadata()')
          return setTimeout(() => { process.exit(0) }, 1000); 
        }

        return true
      })
      .catch( error => { console.log(error) })
    }

    singlePull(Array.from(arr))
  },
  checkVideoStatus(id, obj) {
    let subreason = "";
    if ('subreason' in obj.errorScreen.playerErrorMessageRenderer) {
      subreason = obj.errorScreen.playerErrorMessageRenderer.subreason.simpleText;
    } 

    pushToDb.updateVideo('HSJRswGqLbM', {
      reason: obj.status,
      subreason: subreason,
      online: false
    });
  },
  parseStats(responseYt, responseDirectus) {
    let obj = {
      view_count_history: responseDirectus.view_count_history,
      online: true
    };

    if (obj.view_count_history === null ) { // Create a count history in case there is none
      obj.view_count_history = [{date: todaysDate, views: parseInt(responseYt.microformat.playerMicroformatRenderer.viewCount)}];
    } else {
      let findDateInArray = _.findIndex(obj.view_count_history, function(o) { return o.date === todaysDate });

      if ( findDateInArray === -1 ) { // Date hasn't been found
        obj.view_count_history.push({date: todaysDate, views: parseInt(responseYt.microformat.playerMicroformatRenderer.viewCount)});
      } else if ( findDateInArray >= 0 ) { // Date has been found previous instances get removed
        let rejected = _.reject(obj.view_count_history, { date: todaysDate});
        rejected.push({date: todaysDate, views: parseInt(responseYt.microformat.playerMicroformatRenderer.viewCount)});

        obj.view_count_history = rejected;
      }
    }

    console.log(obj)

    // pushToDb.updateVideo(responseDirectus.video_id, obj);
  },
  // https://www.googleapis.com/youtube/v3/commentThreads?key=KKEEEEEYYYY&textFormat=plainText&part=snippet&videoId=Ms4wVhl235w&maxResults=50
  getDailyViews(arr) {
    const initialArrayLength = arr.length; 
    console.log('get daily views')

    function updateSingleStat(arr) {
      let currentId = arr.pop();

      let directusAPI = `https://zummie.com/yt888/items/video/${currentId.video_id}`;
      let ytWebAPI = `get_video_info?video_id=${currentId.video_id}&asv=3&el=detailpage&hl=en_US`;
      
      const requestDirectus = axios.get(directusAPI);
      const requestYt = instance.get(ytWebAPI, { httpAgent, httpsAgent });

      axios.all([requestDirectus, requestYt]).then(axios.spread((...responses) => {
        const responseDirectus = responses[0].data.data;
        const jsonString = JSON.parse(queryString.parse(responses[1].data).player_response);

        if('playabilityStatus' in jsonString && !jsonString.playabilityStatus.status === "OK") {
          module.exports.checkVideoStatus(responseDirectus.video_id, jsonString.playabilityStatus);
        } else {
          module.exports.parseStats(jsonString, responseDirectus);
        }

        if (arr.length === 1) {
          bot.notify('bot', 'Update daily views', `Update YouTube stats for ${initialArrayLength} different videos`);
          console.log('Finished')
          process.exit(0)
        } else if (arr.length) { 
          let randomTime = _.random(400,1600);
          setTimeout(() => { updateSingleStat(arr) }, randomTime)
        } else {
          return true
        }
      })).catch( errors => { 
        console.log(errors) 
        console.log('statusText ', errors.response.statusText)
        if(errors.response.statusText === "Proxy Authentication Required") {
          console.log(`proxy auth error with ${proxyServer}, run again`)
        }
      })
    }

    updateSingleStat(Array.from(arr))
  }
}