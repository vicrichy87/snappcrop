import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false, // Needed for Formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let imageUrl = null;
    let uploadedFile = null;

    // 🔹 Detect if it's JSON (frontend sending { imageUrl })
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const bodyString = Buffer.concat(buffers).toString();
      const body = JSON.parse(bodyString || "{}");
      imageUrl = body.imageUrl;
    } else {
      // 🔹 Otherwise, handle FormData upload
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

    // ✅ Prepare form for remove.bg API
    const formData = new FormData();

    if (uploadedFile) {
      const fileBuffer = await fs.promises.readFile(uploadedFile.filepath);
      formData.append("image_file", fileBuffer, uploadedFile.originalFilename);
    } else if (imageUrl) {
      console.log("Sending to remove.bg:", imageUrl);
      formData.append("image_url", imageUrl);
    }

    // 🌐 Call remove.bg
    const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    const arrayBuffer = await removeBgResponse.arrayBuffer();
    if (!removeBgResponse.ok) {
      const text = Buffer.from(arrayBuffer).toString();
      console.error("❌ Remove.bg error:", text);
      return res.status(removeBgResponse.status).json({ error: text });
    }

    // ✅ Convert response to Base64 image
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
