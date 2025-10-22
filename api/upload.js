import { supabase } from '../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

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
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const filename = `passport-${Date.now()}-${file.originalFilename || 'photo.jpg'}`;

    const { error: uploadError } = await supabase.storage
      .from('passport-photos')
      .upload(filename, fileBuffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: dbError } = await supabase
      .from('photos')
      .insert([{ user_id: session.data.session.user.id, filename }]);

    if (dbError) {
      throw dbError;
    }

    const { data } = supabase.storage
      .from('passport-photos')
      .getPublicUrl(filename);

    return res.status(200).json({ url: data.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}
