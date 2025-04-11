const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');

module.exports = async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    let videoUrl;
    let videoDetails;

    if (ytdl.validateURL(query)) {
      videoUrl = query;
      const videoInfo = await ytdl.getInfo(videoUrl);
      videoDetails = {
        title: videoInfo.videoDetails.title,
        views: videoInfo.videoDetails.viewCount,
        thumbnail: videoInfo.videoDetails.thumbnails[0].url,
      };
    } else {
      const searchResult = await ytSearch(query);
      const video = searchResult.videos[0];

      if (!video) {
        return res.status(404).json({ error: 'No video found for the given query' });
      }

      videoUrl = video.url;
      videoDetails = {
        title: video.title,
        views: video.views,
        thumbnail: video.thumbnail,
      };
    }

    const downloadUrl = `/api/download?url=${encodeURIComponent(videoUrl)}`;
    const downloadMp3Url = `/api/download-mp3?url=${encodeURIComponent(videoUrl)}`;

    res.json({
      title: videoDetails.title,
      views: videoDetails.views,
      thumbnail: videoDetails.thumbnail,
      downloadUrl: downloadUrl,
      downloadMp3Url: downloadMp3Url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the query' });
  }
};