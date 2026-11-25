import fs from "fs";

const bundle =
  "../../ref/framerusercontent.com/sites/HQhrqAx2sEDWmNxzNQNJf/p-Eo9RN4i7_hT4p0mhGy1WUy1cTEyYEESKpZMDMz_Ao.hk71pX46.mjs";
const s = fs.readFileSync(new URL(bundle, import.meta.url), "utf8");

const keys = [
  "Experience",
  "Legacy",
  "Coffee Culture",
  "Handcrafted coffee",
  "Moments and Details",
  "Our Highlights",
  "Inspired by heritage",
  "Handpicked",
  "Signature Menu",
  "Designed for Work",
  "Refined ambience",
  "Begin Your",
  "Reserve Your Moment",
  "Guest Experience",
  "Coffee Journal",
  "Your Questions",
  "Café workspace",
  "Explore Our Menu",
  "Know More",
  "Reserve Your Table",
  "View Menu",
  "Daniel Foster",
  "Open Daily",
  "8AM",
];

console.log("=== KEY PHRASES ===");
for (const k of keys) {
  const idx = s.indexOf(k);
  if (idx > -1) {
    console.log(`FOUND: ${k}`);
    console.log(s.slice(Math.max(0, idx - 80), idx + k.length + 80).replace(/\n/g, " "));
    console.log("---");
  }
}

const titles = [
  ...new Set(
    [...s.matchAll(/:\`([^\`]{8,140})\`/g)]
      .map((m) => m[1])
      .filter(
        (t) =>
          !t.includes("http") &&
          !t.includes("framer") &&
          !t.includes("px") &&
          !t.includes("rgba") &&
          /^[A-Za-z]/.test(t),
      ),
  ),
];

console.log("\n=== STRING TITLES (sample) ===");
titles.slice(0, 80).forEach((t) => console.log("-", t));

const imgs = [
  ...new Set(
    [...s.matchAll(/src:\`(https:\/\/framerusercontent\.com\/images\/[^`]+\.(jpg|png|webp)[^`]*)\`/g)].map(
      (m) => m[1].split("?")[0],
    ),
  ),
];

console.log("\n=== IMAGES ===");
imgs.forEach((i) => console.log(i));

const cards = [
  "Elegant Ambience",
  "Handcrafted Coffee",
  "Skilled Baristas",
  "Seasonal Specials",
  "Signature Espresso",
  "Vanilla Cloud Latte",
  "Matcha Harmony",
  "Blueberry Muffin",
];

console.log("\n=== CARD IMAGES ===");
for (const c of cards) {
  const pos = Math.max(s.indexOf(`b6Hjlq8DQ:\`${c}\``), s.indexOf(`TlE8gqCaC:\`${c}\``));
  if (pos > -1) {
    const chunk = s.slice(pos, pos + 600);
    const img = chunk.match(/src:`(https:\/\/[^`]+)`/);
    console.log(c, img ? img[1].split("?")[0] : "no img");
  }
}

const ambIdx = s.indexOf("Moments Captured");
const ambImgs = [
  ...s
    .slice(ambIdx, ambIdx + 8000)
    .matchAll(/src:`(https:\/\/framerusercontent\.com\/images\/[^`]+\.(jpg|png))[^`]*`/g),
].map((m) => m[1].split("?")[0]);
console.log("\n=== AMBIENCE IMAGES ===");
[...new Set(ambImgs)].forEach((i) => console.log(i));
