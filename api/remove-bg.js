import { supabase } from '../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Required for formidable to parse multipart/form-data
  },
};

export default async function handler(req, res) {
  // Explicitly check method and log it
  console.log('Request method:', req.method);
  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'File parsing failed' });
    }

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      console.error('API key missing');
      return res.status(500).json({ error: 'API key missing' });
    }

    try {
      // Use FormData for multipart upload to Remove.bg
      const formData = new FormData();
      formData.append('image_file', fs.createReadStream(file.filepath), file.originalFilename || `image-${Date.now()}.jpg`);

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      });

      console.log('Remove.bg response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove.bg error:', errorText);
        return res.status(response.status).json({ error: errorText });
      }

      const buffer = await response.arrayBuffer();
      const filename = `bg-removed-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('passport-photos')
        .upload(filename, Buffer.from(buffer), { contentType: 'image/png' });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('passport-photos')
        .getPublicUrl(filename);
      res.status(200).json({ url: data.publicUrl });
    } catch (error) {
      console.error('Background removal error:', error);
      res.status(500).json({ error: 'Failed to remove background' });
    }
  });
}
