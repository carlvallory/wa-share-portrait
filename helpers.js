// Define your helper functions
async function fetchDataFromApis(apiUrl, apiKey, cParam) {
    const axios = require('axios');
    const url = `${apiUrl}?${cParam}=${apiKey}`;
    let data = null;

    try {
        const apiResponse = await axios.get(url);

        if (apiResponse.status === 200) {
            if (apiResponse.data.type === "results") {
                data = apiResponse.data.content_elements;
            }
        }

        return {
            data: data
        };
    } catch (error) {
        console.error('Error fetching data from APIs:', error);
        return null;
    }
}

// CHECK FOR ERRORS
async function getSendChannelByPost(client, obj) {
    const { MessageMedia } = require('whatsapp-web.js');

    try {
        if(DEBUG === true) { console.log(obj, 148); }
        let objResponse = await objectPost2json(obj);
        let channelPreviewData = false;
        let sendChannelData = false;
        let newChannelId = null;
        let message = null;
        //obj with information to publish
       
        let duplicateIds = await checkIds(objResponse);
        let objReady = removeObjById(objResponse, duplicateIds); console.log(objReady, 152);

        console.log(duplicateIds,154);

        if(objReady == false || objReady.length === 0) {
            return false;
        }

        let channelId = await getChannelId(CHANNEL); console.log(CHANNEL, channelId, 160);

        if(!Array.isArray(channelId) || channelId.length === 0) {
            return false;
        }

        if(objResponse != false) {
            if(Array.isArray(objReady)) {
                if(objReady.length != 0) {
                    let newId = [];
                    for (let i = 0; i < objReady.length; i++) {
                        console.log(objReady[i].object.taxonomy.website);
                        if(objReady[i].object.taxonomy.website == WEBSITE) {
                            if(newId.length === 0 || !newId.includes(objReady[i].object.id)) {
                                let newUrl = WEB_URL + objReady[i].object.canonicalUrl;
                                let og = await fetchOGMetadata(newUrl);
                                let image = await fetchImageFromUrl(og.ogImage);
                                let media = new MessageMedia('image/jpeg', Buffer.from(image).toString('base64'));

                                let ogTitle = truncateString(og.ogTitle, 75);
                                let ogDescription = truncateString(og.ogDescription, 48);

                                objReady[i].object.og.title = `*${ogTitle}*`;
                                objReady[i].object.og.description = `_${ogDescription}_`;
                                objReady[i].object.og.image = media; // TO DO BLOB attachment

                                message = `${objReady[i].object.og.title}\n\n${objReady[i].object.og.description}\n\n${newUrl}`;

                                newId.push(objReady[i].object.id);
                                console.log(objReady[i], 175);

                                newChannelId = channelId[0];

                                messageData.image = objReady[i].object.og.image;
                                messageData.message = message;
                                //sendChannelData = await client.sendMessage(channelId[0], objReady[i].object.og.image); //, {caption: message}
                                //sendChannelData = await client.sendMessage(channelId[0], message);
                            }
                        }
                    }
                }
            }
        }

        console.log (messageData, 224);

        return messageData;
    } catch(e){
        console.log("Error Occurred: ", e);
        console.log("l: 197");
        return false;
    }
}

async function getSendMessage(client, channelName, messageText) {
    let message;
    if (typeof client.sendMessage === 'function') {
        try {
            message = await client.sendMessage(channelName, messageText);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    return message;
}

// PRIVATE FUNCTION
async function fetchOGMetadata(url) {
    try {
        // Fetching the HTML content of the page
        const { data } = await axios.get(url);
        const cheerAxios = cheerio.load(data);

        // Extracting the Open Graph metadata
        const ogTitle = cheerAxios('meta[property="og:title"]').attr('content');
        const ogDescription = cheerAxios('meta[property="og:description"]').attr('content');
        const ogImage = cheerAxios('meta[property="og:image"]').attr('content');

        return {
            ogTitle,
            ogDescription,
            ogImage
        };
    } catch (error) {
        console.error(`Error fetching Open Graph Data: ${error}`);
        return {};
    }
}

// PRIVATE FUNCTION
async function fetchImageFromUrl(imageUrl) {
    try {
        // Fetching the HTML content of the page
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const image = response.data;

        return image;

    } catch (error) {
        console.error(`Error fetching Image: ${error}`);
        return false;
    }
}

// PRIVATE FUNCTION
// HELPER
function truncateString(str, num) {
    // If the length of str is less than or equal to num
    // just return str--don't truncate it.
    if (str.length <= num) {
      return trimString(str);
    }
    // Return str truncated with '...' concatenated to the end of str.
    return str.slice(0, num).trim().replace(/\s+/g, ' ') + '...';
}

// Export the functions
module.exports = {
    fetchDataFromApis,
    getSendMessage
};
