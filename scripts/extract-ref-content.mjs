import fs from "fs";

const homeBundle =
  "../../ref/framerusercontent.com/sites/HQhrqAx2sEDWmNxzNQNJf/p-Eo9RN4i7_hT4p0mhGy1WUy1cTEyYEESKpZMDMz_Ao.hk71pX46.mjs";

const s = fs.readFileSync(new URL(homeBundle, import.meta.url), "utf8");

const faqPairs = [...s.matchAll(/Cem09IVM0:`([^`]+)`,[\s\S]*?NV3c2dGIv:`([^`]+)`/g)];
console.log("=== FAQ ===");
faqPairs.forEach(([_, q, a], i) => console.log(`${i + 1}. Q: ${q}\n   A: ${a}\n`));

const sophia = s.indexOf("Sophia Martinez");
if (sophia > -1) {
  console.log("=== Home testimonial context ===");
  console.log(s.slice(sophia - 400, sophia + 200));
}

const testimonialTexts = [...s.matchAll(/KaT0rnYst:`([^`]+)`|JhJj2vtUQ:`([^`]+)`|w_9pMO2MW:`([^`]+)`|sKhHM3f79:`([^`]+)`/g)];
console.log("=== Testimonial fields ===");
testimonialTexts.forEach((m) => console.log(m[1] || m[2] || m[3] || m[4]));

const roles = [...s.matchAll(/Kpq2nIlJr:`([^`]+)`|IhbZqilY6:`([^`]+)`|kDF5O8ClR:`([^`]+)`|uoOfcd_Nt:`([^`]+)`/g)];
console.log("=== Roles ===");
roles.forEach((m) => console.log(m[1] || m[2] || m[3] || m[4]));

for (const k of ["oQ7d5C_Xd", "P0h_XsIO7", "oXymT2YhR", "ss2Q6wL_o"]) {
  const m = s.match(new RegExp(`${k}:\`([^\`]+)\``));
  console.log("author", k, m?.[1]);
}
