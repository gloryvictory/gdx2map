const fs = require('fs');
const https = require('https');
const http = require('http');

async function checkTile(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Check if it's an image
          if (res.headers['content-type']?.startsWith('image/') || data.length > 100) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.abort();
      resolve(false);
    });
  });
}

function tileToQuadkey(x, y, z) {
  let quadkey = '';
  for (let i = z; i > 0; i--) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if ((x & mask) !== 0) digit += 1;
    if ((y & mask) !== 0) digit += 2;
    quadkey += digit;
  }
  return quadkey;
}

async function checkService(tms) {
  let url = tms.url
    .replace('{LEVEL}', '1')
    .replace('{ROW}', '0')
    .replace('{COL}', '0')
    .replace('[0123]', '0')
    .replace('[1234]', '1')
    .replace('[abcd]', 'a');

  if (tms.type === 'quadkey') {
    const quadkey = tileToQuadkey(0, 0, 1);
    url = url.replace('{QUADKEY}', quadkey);
  }

  console.log(`Checking ${tms.name}: ${url}`);
  const working = await checkTile(url);
  console.log(`${working ? 'OK' : 'FAIL'}`);
  return working;
}

async function main() {
  const data = JSON.parse(fs.readFileSync('src/data/services.json', 'utf8'));
  const good = { services: { category: [] } };
  const bad = { services: { category: [] } };

  for (const category of data.services.category) {
    const goodCategory = { ...category, tms: [] };
    const badCategory = { ...category, tms: [] };

    for (const tms of category.tms) {
      const working = await checkService(tms);
      if (working) {
        goodCategory.tms.push(tms);
      } else {
        badCategory.tms.push(tms);
      }
    }

    if (goodCategory.tms.length > 0) {
      good.services.category.push(goodCategory);
    }
    if (badCategory.tms.length > 0) {
      bad.services.category.push(badCategory);
    }
  }

  fs.writeFileSync('src/data/services.json', JSON.stringify(good, null, 2));
  fs.writeFileSync('src/data/services_bad.json', JSON.stringify(bad, null, 2));
  console.log('Done');
}

main();
