const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const CSV = process.argv[2] || '/sdcard/Download/maa_laxmi_products_verified_image_urls.csv';
const PRODUCTS = path.join(ROOT, 'web/lib/core/src/seed/products.json');
const IMAGE_DIR = path.join(ROOT, 'web/public/products');

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') quoted = true;
      else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field.replace(/\r$/, ''));
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function clean(s) {
  return String(s || '').trim().replace(/^"|"$/g, '');
}

function extFromType(type) {
  type = (type || '').toLowerCase();

  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  if (type.includes('jpeg') || type.includes('jpg')) return '.jpg';

  return '.jpg';
}

async function download(url, baseFile) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const type = res.headers.get('content-type') || '';

  if (!type.includes('image')) {
    throw new Error(`Not an image: ${type}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.length < 1000) {
    throw new Error('Image file too small');
  }

  const ext = extFromType(type);
  const finalFile = baseFile + ext;

  fs.writeFileSync(finalFile, buffer);

  return path.basename(finalFile);
}

async function main() {
  console.log('');
  console.log('======================================');
  console.log('   MAA LAXMI HARDWARE AUTO UPDATER');
  console.log('======================================');
  console.log('');

  if (!fs.existsSync(CSV)) {
    console.error(`CSV NOT FOUND: ${CSV}`);
    console.log('');
    console.log('Run:');
    console.log('ls /sdcard/Download/*.csv');
    process.exit(1);
  }

  if (!fs.existsSync(PRODUCTS)) {
    console.error(`products.json NOT FOUND: ${PRODUCTS}`);
    process.exit(1);
  }

  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const rows = parseCSV(fs.readFileSync(CSV, 'utf8'));

  const header = rows[0].map(x => clean(x).toLowerCase());

  const skuIndex = header.indexOf('sku');
  const urlIndex = header.indexOf('new image url');
  const categoryIndex = header.indexOf('category');

  if (skuIndex < 0 || urlIndex < 0) {
    console.error('CSV must contain SKU and New Image URL columns.');
    process.exit(1);
  }

  const csvProducts = [];

  for (const r of rows.slice(1)) {
    if (!r.length) continue;

    const sku = clean(r[skuIndex]);
    const imageUrl = clean(r[urlIndex]);
    const category =
      categoryIndex >= 0 ? clean(r[categoryIndex]) : '';

    if (sku) {
      csvProducts.push({
        sku,
        imageUrl,
        category
      });
    }
  }

  const products =
    JSON.parse(fs.readFileSync(PRODUCTS, 'utf8'));

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let updated = 0;

  console.log(`Products in CSV : ${csvProducts.length}`);
  console.log(`Products in JSON: ${products.length}`);
  console.log('');

  for (const item of csvProducts) {

    const product = products.find(p =>
      String(p.sku || p.SKU || '').trim() === item.sku
    );

    if (!product) {
      console.log(`⚠️ SKU not found: ${item.sku}`);
      skipped++;
      continue;
    }

    if (item.category) {
      product.category = item.category;
    }

    if (
      !item.imageUrl ||
      item.imageUrl.includes('placehold.co') ||
      item.imageUrl.includes('loremflickr.com')
    ) {
      console.log(`⏭️ ${item.sku}: no usable image URL`);
      skipped++;
      continue;
    }

    try {

      const base = path.join(IMAGE_DIR, item.sku);

      const existing = fs.readdirSync(IMAGE_DIR)
        .find(f => f.startsWith(item.sku + '.'));

      let filename = existing;

      if (!existing) {
        process.stdout.write(`⬇️ ${item.sku} ... `);

        filename = await download(
          item.imageUrl,
          base
        );

        console.log(`OK (${filename})`);

        downloaded++;
      } else {
        console.log(`✅ ${item.sku}: already downloaded`);
      }

      const localUrl = `/products/${filename}`;

      product.imageUrl = localUrl;
      product.image_url = localUrl;

      updated++;

    } catch (err) {

      console.log(`❌ ${item.sku}: ${err.message}`);

      failed++;
    }
  }

  fs.writeFileSync(
    PRODUCTS,
    JSON.stringify(products, null, 2) + '\n'
  );

  console.log('');
  console.log('======================================');
  console.log('             SUMMARY');
  console.log('======================================');
  console.log(`CSV products   : ${csvProducts.length}`);
  console.log(`Downloaded     : ${downloaded}`);
  console.log(`Updated JSON   : ${updated}`);
  console.log(`Skipped        : ${skipped}`);
  console.log(`Failed         : ${failed}`);
  console.log('');

  const images = fs.readdirSync(IMAGE_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  console.log(`Local images   : ${images.length}`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️ Some images failed.');
    console.log('They were NOT replaced with placeholders.');
    console.log('');
  }

  console.log('Checking Git status...');

  try {

    execSync('git status --short', {
      stdio: 'inherit'
    });

    execSync(
      'git add web/public/products web/lib/core/src/seed/products.json',
      { stdio: 'inherit' }
    );

    try {

      execSync(
        'git commit -m "Automate product image and catalog updates"',
        { stdio: 'inherit' }
      );

    } catch {

      console.log('No new Git commit required.');

    }

    console.log('');
    console.log('Pushing to GitHub...');

    execSync(
      'git push origin main',
      { stdio: 'inherit' }
    );

    console.log('');
    console.log('======================================');
    console.log('          🚀 UPDATE COMPLETE');
    console.log('======================================');
    console.log('GitHub updated successfully.');
    console.log('Vercel should deploy automatically.');
    console.log('');

  } catch (err) {

    console.error('');
    console.error('Git push failed.');
    console.error(err.message);
    console.error('');
    console.error('Your local files were still updated.');
  }
}

main().catch(err => {
  console.error('');
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
