import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANNELS = [
  'persianvpnhub',
  'SparrK_VPN',
  'Break_the_barriers',
  'MatinSenPaii',
  'worldsmoments',
  'iliaen',
  'newscenter',
  'dirty_kids',
  'mahsa_alert',
  'mizangorup',
  'INTERNETFORIRAN',
  'VahidOnline',
  'pm_afshaa',
  'NetAccount'
];

const PUBLIC_DIR = path.join(__dirname, '../public');
const DATA_FILE = path.join(PUBLIC_DIR, 'data.json');
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media');

function parseSizeMB(sizeStr: string): number {
  const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB|B)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'GB') return val * 1024;
  if (unit === 'MB') return val;
  if (unit === 'KB') return val / 1024;
  if (unit === 'B') return val / (1024 * 1024);
  return 0;
}

async function downloadImage(url: string): Promise<string | null> {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const hash = crypto.createHash('md5').update(Buffer.from(response.data)).digest('hex');
    const filename = `${hash}.jpg`;
    const filepath = path.join(MEDIA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, response.data);
    }
    return `media/${filename}`;
  } catch (error: any) {
    console.error(`Failed to download image ${url}:`, error.message);
    return null;
  }
}

interface Message {
  id: string;
  channel: string;
  text: string;
  html: string;
  date: string;
  images: string[];
  files: { name: string; size: string }[];
  link: string;
  timestamp: number;
}

async function scrapeChannel(channelName: string): Promise<Message[]> {
  console.log(`Scraping ${channelName}...`);
  try {
    const response = await axios.get(`https://t.me/s/${channelName}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const messages: Message[] = [];

    const messageElements = $('.tgme_widget_message').toArray();
    
    for (const el of messageElements) {
      const $el = $(el);
      const id = $el.attr('data-post') || '';
      if (!id) continue;

      const text = $el.find('.tgme_widget_message_text').text().trim();
      const html = $el.find('.tgme_widget_message_text').html() || '';
      const date = $el.find('.tgme_widget_message_date time').attr('datetime') || '';
      const link = `https://t.me/${channelName}/${id.split('/')[1]}`;
      
      // Images
      const imageUrls: string[] = [];
      $el.find('.tgme_widget_message_photo_wrap').each((j, imgEl) => {
        const style = $(imgEl).attr('style');
        if (style) {
          const match = style.match(/url\('(.+?)'\)/);
          if (match && match[1]) {
            imageUrls.push(match[1]);
          }
        }
      });

      const localImages: string[] = [];
      for (const url of imageUrls) {
        const localPath = await downloadImage(url);
        if (localPath) localImages.push(localPath);
      }

      // Files (basic extraction)
      let hasLargeFile = false;
      const files: { name: string; size: string }[] = [];
      $el.find('.tgme_widget_message_document').each((k, fileEl) => {
          const name = $(fileEl).find('.tgme_widget_message_document_title').text().trim();
          const size = $(fileEl).find('.tgme_widget_message_document_extra').text().trim();
          if (name) {
            if (parseSizeMB(size) > 5) {
              hasLargeFile = true;
            }
            files.push({ name, size });
          }
      });

      if (hasLargeFile) continue; // Skip message if it contains a file > 5MB

      messages.push({
        id,
        channel: channelName,
        text,
        html,
        date,
        images: localImages,
        files,
        link,
        timestamp: new Date(date).getTime()
      });
    }

    return messages;
  } catch (error) {
    console.error(`Error scraping ${channelName}:`, error);
    return [];
  }
}

async function main() {
  let existingData: Message[] = [];
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading existing data, starting fresh.');
    }
  }

  const allNewMessages: Message[] = [];

  for (const channel of CHANNELS) {
    const messages = await scrapeChannel(channel);
    allNewMessages.push(...messages);
  }
  
  const dataMap = new Map<string, Message>();
  
  // Load existing
  existingData.forEach(msg => dataMap.set(msg.id, msg));
  
  // Add new (overwriting if updated)
  allNewMessages.forEach(msg => dataMap.set(msg.id, msg));

  // Convert back to array, filter out messages older than 24 hours, and sort by date
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  const sortedData = Array.from(dataMap.values())
    .filter(msg => (now - msg.timestamp) <= TWENTY_FOUR_HOURS)
    .sort((a, b) => b.timestamp - a.timestamp);

  const limitedData = sortedData.slice(0, 500);

  fs.writeFileSync(DATA_FILE, JSON.stringify(limitedData, null, 2));
  console.log(`Saved ${limitedData.length} messages to ${DATA_FILE}`);

  // Cleanup old media
  const usedMedia = new Set<string>();
  limitedData.forEach(msg => {
    msg.images.forEach(img => usedMedia.add(img.replace('media/', '')));
  });

  if (fs.existsSync(MEDIA_DIR)) {
    const files = fs.readdirSync(MEDIA_DIR);
    let deletedCount = 0;
    files.forEach(file => {
      if (!usedMedia.has(file)) {
        fs.unlinkSync(path.join(MEDIA_DIR, file));
        deletedCount++;
      }
    });
    if (deletedCount > 0) console.log(`Cleaned up ${deletedCount} old images.`);
  }
}

main();
