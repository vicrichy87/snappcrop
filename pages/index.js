import { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import * as faceapi from 'face-api.js';
import styles from '../styles/Home.module.css';
import Image from 'next/image';
import logo from '../public/logo.png'; // Assuming logo.png is in public/

export default function Home() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [message, setMessage] = useState('');
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const imageRef = useRef(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      setMessage('Models loaded');
    };
    loadModels();
  }, []);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle file selection and face detection
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setPreviewUrl(reader.result);
      setImage(file);

      // Perform face detection
      const img = new Image();
      img.src = reader.result;
      img.onload = async () => {
        imageRef.current = img;
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks();

        if (detections) {
          const { box } = detections.detection;
          const padding = box.width * 0.5;
          setCrop({
            x: box.x - padding / 2,
            y: box.y - padding / 2,
          });
          setZoom(600 / (box.width + padding));
          setMessage('Face detected and crop adjusted');
        } else {
          setMessage('No face detected. Please adjust manually.');
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Handle background removal
  const handleRemoveBackground = async () => {
    if (!image) {
      setMessage('Please select an image first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.error) {
        setMessage(`Error: ${data.error}`);
        return;
      }

      setPreviewUrl(data.url);
      setIsBgRemoved(true);
      setMessage('Background removed successfully!');
    } catch (error) {
      setMessage('Background removal failed. Please try again.');
      console.error(error);
    }
  };

  // Handle cropping and upload
  const handleCropAndSave = async () => {
    if (!croppedAreaPixels || !image) {
      setMessage('Please select and crop an image.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = previewUrl;

    await new Promise((resolve) => (img.onload = resolve));

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

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
    );

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
      {/* Banner with Logo */}
      <div className={styles.banner}>
        <Image src={logo} alt="Snappcrop Logo" width={200} height={100} />
        <h1 className={styles.bannerTitle}>Snappcrop</h1>
      </div>
      <p className={styles.subtitle}>Create passport photos from your selfie.</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.upload}
      />
      {previewUrl && (
        <div className={styles.previewContainer}>
          <div className={styles.cropWrapper}>
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
          <div className={styles.buttonGroup}>
            <button
              onClick={handleRemoveBackground}
              className={styles.button}
              disabled={isBgRemoved}
            >
              {isBgRemoved ? 'Background Removed' : 'Remove Background'}
            </button>
            <button onClick={handleCropAndSave} className={styles.button}>
              Crop & Save
            </button>
          </div>
        </div>
      )}
      {message && <p className={styles.message}>{message}</p>}
      {downloadUrl && (
        <a href={downloadUrl} download className={styles.downloadLink}>
          Download Passport Photo
        </a>
      )}
    </div>
  );
}
