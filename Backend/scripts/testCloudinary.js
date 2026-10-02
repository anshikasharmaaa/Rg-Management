import dotenv from "dotenv";
import dns from "dns";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();
if (process.argv.includes("--ipv4")) dns.setDefaultResultOrder("ipv4first");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const ms = (s) => `${Date.now() - s}ms`;

console.log(
  "Node:",
  process.version,
  "| IPv4-first:",
  process.argv.includes("--ipv4"),
);
console.log("Env present:", {
  CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
  API_KEY: !!process.env.CLOUDINARY_API_KEY,
  API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
  HTTPS_PROXY: process.env.HTTPS_PROXY || process.env.https_proxy || "none",
});

try {
  const s = Date.now();
  const addrs = await dns.promises.lookup("api.cloudinary.com", { all: true });
  console.log(
    `DNS OK (${ms(s)}):`,
    addrs.map((a) => `${a.address} (v${a.family})`).join(", "),
  );
} catch (e) {
  console.log("DNS FAILED:", e.code || e.message);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 20000,
});

let s = Date.now();
try {
  await cloudinary.api.ping();
  console.log(`API ping OK (${ms(s)})`);
} catch (e) {
  console.log(
    `API ping FAILED (${ms(s)}):`,
    e?.error?.message || e?.message || e,
  );
}

s = Date.now();
try {
  const r = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "rg-restaurant/_test", timeout: 20000 },
        (err, res) => (err ? reject(err) : resolve(res)),
      )
      .end(PNG);
  });
  console.log(`Tiny upload OK (${ms(s)}):`, r.secure_url);
  await cloudinary.uploader.destroy(r.public_id);
} catch (e) {
  console.log(`Tiny upload FAILED (${ms(s)}):`, e?.message || e);
}
