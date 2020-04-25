// "use strict";
// const getSubtitles = require('youtube-captions-scraper').getSubtitles;
// const he = require('he');
// const axios = require('axios');
// const _ = require('lodash');
// const striptags = require('striptags');

// module.exports = {
//    getSubtitles: async function (videoID, lang) {
//     const { data } = await axios.get(
//       `https://youtube.com/get_video_info?video_id=${videoID}`
//     )
  
//     const decodedData = decodeURIComponent(data);
  
//     // * ensure we have access to captions data
//     if (!decodedData.includes('captionTracks'))
//       throw new Error(`Could not find captions for video: ${videoID}`);
  
//     const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/;
//     const [match] = regex.exec(decodedData);
//     const { captionTracks } = JSON.parse(`${match}}`);
  
//     const subtitle =
//       _.find(captionTracks, {
//         vssId: `.${lang}`,
//       }) ||
//       _.find(captionTracks, {
//         vssId: `a.${lang}`,
//       }) ||
//       _.find(captionTracks, ({ vssId }) => vssId && vssId.match(`.${lang}`));
  
//     // * ensure we have found the correct subtitle lang
//     if (!subtitle || (subtitle && !subtitle.baseUrl))
//       throw new Error(`Could not find ${lang} captions for ${videoID}`);
  
//     const { data: transcript } = await axios.get(subtitle.baseUrl);
//     const lines = transcript
//       .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
//       .replace('</transcript>', '')
//       .split('</text>')
//       .filter(line => line && line.trim())
//       .map(line => {
//         const startRegex = /start="([\d.]+)"/;
//         const durRegex = /dur="([\d.]+)"/;
  
//         const [, start] = startRegex.exec(line);
//         const [, dur] = durRegex.exec(line);
  
//         const htmlText = line
//           .replace(/<text.+>/, '')
//           .replace(/&amp;/gi, '&')
//           .replace(/<\/?[^>]+(>|$)/g, '');
  
//         const decodedText = he.decode(htmlText);
//         const text = striptags(decodedText);
  
//         return {
//           start,
//           dur,
//           text,
//         };
//       });



//       let subArray = [];
//       let text = ""
  
//       for (var i = 0; i < lines.length; i++){
//         if (i < lines.length -1) {
//           var obj = {};
//           obj.start = lines[i].start;
//           obj.dur = module.exports.calculateDuration(lines[i], lines[i+1]);
//           // obj.vidId = id;
//           obj.text = lines[i].text + " " + lines[i + 1].text;

//           text += " " + obj.text

//           subArray.push(obj);
//           i++
//         } else if (i === lines.length && (i % 2) === 1) { // NOG TESTEN OF DIT WERKT 
//           var obj = {};
//           obj.start = lines[i].start;
//           obj.dur = lines[i].dur;
//           // obj.vidId = id;
//           obj.text = lines[i].text;
//           text += " " +  obj.text


//           subArray.push(obj)
//         }
//       }

//       console.log(subArray);
//       console.log(lines[lines.length-1])
// console.log(text)
  
//     return lines;
//   },
//   calculateDuration: function(firstObj, secondObj) {
//     var durationSecondObj = parseFloat(secondObj.start) + parseFloat(secondObj.dur);
//     return (durationSecondObj - parseFloat(firstObj.start)).toFixed(2)
//   },
//   grabSubtitles: function(id) {

//     function pullSubs(id) {

//       getSubtitles({
//         videoID: id,
//         lang: 'en'
//       }).then(captions => {
//         var subArray = [];
  
//         for (var i = 0; i < captions.length; i++){
//           if (i < captions.length -1) {
//             var obj = {};
//             obj.start = captions[i].start;
//             obj.dur = this.calculateDuration(captions[i], captions[i+1]);
//             obj.vidId = id;
//             obj.text = captions[i].text + " " + captions[i + 1].text;
  
//             subArray.push(obj);
//             i++
//           } else if (i === captions.length && (i % 2) === 1) { // NOG TESTEN OF DIT WERKT 
//             var obj = {};
//             obj.start = captions[i].start;
//             obj.dur = captions[i].dur;
//             obj.vidId = id;
//             obj.text = captions[i].text;
  
//             subArray.push(obj)
//           }
//         }

//           // TEMP SAVE 
//           fs.writeFile("./" + id + "_fixed.json", JSON.stringify(subArray), function(err) {
//             if(err) {
//                 return console.log(err);
//             }
//             console.log("The file was saved!");
//           }); 
      
//       });
//     }

//   }
// }