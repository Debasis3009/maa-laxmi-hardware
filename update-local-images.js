const fs = require("fs");
const path = require("path");

const catalogPath = "./web/lib/core/src/seed/products.json";
const imageDir = "./web/public/products";

if (!fs.existsSync(catalogPath)) {
  console.error("ERROR: products.json not found.");
  process.exit(1);
}

if (!fs.existsSync(imageDir)) {
  console.error("ERROR: image directory not found.");
  process.exit(1);
}

const products = JSON.parse(
  fs.readFileSync(catalogPath, "utf8")
);

let updated = 0;
let missing = [];

for (const product of products) {
  if (!product.sku) continue;

  const extensions = [".webp", ".png", ".jpg", ".jpeg"];
  let foundFile = null;

  for (const ext of extensions) {
    const filename = product.sku + ext;
    const fullPath = path.join(imageDir, filename);

    if (fs.existsSync(fullPath)) {
      foundFile = filename;
      break;
    }
  }

  if (foundFile) {
    const imagePath = "/products/" + foundFile;

    product.imageUrl = imagePath;
    product.image_url = imagePath;

    updated++;
  } else {
    missing.push(product.sku);
  }
}

fs.writeFileSync(
  catalogPath,
  JSON.stringify(products, null, 2),
  "utf8"
);

console.log("");
console.log("======================================");
console.log(" PRODUCT IMAGE UPDATE");
console.log("======================================");
console.log("Total products :", products.length);
console.log("Updated         :", updated);
console.log("Missing         :", missing.length);

if (missing.length > 0) {
  console.log("");
  console.log("Products still needing images:");
  console.log("--------------------------------------");
  console.log(missing.join("\n"));
}

console.log("");
