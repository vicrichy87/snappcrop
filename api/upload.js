import { supabase } from '../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    const filename = `passport-${Date.now()}-${file.originalFilename || 'photo.jpg'}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('passport-photos')
      .upload(filename, fileBuffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Save metadata to Supabase Database
    const { error: dbError } = await supabase
      .from('photos')
      .insert([{ filename }]);

    if (dbError) {
      throw dbError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('passport-photos')
      .getPublicUrl(filename);

    return res.status(200).json({ url: data.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}
