import { supabase } from "../../lib/supabase";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "File parsing failed" });
    }

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      console.error("API key missing");
      return res.status(500).json({ error: "API key missing" });
    }

    try {
      if (!file || !file.filepath || file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "Invalid or oversized image file" });
      }
    
      const formData = new FormData();
      formData.append("image_file", fs.createReadStream(file.filepath), file.originalFilename || `image-${Date.now()}.jpg`);
    
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
      });
    
      console.log("Remove.bg request headers:", { "X-Api-Key": apiKey });
      console.log("Remove.bg response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Remove.bg error details:", errorText);
        if (response.status === 429) {
          return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
        }
        return res.status(response.status).json({ error: errorText || "Unknown error" });
      }
    
      const buffer = await response.buffer();
      const filename = `bg-removed-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("passport-photos")
        .upload(filename, buffer, { contentType: "image/png" });
    
      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw uploadError;
      }
    
      const { data } = supabase.storage
        .from("passport-photos")
        .getPublicUrl(filename);
      res.status(200).json({ url: data.publicUrl });
    } catch (error) {
      console.error("Background removal error:", error, { stack: error.stack });
      res.status(500).json({ error: "Failed to remove background" });
    }
  });
}
