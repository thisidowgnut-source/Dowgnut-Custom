/**
 * Audit imej donut: hantar setiap imej unik kepada VLM dan minta
 * penerangan objektif (warna, topping, inti, gaya) untuk dibandingkan
 * dengan nama flavor dalam katalog.
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const PUBLIC = "/home/z/my-project/public";

// Semua imej donut unik dalam folder brand/donuts
const allFiles = fs
  .readdirSync(path.join(PUBLIC, "brand/donuts"))
  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .sort();

console.log(`Jumlah imej dalam folder: ${allFiles.length}`);

const zai = await ZAI.create();

const results: Record<string, string> = {};

for (const file of allFiles) {
  const full = path.join(PUBLIC, "brand/donuts", file);
  const b64 = fs.readFileSync(full).toString("base64");
  const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";

  let attempt = 0;
  let desc = "";
  while (attempt < 3 && !desc) {
    try {
      const res = await zai.chat.completions.createVision({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Describe this donut image objectively in ONE line, max 20 words. Format: "glaze/topping color | sprinkles or filling visible | overall look". Example: "pink strawberry glaze with rainbow sprinkles | no filling visible | classic ring donut". Be precise about colors (brown/chocolate, green/matcha/pandan, yellow, white, pink, etc) and whether it looks stuffed/filled or a ring donut.`,
              },
              { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
            ],
          },
        ],
        thinking: { type: "disabled" },
      });
      desc = res.choices[0]?.message?.content?.trim() ?? "";
    } catch (e: any) {
      attempt++;
      console.error(`  ⚠ ${file} attempt ${attempt}: ${e?.message?.slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
  }
  results[file] = desc || "(gagal dianalisis)";
  console.log(`${file.padEnd(28)} → ${desc.slice(0, 110)}`);
  await new Promise((r) => setTimeout(r, 1500));
}

fs.writeFileSync("/tmp/vlm-image-audit.json", JSON.stringify(results, null, 2));
console.log("\nSelesai. Keputusan disimpan ke /tmp/vlm-image-audit.json");
