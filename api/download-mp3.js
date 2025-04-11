const ytdl = require('@distube/ytdl-core');

module.exports = async (req, res) => {
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

    ytdl(videoUrl, { quality: 'highestaudio', filter: 'audioonly' }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the MP3 download' });
  }
};