import Jimp from 'jimp';
import fs from 'fs/promises'; // Using promises for async/await compatibility
import path from 'path'; // To handle file paths

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const getRandomWatermarkPath = () => {
  const watermarkIndex = Math.floor(Math.random() * 5) + 1; // Random number between 1 and 5
  return path.resolve(__dirname, `blacktappy${watermarkIndex}.jpg`);
};

const generateProfilePictureWithWatermark = async (buffer) => {
  try {
    const jimp = await Jimp.read(buffer);
    const min = jimp.getWidth();
    const max = jimp.getHeight();
    const cropped = jimp.crop(0, 0, min, max);

    // Get a random watermark path
    const watermarkPath = getRandomWatermarkPath();

    // Check if watermark file exists
    try {
      await fs.access(watermarkPath);
    } catch (error) {
      throw new Error(`Watermark file not found at ${watermarkPath}`);
    }

    const watermarkBuffer = await fs.readFile(watermarkPath);
    const watermark = await Jimp.read(watermarkBuffer);

    // Resize the watermark to a larger size
    watermark.scaleToFit(200, 200); // Increase the size here

    // Calculate the position to place the watermark (bottom left corner)
    const x = 10;
    const y = cropped.bitmap.height - watermark.bitmap.height - 10;

    // Composite the watermark onto the profile picture
    cropped.composite(watermark, x, y);

    // Scale the profile picture to fit within 720x720
    const scaledImg = await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG);

    return {
      img: scaledImg,
      preview: scaledImg, // Assuming the preview is the same as the profile picture
    };
  } catch (error) {
    console.error('Error generating profile picture with watermark:', error);
    throw error;
  }
};

export default generateProfilePictureWithWatermark;
