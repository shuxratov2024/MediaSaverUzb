const axios = require("axios")

async function downloadMedia(url) {
    try {
        const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${url}`)
        if(res.data && res.data.video) {
            return {
                type : "video",
                url : res.data.video.noWatermark,
                title : res.data.title,
            }
        }
        return null
    } catch (error) {
        console.error("Videoni Yuklashda Xato:", error)
        return null
    }
}

module.exports  = {downloadMedia}