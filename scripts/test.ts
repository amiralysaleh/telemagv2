import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const response = await axios.get(`https://t.me/s/persianvpnhub`);
  const $ = cheerio.load(response.data);
  const docs = $('.tgme_widget_message_document_wrap');
  console.log('Found docs wrap:', docs.length);
  if (docs.length > 0) {
    console.log('Attributes:', docs[0].attribs);
  }
}
test();
