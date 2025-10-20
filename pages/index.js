import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { supabase } from '../lib/supabase';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle file upload
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    setImage(file);
  };

  // Handle cropping and saving
  const handleCropAndSave = async () => {
    if (!croppedAreaPixels || !image) return;

    // Create canvas to crop image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = previewUrl;

    await new Promise((resolve) => (img.onload = resolve));

    // Set canvas size to 2x2 inches at 300 DPI (600x600 pixels)
    canvas.width = 600;
    canvas.height = 600;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert canvas to blob
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
    );

    // Upload cropped image to Supabase
    const filename = `${Date.now()}-passport.jpg`;
    const { data, error } = await supabase.storage
      .from('passport-photos')
      .upload(filename, blob);

    if (error) {
      console.error('Upload error:', error);
      return;
    }

    // Get public URL
    const { publicUrl } = supabase.storage
      .from('passport-photos')
      .getPublicUrl(filename);
    setDownloadUrl(publicUrl);

    // Save metadata
    await supabase.from('photos').insert([{ filename }]);
  };

  return (
    <div className={styles.container}>
      <h1>Snappcrop</h1>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className={styles.upload}
      />
      {previewUrl && (
        <div className={styles.preview}>
          <div style={{ position: 'relative', width: '100%', height: '400px' }}>
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1} // 1:1 for passport photo
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <button onClick={handleCropAndSave} className={styles.download}>
            Crop & Save
          </button>
        </div>
      )}
      {downloadUrl && (
        <a href={downloadUrl} download className={styles.download}>
          Download Passport Photo
        </a>
      )}
    </div>
  );
}
