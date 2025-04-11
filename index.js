const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');

const app = express();
const port = 3000;

// Endpoint to handle query (name or URL) and provide video details
app.get('/video', async (req, res) => {
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

    const downloadUrl = `${req.protocol}://${req.get('host')}/download?url=${encodeURIComponent(videoUrl)}`;
    const downloadMp3Url = `${req.protocol}://${req.get('host')}/download-mp3?url=${encodeURIComponent(videoUrl)}`;

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
});

// Endpoint to handle direct video download
app.get('/download', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const videoInfo = await ytdl.getInfo(videoUrl);
    res.header('Content-Disposition', `attachment; filename="${videoInfo.videoDetails.title.replace(/[^\w\s]/gi, '')}.mp4"`);
    res.header('Content-Type', 'video/mp4');

    ytdl(videoUrl, { quality: 'highest' }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the video' });
  }
});

// Endpoint to handle MP3 download
app.get('/download-mp3', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const videoInfo = await ytdl.getInfo(videoUrl);
    res.header('Content-Disposition', `attachment; filename="${videoInfo.videoDetails.title.replace(/[^\w\s]/gi, '')}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');

    // Stream the highest quality audio without compression
    ytdl(videoUrl, { quality: 'highestaudio', filter: 'audioonly' }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the MP3 download' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});