import fs from 'fs';
import https from 'https';

const urls = [
  "https://storage.googleapis.com/aistudio-user-content/0-7053351000000-1741494421-image.png",
  "https://storage.googleapis.com/aistudio-user-content/1-7053351000000-1741494421-image.png",
  "https://storage.googleapis.com/aistudio-user-content/2-7053351000000-1741494421-image.png"
];

fs.mkdirSync('public', { recursive: true });

urls.forEach((url, i) => {
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${url}: ${res.statusCode}`);
      return;
    }
    const file = fs.createWriteStream(`public/image-${i}.png`);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded image-${i}.png`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${url}:`, err.message);
  });
});
