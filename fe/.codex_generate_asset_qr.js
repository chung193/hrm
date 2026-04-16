const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

(async () => {
  const inputPath = path.resolve('be/.codex_asset_qr_values.json');
  const outputPath = path.resolve('be/.codex_asset_qr_images.json');
  const items = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const out = [];

  for (const item of items) {
    const image = item.value ? await QRCode.toDataURL(String(item.value), { width: 320, margin: 1 }) : null;
    out.push({ id: item.id, qr_image: image });
  }

  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2));
})();
