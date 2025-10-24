import formidable from "formidable";
import fs from "fs";
import path from "path";
import { supabase } from "../../lib/supabase";

// ✅ Required to let Formidable handle file streams
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const form = formidable({ multiples: false, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ Formidable error:", err);
        return res.status(400).json({ error: "Error parsing form data" });
      }

      const file = files.file?.[0] || files.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const buffer = await fs.promises.readFile(file.filepath);
      const fileExt = path.extname(file.originalFilename);
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // ✅ Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("snappcrop-uploads")
        .upload(filePath, buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("❌ Supabase upload error:", error);
        return res.status(500).json({ error: "Failed to upload to storage" });
      }

      // ✅ Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("snappcrop-uploads")
        .getPublicUrl(filePath);

      console.log("✅ File uploaded:", publicUrl);
      return res.status(200).json({ url: publicUrl });
    });
  } catch (error) {
    console.error("❌ Upload handler crash:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
