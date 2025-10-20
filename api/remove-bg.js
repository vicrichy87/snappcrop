import axios from 'axios';
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

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // Call Remove.bg API
    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      {
        image_file: fileBuffer,
        bg_color: 'ffffff', // White background for passport photos
      },
      {
        headers: {
          'X-Api-Key': process.env.REMOVE_BG_API_KEY,
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
      }
    );

    // Return the processed image URL (temporary, could be uploaded to Supabase)
    const imageUrl = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
    return res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error('Remove.bg error:', error);
    return res.status(500).json({ error: 'Failed to remove background' });
  }
}
