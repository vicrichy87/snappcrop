import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false, // Required for Formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 🧠 Parse uploaded file from FormData
    const form = formidable({ multiples: false, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ Formidable parse error:", err);
        return res.status(400).json({ error: "Invalid form data" });
      }

      const file = files.file?.[0] || files.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // ✅ Read uploaded image file
      const fileBuffer = await fs.promises.readFile(file.filepath);

      // 🧠 Send image to remove.bg API
      const formData = new FormData();
      formData.append("image_file", fileBuffer, file.originalFilename);

      try {
        const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": process.env.REMOVE_BG_API_KEY,
          },
          body: formData,
        });

        if (!removeBgResponse.ok) {
          const text = await removeBgResponse.text();
          console.error("❌ Remove.bg error:", text);
          return res.status(removeBgResponse.status).json({ error: text });
        }

        const resultBuffer = await removeBgResponse.arrayBuffer();
        const base64Image = Buffer.from(resultBuffer).toString("base64");

        // ✅ Return the background-removed image as Base64
        res.status(200).json({
          success: true,
          image: `data:image/png;base64,${base64Image}`,
        });
      } catch (apiError) {
        console.error("❌ remove.bg API call failed:", apiError);
        res.status(500).json({ error: "Background removal API failed" });
      }
    });
  } catch (error) {
    console.error("❌ remove-bg handler crash:", error);
    res.status(500).json({ error: "Unexpected server error" });
  }
}
