import formidable from "formidable";
import fs from "fs";
import { supabase } from "../../lib/supabase";

export const config = {
  api: {
    bodyParser: false, // ⛔ Important: formidable needs raw stream
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const fileBuffer = await fs.promises.readFile(file.filepath);
    const fileName = `uploads/${Date.now()}-${file.originalFilename}`;

    // Upload to Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from("snappcrop-uploads") // ✅ replace with your actual bucket name
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: "Failed to upload to storage" });
    }

    // Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from("snappcrop-uploads")
      .getPublicUrl(fileName);

    return res.status(200).json({
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
