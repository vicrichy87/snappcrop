import { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import * as faceapi from 'face-api.js';
import styles from '../styles/Home.module.css';
import Image from 'next/image';
import logo from '../public/logo.png';

export default function Home() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [message, setMessage] = useState('');
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const [isCompliant, setIsCompliant] = useState(null);
  const imageRef = useRef(null);

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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setPreviewUrl(reader.result);
      setImage(file);

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

          // Compliance Checks
          const landmarks = detections.landmarks.positions;
          const isNeutral = checkNeutralExpression(landmarks); // Simple check
          const hasShadows = checkShadows(img, box); // Basic shadow check
          if (isNeutral && !hasShadows) {
            setIsCompliant(true);
            setMessage('Face detected, crop adjusted, and image complies.');
          } else {
            setIsCompliant(false);
            setMessage(
              'Face detected, crop adjusted. Warning: ' +
              (isNeutral ? '' : 'Non-neutral expression detected. ') +
              (hasShadows ? 'Possible shadows detected.' : '')
            );
          }
        } else {
          setMessage('No face detected. Please adjust manually.');
        }
      };
    };
    reader.readAsDataURL(file);
  };

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

  // Simple compliance check functions (basic implementation)
  const checkNeutralExpression = (landmarks) => {
    // Check mouth openness (basic approximation using y-distance between lips)
    const upperLip = landmarks[50]; // Upper lip center
    const lowerLip = landmarks[58]; // Lower lip center
    const mouthOpen = lowerLip.y - upperLip.y > 10; // Arbitrary threshold
    return !mouthOpen; // Neutral if mouth is closed
  };

  const checkShadows = (img, box) => {
    // Basic shadow check using pixel brightness (simplified)
    const canvas = document.createElement('canvas');
    canvas.width = box.width;
    canvas.height = box.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
    const imageData = ctx.getImageData(0, 0, box.width, box.height);
    const data = imageData.data;
    let darkPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness < 50) darkPixels++; // Arbitrary dark threshold
    }
    return (darkPixels / (box.width * box.height)) > 0.1; // More than 10% dark pixels
  };

  return (
    <div className={styles.container}>
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
          {isCompliant !== null && (
            <p className={styles.message}>
              {isCompliant ? 'Image complies with passport standards.' : 'Image may not comply. Please adjust.'}
            </p>
          )}
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
