import { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { supabase } from '../lib/supabase';
import { getSession } from './_app';
import Image from 'next/image';
import logo from '../public/logo.png';
import { motion } from 'framer-motion';
import { FaCamera, FaCloudUploadAlt, FaMagic } from 'react-icons/fa';

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
    let isMounted = true;
    const loadFaceApi = async () => {
      try {
        const faceapi = await import('face-api.js');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        if (isMounted) setMessage('Models loaded');
      } catch (error) {
        if (isMounted) setMessage('Failed to load face detection models.');
        console.error(error);
      }
    };
    if (typeof window !== 'undefined') loadFaceApi();
    return () => (isMounted = false);
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
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!image) return setMessage('Please select an image first.');
    const formData = new FormData();
    formData.append('file', image);
    try {
      const response = await fetch('/api/remove-bg', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) return setMessage(`Error: ${data.error}`);
      setPreviewUrl(data.url);
      setIsBgRemoved(true);
      setMessage('Background removed successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Background removal failed.');
    }
  };

  const handleCropAndSave = async () => {
    if (!croppedAreaPixels || !image) return setMessage('Please select and crop an image.');
    const session = await getSession();
    if (!session) return setMessage('Please log in to save your photo.');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = previewUrl;
    await new Promise((resolve) => (img.onload = resolve));
    canvas.width = 600;
    canvas.height = 600;
    ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));

    const formData = new FormData();
    formData.append('file', blob, `passport-${Date.now()}.jpg`);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) return setMessage(`Error: ${data.error}`);

      await supabase.from('photos').insert({ user_id: session.user.id, filename: data.url.split('/').pop() });
      setDownloadUrl(data.url);
      setMessage('Image uploaded successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Upload failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center text-gray-700 overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', duration: 1 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Image src={logo} alt="Snappcrop Logo" width={80} height={80} className="rounded-xl" />
          <h1 className="text-4xl font-extrabold text-blue-700 drop-shadow-md">Snappcrop</h1>
        </div>
        <p className="text-lg font-medium text-gray-600">AI-powered passport photo generator — instantly from your selfie.</p>
      </motion.header>

      {/* Upload Section */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-[90%] md:w-[600px] text-center"
      >
        <motion.div whileHover={{ scale: 1.05 }} className="mb-6 flex flex-col items-center">
          <FaCamera className="text-5xl text-blue-600 mb-3 animate-bounce" />
          <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition">
            <FaCloudUploadAlt className="inline mr-2" />
            Upload or Take Selfie
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </motion.div>

        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative border-4 border-blue-100 rounded-xl overflow-hidden mb-5"
          >
            <div className="w-full h-[400px] relative">
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
          </motion.div>
        )}

        {/* Buttons */}
        {previewUrl && (
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRemoveBackground}
              className={`px-6 py-3 rounded-full text-white font-semibold shadow-md ${
                isBgRemoved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <FaMagic className="inline mr-2" />
              {isBgRemoved ? 'Background Removed' : 'Remove Background'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCropAndSave}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold shadow-md"
            >
              Crop & Save
            </motion.button>
          </div>
        )}

        {/* Messages */}
        {message && <p className="mt-4 text-sm text-gray-600 italic">{message}</p>}
        {downloadUrl && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            href={downloadUrl}
            download
            className="inline-block mt-6 px-6 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-md"
          >
            Download Passport Photo
          </motion.a>
        )}
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="mt-10 text-center text-gray-500 text-sm"
      >
        © {new Date().getFullYear()} Snappcrop. All rights reserved.
      </motion.footer>
    </div>
  );
}
