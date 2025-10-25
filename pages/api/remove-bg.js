// /api/remove-bg.js
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    let imageUrl = null;
    let uploadedFile = null;

    const contentType = req.headers["content-type"] || "";

    // Handle JSON (frontend sends { imageUrl })
    if (contentType.includes("application/json")) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = JSON.parse(Buffer.concat(buffers).toString() || "{}");
      imageUrl = body.imageUrl;
    } else {
      // Handle multipart form upload
      const form = formidable({ multiples: false, keepExtensions: true });
      await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          uploadedFile = files.file?.[0] || files.file;
          imageUrl = fields.imageUrl?.[0] || fields.imageUrl || null;
          resolve();
        });
      });
    }

    if (!uploadedFile && !imageUrl)
      return res.status(400).json({ error: "No image provided" });

    // ✅ Use native FormData (works perfectly with fetch)
    const formData = new FormData();

    if (uploadedFile) {
      const fileBuffer = await fs.promises.readFile(uploadedFile.filepath);
      formData.append("image_file", new Blob([fileBuffer]), uploadedFile.originalFilename);
    } else if (imageUrl) {
      console.log("✅ Sending to remove.bg:", imageUrl);
      formData.append("image_url", imageUrl);
    }

    const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const text = await removeBgResponse.text();
      console.error("❌ remove.bg error:", text);
      return res.status(removeBgResponse.status).json({ error: text });
    }

    const arrayBuffer = await removeBgResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    res.status(200).json({
      success: true,
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("❌ remove-bg handler error:", error);
    res.status(500).json({ error: error.message });
  }
}
