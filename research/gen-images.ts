/**
 * Jana 9 imej donut fotorealistik untuk flavor yang imejnya tak sepadan.
 * Gaya diselaraskan dengan set sedia ada: fotografi makanan profesional,
 * latar putih, pencahayaan studio lembut.
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = "/home/z/my-project/public/brand/donuts";

const STYLE =
  "Professional food photography, photorealistic gourmet donut, single donut centered on pure white background, soft studio lighting, glossy texture, high quality, detailed, appetizing";

const JOBS = [
  {
    file: "toasted-coconut.png",
    prompt:
      "Ring donut with smooth white vanilla glaze generously coated in toasted coconut flakes, some flakes falling, cream and golden brown coconut shreds",
  },
  {
    file: "pandan-gula-melaka.png",
    prompt:
      "Ring donut with vibrant green pandan glaze, drizzled with dark amber caramelized palm sugar syrup stripes (gula melaka), glossy green icing dripping slightly",
  },
  {
    file: "teh-tarik-kaw.png",
    prompt:
      "Ring donut with rich dark brown caramelized milk tea glaze (teh tarik), glossy deep amber brown icing with subtle swirl pattern, condensed milk drizzle",
  },
  {
    file: "matcha-white-choco.png",
    prompt:
      "Ring donut with pastel green matcha glaze topped with chunks of white chocolate and green and white sprinkles, Japanese matcha flavor",
  },
  {
    file: "blueberry-cheesecake.png",
    prompt:
      "Round filled bomboloni donut with purple blueberry glaze, fresh blueberries on top, cream cheese filling oozing from a cut visible at top, violet icing",
  },
  {
    file: "teh-tarik-foam.png",
    prompt:
      "Ring donut with light brown milk tea glaze topped with a swirl of creamy white frothed milk foam, tea-colored icing with milky foam cap",
  },
  {
    file: "ipoh-white-coffee.png",
    prompt:
      "Ring donut with smooth light caramel coffee glaze, golden beige roasted white coffee icing with fine coffee bean crumble specks, glossy",
  },
  {
    file: "musang-king-durian.png",
    prompt:
      "Round filled bomboloni donut with pale yellow-green durian custard cream oozing abundantly from the top, creamy thick pale yellow-green filling, golden fried dough",
  },
  {
    file: "confetti-fiesta.png",
    prompt:
      "Ring donut with white vanilla glaze completely covered in colorful rainbow confetti sprinkles, pink yellow blue green festive sprinkle mix, party celebration style",
  },
];

const zai = await ZAI.create();
const ok: string[] = [];
const fail: string[] = [];

for (const job of JOBS) {
  const outPath = path.join(OUT, job.file);
  let done = false;
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      const res = await zai.images.generations.create({
        prompt: `${job.prompt}, ${STYLE}`,
        size: "1024x1024",
      });
      const b64 = res.data?.[0]?.base64;
      if (!b64) throw new Error("tiada base64");
      fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
      done = true;
      ok.push(job.file);
      console.log(`✓ ${job.file}`);
    } catch (e: any) {
      console.error(`  ⚠ ${job.file} percubaan ${attempt}: ${e?.message?.slice(0, 90)}`);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  if (!done) fail.push(job.file);
  await new Promise((r) => setTimeout(r, 1200));
}

console.log(`\nBerjaya: ${ok.length}/${JOBS.length}`);
if (fail.length) console.log("GAGAL:", fail.join(", "));
fs.writeFileSync(
  "/tmp/gen-results.json",
  JSON.stringify({ ok, fail }, null, 2),
);
