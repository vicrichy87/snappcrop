// format-google-key.js
import fs from "fs";

// Path to your Google Cloud service account JSON key file
const inputPath = "./snappcrop-d8588ed908e0.json";

try {
  // Read and parse the JSON
  const keyData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  // Stringify and escape newlines
  const escaped = JSON.stringify(keyData);

  console.log("\n✅ Copy the following JSON string to Vercel environment variable:\n");
  console.log("===============================================");
  console.log(escaped);
  console.log("===============================================");
  console.log(
    "\n🟩 Tip: In Vercel → Settings → Environment Variables\n" +
      "→ Add a variable named GOOGLE_CREDENTIALS\n" +
      "→ Paste this entire line as the value (no line breaks).\n"
  );
} catch (error) {
  console.error("❌ Error reading or formatting google-key.json:", error.message);
}
