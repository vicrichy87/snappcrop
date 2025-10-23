import { supabase } from "../../lib/supabase";
import formidable from "formidable";
import fs from "fs";
import FormData from "form-data"; // ✅ Needed for Node.js FormData

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const form = new formidable.IncomingForm();

    // Parse uploaded file
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ Form parse error:", err);
        return res.status(500).json({ error: "File parsing failed" });
      }

      const file = files.file?.[0] || files.file;
      if (!file || !file.filepath) {
        console.error("❌ No file uploaded or invalid file structure:", files);
        return res.status(400).json({ error: "No file uploaded" });
      }

      const apiKey = process.env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        console.error("❌ Missing Remove.bg API key in environment");
        return res.status(500).json({ error: "API key missing" });
      }

      try {
        // ✅ Create form-data payload for remove.bg API
        const formData = new FormData();
        formData.append(
          "image_file",
          fs.createReadStream(file.filepath),
          file.originalFilename || `image-${Date.now()}.jpg`
        );

        // ✅ Send request to remove.bg API
        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": apiKey,
          },
          body: formData,
        });

        console.log("Remove.bg → Status:", response.status);

        // Handle rate limits & invalid API responses gracefully
        if (!response.ok) {
          let errorText;
          try {
            errorText = await response.text();
          } catch {
            errorText = "Unknown error from remove.bg";
          }

          console.error("❌ Remove.bg API error:", errorText);
          return res
            .status(response.status)
            .json({ error: errorText || "Failed to process image" });
        }

        // ✅ Retrieve the processed image buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = `bg-removed-${Date.now()}.png`;

        // ✅ Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("passport-photos")
          .upload(filename, buffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error("❌ Supabase upload error:", uploadError);
          return res
            .status(500)
            .json({ error: "Failed to upload to storage." });
        }

        // ✅ Get public URL from Supabase
        const { data } = supabase.storage
          .from("passport-photos")
          .getPublicUrl(filename);

        if (!data?.publicUrl) {
          console.error("❌ Supabase returned invalid URL:", data);
          return res.status(500).json({ error: "Failed to generate public URL" });
        }

        // ✅ Success response
        console.log("✅ Background removed successfully:", data.publicUrl);
        return res.status(200).json({ url: data.publicUrl });
      } catch (error) {
        console.error("❌ Background removal error:", error);
        return res
          .status(500)
          .json({ error: error.message || "Failed to remove background" });
      }
    });
  } catch (outerError) {
    console.error("❌ Outer handler error:", outerError);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: outerError.message || "Unexpected server error" });
    }
  }
}
