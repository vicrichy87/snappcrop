import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [message, setMessage] = useState('');

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    setImage(file);
  };

  // Handle cropping and upload
  const handleCropAndSave = async () => {
    if (!croppedAreaPixels || !image) {
      setMessage('Please select and crop an image.');
      return;
    }

    // Create canvas for cropping
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = previewUrl;

    await new Promise((resolve) => (img.onload = resolve));

    // Set canvas to 2x2 inches at 300 DPI (600x600 pixels)
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

    // Convert to blob
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
    );

    // Upload via API route
    const formData = new FormData();
    formData.append('file', blob, `passport-${Date.now()}.jpg`);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.error) {
        setMessage(`Error: ${data.error}`);
        return;
      }

      setDownloadUrl(data.url);
      setMessage('Image uploaded successfully!');
    } catch (error) {
      setMessage('Upload failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Snappcrop</h1>
      <p>Upload a selfie to create a passport photo.</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.upload}
      />
      {previewUrl && (
        <div className={styles.preview}>
          <div style={{ position: 'relative', width: '100%', height: '400px' }}>
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
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
      {message && <p className={styles.message}>{message}</p>}
      {downloadUrl && (
        <a href={downloadUrl} download className={styles.download}>
          Download Passport Photo
        </a>
      )}
    </div>
  );
}
