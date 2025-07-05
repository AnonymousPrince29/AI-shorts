const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');

exports.handler = async (event) => {
  try {
    const { videoUrl, settings } = JSON.parse(event.body);
    
    // Initialize FFmpeg
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
    
    // Download video
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoUrl));
    
    // Process video based on settings
    const shorts = [];
    for (let i = 0; i < settings.count; i++) {
      // Calculate start time (simplified)
      const startTime = i * 30;
      
      // Run FFmpeg command to create short
      await ffmpeg.run(
        '-ss', startTime.toString(),
        '-i', 'input.mp4',
        '-t', settings.duration.toString(),
        '-vf', 'scale=720:1280',
        `output-${i}.mp4`
      );
      
      // Get generated short
      const data = ffmpeg.FS('readFile', `output-${i}.mp4`);
      shorts.push({
        url: URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })),
        name: `short-${i}.mp4`
      });
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ shorts })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
