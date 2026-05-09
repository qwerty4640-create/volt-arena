import fs from 'fs';
import https from 'https';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest);
      reject(err);
    });
  });
};

async function createImages() {
  console.log('Downloading standard Open Graph placeholder image...');
  await download('https://dummyimage.com/1200x630/0D0F0B/C692FF.png&text=Volt+Arena', 'public/og-image.png');
  
  console.log('Downloading Apple Touch icon placeholder image...');
  await download('https://dummyimage.com/180x180/0D0F0B/C692FF.png&text=V', 'public/apple-touch-icon.png');
  
  console.log('Downloading favicon placeholder image...');
  await download('https://dummyimage.com/32x32/0D0F0B/C692FF.png&text=V', 'public/favicon.ico');
  
  console.log('All images configured!');
}

createImages().catch(console.error);
