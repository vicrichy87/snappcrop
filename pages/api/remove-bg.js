import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false, // Formidable needs this
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let imageUrl = null;
    let uploadedFile = null;

    const contentType = req.headers["content-type"] || "";

    // 🔹 Support both JSON and FormData
    if (contentType.includes("application/json")) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const bodyString = Buffer.concat(buffers).toString();
      const body = JSON.parse(bodyString || "{}");
      imageUrl = body.imageUrl;
    } else {
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

    if (!uploadedFile && !imageUrl) {
      return res.status(400).json({ error: "No image provided" });
    }

    // ✅ Build request for remove.bg
    const formData = new FormData();

    if (uploadedFile) {
      const fileBuffer = await fs.promises.readFile(uploadedFile.filepath);
      formData.append("image_file", fileBuffer, uploadedFile.originalFilename);
    } else if (imageUrl) {
      console.log("✅ Sending to remove.bg:", imageUrl);
      formData.append("image_url", imageUrl);
    }

    // ✅ include form-data headers (critical fix)
    const headers = formData.getHeaders({
      "X-Api-Key": process.env.REMOVE_BG_API_KEY,
    });

    const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers,
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const text = await removeBgResponse.text();
      console.error("❌ Remove.bg error:", text);
      return res.status(removeBgResponse.status).json({ error: text });
    }

    const resultBuffer = await removeBgResponse.arrayBuffer();
    const base64Image = Buffer.from(resultBuffer).toString("base64");

    return res.status(200).json({
      success: true,
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("❌ remove-bg handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}
