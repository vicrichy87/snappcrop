// pages/index.js
import { useState, useEffect, useCallback, useRef } from "react";
import NextImage from "next/image";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import {
  FaCamera,
  FaCloudUploadAlt,
  FaMagic,
  FaDownload,
} from "react-icons/fa";
import logo from "../public/logo.png";
import { supabase } from "../lib/supabase";
import { getSession } from "../lib/session";
import Lottie from "lottie-react";
import aiTransform from "../public/ai-transform.json";

/**
 * Snappcrop - Full Feature Home Page
 * ------------------------------------------------------------
 * - Hero Section with animated gradient + Lottie
 * - Smart upload + face detection + compliance checks
 * - Background removal and Supabase upload
 * - Animated demo (selfie → passport) sections
 * - Fully responsive and mobile optimized
 */
export const dynamic = "force-static";
export const revalidate = 0;

export default function Home() {
  // ---------------- State Management ----------------
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCompliant, setIsCompliant] = useState(null);

  // crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // UI + animation states
  const [showPassport, setShowPassport] = useState(false);

  // refs
  const inputRef = useRef(null);
  const imageRef = useRef(null);
  const humanRef = useRef(null);

  const [selectedSize, setSelectedSize] = useState("us");
  const [bgColor, setBgColor] = useState("white");

  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);



  // ---------------- Load Google Vision API ----------------
  useEffect(() => {
    setMessage("Initializing...");
  }, []);

  // Automatically toggle the hero and demo animations every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPassport((prev) => !prev);
    }, 8000); // change every 8s
    return () => clearInterval(interval);
  }, []);

  // ---------------- Helpers ----------------
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const checkNeutralExpression = (landmarks) => {
    const upperLip = landmarks[10]; // Approximate upper lip (adjust based on model)
    const lowerLip = landmarks[12]; // Approximate lower lip
    const mouthOpen = lowerLip.y - upperLip.y > 10;
    return !mouthOpen;
  };

  const checkShadows = (canvas, box) => {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(box.x, box.y, box.width, box.height);
    const data = imageData.data;
    let darkPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness < 50) darkPixels++;
    }
    return darkPixels / (box.width * box.height) > 0.1;
  };

  // ---------------- File Upload + Vision API Face Detection ----------------
  const handleFileChange = () => {
    return new Promise((resolve) => {
      const file = inputRef.current?.files?.[0];
      if (!file) return resolve();
  
      setMessage("");
      setIsBgRemoved(false);
      setDownloadUrl(null);
      setFile(file);
  
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageBase64 = event.target.result;
        setPreviewUrl(imageBase64);
  
        try {
          // Step 1: Upload to Supabase or temporary API to get public URL
          const uploadForm = new FormData();
          uploadForm.append("file", file);
  
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
          const uploadText = await uploadRes.text(); // safer than res.json()
          let uploadData = {};
  
          try {
            uploadData = uploadText ? JSON.parse(uploadText) : {};
          } catch (e) {
            console.warn("Upload API returned non-JSON:", uploadText);
            uploadData = {};
          }
  
          if (!uploadRes.ok || !uploadData.url) {
            throw new Error(uploadData.error || `Upload failed (status ${uploadRes.status})`);
          }
  
          const imageUrl = uploadData.url;
  
          // Step 2: Call Vision API backend for analysis
          setMessage("🔍 Analyzing your photo to ensure it meets passport standards...");
          const analyzeRes = await fetch("/api/analyze-face", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl }),
          });
  
          const analyzeText = await analyzeRes.text(); // safer parsing
          let data = {};
          try {
            data = analyzeText ? JSON.parse(analyzeText) : {};
          } catch (e) {
            console.warn("Vision API returned non-JSON:", analyzeText);
            data = {};
          }
  
          if (!analyzeRes.ok) {
            throw new Error(data.error || `Vision API failed (status ${analyzeRes.status})`);
          }
  
          // Step 3: Handle Vision API result
         if (data.success) {
            setIsCompliant(data.isCompliant);
            setMessage(data.message.replace("Face meets passport requirements", "Photo approved by Snappcrop AI"));
          }
         else {
            setMessage(data.message || "⚠️ Could not analyze face.");
          }
  
        } catch (error) {
          console.error("Face detection error:", error);
          setMessage(`⚠️ Face analysis failed. (${error.message})`);
        }
  
        resolve();
      };
  
      reader.onerror = () => {
        console.error("File read error");
        setMessage("⚠️ Failed to read image. Please try again.");
        resolve();
      };
  
      reader.readAsDataURL(file);
    });
  };
  
  const triggerFile = () => {
    inputRef.current?.click();
    handleFileChange().catch((error) => console.error("Upload error:", error));
  };

  // ---------------- Background Removal ----------------
  // ---------------- Background Removal ----------------
  const handleRemoveBackground = async () => {
    if (!file || !previewUrl) {
      return setMessage("Please upload a selfie first.");
    }
  
    setLoading(true);
    setMessage("🪄 Removing background...");
  
    try {
      // ✅ Reuse the Supabase image URL from upload (same used in Vision API)
      const uploadForm = new FormData();
      uploadForm.append("file", file);
  
      // Step 1: Get the existing Supabase public URL if not already stored
      const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
      const uploadText = await uploadRes.text();
      let uploadData = {};
      try {
        uploadData = uploadText ? JSON.parse(uploadText) : {};
      } catch {
        uploadData = {};
      }
  
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || `Upload failed (status ${uploadRes.status})`);
      }
  
      const imageUrl = uploadData.url;

      console.log("Background removal sending:", imageUrl);  
      // ✅ Step 2: Send Supabase image URL directly to /api/remove-bg
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
  
      console.log("API response status:", res.status);
      const text = await res.text();
      console.log("Raw API response:", text);
  
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
  
      if (!res.ok) {
        throw new Error(data.error || `HTTP Error ${res.status}`);
      }
  
      // ✅ Update UI with background-removed image
      if (data.image) {
        setPreviewUrl(data.image);
        setIsBgRemoved(true);
        setMessage("✅ Background removed successfully!");
      } else if (data.url) {
        setPreviewUrl(data.url);
        setIsBgRemoved(true);
        setMessage("✅ Background removed successfully!");
      } else {
        setMessage("⚠️ Background removal returned no image.");
      }
    } catch (error) {
      console.error("Background removal error:", error);
      setMessage(`⚠️ Failed to remove background. (${error.message})`);
    } finally {
      setLoading(false);
    }
  };
    
  // ---------------- Crop & Save ----------------
  const handleCropAndSave = async () => {
    if (!croppedAreaPixels || !previewUrl)
      return setMessage("Please crop your image first.");
  
    setLoading(true);
    setMessage("Processing...");
  
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => (img.onload = resolve));
  
      // Define passport sizes (in pixels)
      const sizeMap = {
        us: { width: 600, height: 600 },
        uk: { width: 827, height: 1063 },
        eu: { width: 827, height: 1063 },
        india: { width: 413, height: 531 },
        china: { width: 390, height: 567 },
        ghana: { width: 600, height: 600 },
      };
  
      const { width, height } = sizeMap[selectedSize] || sizeMap.us;
  
      // Create canvas with selected background color
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
  
      // Fill background with chosen color
      ctx.fillStyle = bgColor.toLowerCase() === "red" ? "#ff0000" : "#ffffff";
      ctx.fillRect(0, 0, width, height);
  
      // Draw cropped face centered in canvas
      const scale = Math.min(
        width / croppedAreaPixels.width,
        height / croppedAreaPixels.height
      );
      const drawWidth = croppedAreaPixels.width * scale;
      const drawHeight = croppedAreaPixels.height * scale;
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;
  
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
  
      // Convert to blob and upload
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );
  
      const fd = new FormData();
      fd.append("file", blob, `snappcrop-${selectedSize}-${bgColor}-${Date.now()}.jpg`);
  
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
  
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
  
      setDownloadUrl(data.url);
      setMessage(
        `✅ Saved successfully! (${selectedSize.toUpperCase()} size, ${bgColor} background)`
      );
    } catch (error) {
      console.error("Save error:", error);
      setMessage(`⚠️ Error saving image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  // ---------------- UI ----------------
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-100 overflow-hidden">
      {/* Background Waves */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent opacity-40 animate-wave-slow"></div>
        <div className="absolute bottom-0 right-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent opacity-40 animate-wave-fast"></div>
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hero Section */}
      <section className="w-full max-w-6xl px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-10 mx-auto">
        {/* Left side */}
        <div className="flex flex-col items-start gap-5 text-left max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 10 }}
            className="flex items-center gap-4"
          >
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border border-sky-100 hover:scale-105 transition duration-300 ease-in-out">
              <NextImage
                src={logo}
                alt="Snappcrop Logo"
                fill
                className="object-contain brightness-110"
                priority
              />
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-sky-800 tracking-tight">
              Snappcrop
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg sm:text-xl text-slate-600 leading-relaxed"
          >
            Transform your selfie into a perfect passport photo — smart cropping,
            background cleanup, and official dimensions in seconds.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="flex flex-col sm:flex-row flex-wrap items-center gap-3 mt-6 w-full"
          >
            <button
              onClick={triggerFile}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold rounded-full shadow-md transition text-sm sm:text-base"
            >
              <FaCloudUploadAlt /> Take a Selfie!
            </button>
            <a
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-white text-sky-700 border border-sky-200 rounded-full font-semibold shadow-sm hover:shadow-md hover:bg-sky-50 transition text-sm sm:text-base"
            >
              About
            </a>
            <a
              href="/gallery"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-white text-sky-700 border border-sky-200 rounded-full font-semibold shadow-sm hover:shadow-md hover:bg-sky-50 transition text-sm sm:text-base"
            >
              Gallery
            </a>
          </motion.div>
        </div>

        {/* Right side - Process Flow Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative w-full max-w-[420px] rounded-3xl shadow-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-8 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated gradient blobs */}
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-sky-200/40 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-indigo-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        
          {/* Step circles */}
          <div className="relative z-10 flex flex-col gap-8 items-center justify-center w-full">
            {[
              { icon: <FaCloudUploadAlt />, title: "Upload", color: "from-sky-500 to-blue-500" },
              { icon: <FaMagic />, title: "Remove Background", color: "from-indigo-500 to-purple-500" },
              { icon: <FaDownload />, title: "Crop & Save", color: "from-emerald-500 to-green-500" },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.3 }}
                className="flex flex-col items-center"
              >
                <div
                  className={`w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br ${step.color} text-white shadow-lg`}
                >
                  {step.icon}
                </div>
                <p className="mt-2 font-semibold text-sky-700">{step.title}</p>
                {i < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.3 + 0.2, duration: 0.8 }}
                    className="w-1 h-8 bg-gradient-to-b from-sky-400 to-indigo-400 rounded-full origin-top"
                  ></motion.div>
                )}
              </motion.div>
            ))}
          </div>
        
          {/* Caption */}
          <p className="mt-6 text-sm text-gray-600 italic text-center">
            Guided AI process — from upload to passport perfection
          </p>
        </motion.div>
      </section>

      {/* Upload & Crop Section */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.15 } } }}
        className="relative z-10 flex flex-col items-center px-6 pb-24"
      >
        <motion.div
          variants={fadeUp}
          className="w-full max-w-3xl bg-white/80 backdrop-blur-md border border-blue-100 rounded-3xl shadow-2xl p-8 text-center"
        >
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50/40">
              <FaCloudUploadAlt className="text-5xl text-sky-600 mb-3 animate-bounce" />
              <p className="text-sky-700 font-medium">
                Upload your selfie to get started
              </p>
            </div>
          ) : (
            <>
               {/* Live color preview background */}
                <div
                  className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-blue-100 transition-colors duration-500"
                  style={{
                    backgroundColor: bgColor === "red" ? "#ff0000" : "#ffffff",
                  }}
                >
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    showGrid={false}
                  />
                </div>

              {/* Options: Size + Background */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap mt-6 items-center">
                {/* Choose Size */}
                <div className="flex flex-col items-start">
                  <label className="text-sm font-semibold text-slate-600 mb-1">
                    Choose Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="border border-sky-200 rounded-full px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="us">US (2x2 inch / 600x600 px)</option>
                    <option value="uk">UK (35x45 mm / 827x1063 px)</option>
                    <option value="eu">EU (35x45 mm / 827x1063 px)</option>
                    <option value="india">India (35x45 mm / 413x531 px)</option>
                    <option value="china">China (33x48 mm / 390x567 px)</option>
                    <option value="ghana">Ghana (2x2 inch / 600x600 px)</option>
                  </select>
                </div>
              
                {/* Choose Background Color */}
                <div className="flex flex-col items-start">
                  <label className="text-sm font-semibold text-slate-600 mb-1">
                    Background Color
                  </label>
                  <select
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="border border-sky-200 rounded-full px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="white">White</option>
                    <option value="red">Red</option>
                  </select>
                </div>
              
                {/* Action Buttons */}
                <div className="flex gap-4 mt-2 sm:mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={handleRemoveBackground}
                    disabled={loading || isBgRemoved}
                    className={`px-6 py-3 rounded-full font-semibold text-white shadow-md transition ${
                      isBgRemoved
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-sky-600 hover:bg-sky-700"
                    }`}
                  >
                    <FaMagic className="inline mr-2" />
                    {isBgRemoved ? "Background Removed" : "Remove Background"}
                  </motion.button>
              
                  <motion.button
                    whileHover={isBgRemoved && !loading ? { scale: 1.05 } : {}}
                    onClick={isBgRemoved ? handleCropAndSave : null}
                    disabled={loading || !isBgRemoved}
                    className={`px-6 py-3 rounded-full font-semibold text-white shadow-md transition ${
                      !isBgRemoved
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    <FaDownload className="inline mr-2" />
                    {isBgRemoved ? "Crop & Save" : "Remove Background First"}
                  </motion.button>
                </div>
              </div>
            </>
          )}

          {downloadUrl && (
            <>
              {/* Download button triggers the prompt */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowDownloadPrompt(true)}
                className="block mt-8 mx-auto text-center bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white py-3 px-8 rounded-full font-semibold shadow-lg"
              >
                Download Passport Photo
              </motion.button>
          
              {/* Snappcrop Gradient Modal */}
              {showDownloadPrompt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative bg-gradient-to-br from-sky-100 via-white to-indigo-50 border border-sky-200 shadow-2xl rounded-3xl w-[90%] max-w-sm p-6 text-center"
                  >
                    <h3 className="text-xl font-extrabold text-sky-800 mb-2">
                      Download Your Passport Photo
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                      Would you like to <strong>save</strong> this passport photo to your device,
                      or <strong>open</strong> it in a new tab?
                    </p>
          
                    <div className="flex justify-center gap-3">
                      {/* Save Option */}
                      <button
                        onClick={async () => {
                          try {
                            // If File System Access API available (Desktop)
                            if (window.showSaveFilePicker) {
                              const response = await fetch(downloadUrl);
                              const blob = await response.blob();
                              const handle = await window.showSaveFilePicker({
                                suggestedName: "snappcrop-passport-photo.jpg",
                                types: [{ description: "JPEG image", accept: { "image/jpeg": [".jpg"] } }],
                              });
                              const writable = await handle.createWritable();
                              await writable.write(blob);
                              await writable.close();
                              alert("✅ Photo saved successfully!");
                            } else {
                              // Fallback to Blob download
                              const response = await fetch(downloadUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = "snappcrop-passport-photo.jpg";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);                      
                              
                            }
                          } catch (err) {
                            console.error("Save failed:", err);
                            alert("⚠️ Unable to save photo. Please try again.");
                          } finally {
                            setShowDownloadPrompt(false);
                          }
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-medium shadow-md transition"
                      >
                        💾 Save to Device
                      </button>
          
                      {/* Open Option */}
                      <button
                        onClick={() => {
                          window.open(downloadUrl, "_blank");
                          setShowDownloadPrompt(false);
                        }}
                        className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-sm font-medium shadow-md transition"
                      >
                        🌐 Open
                      </button>
                    </div>
          
                    {/* Cancel Option */}
                    <button
                      onClick={() => setShowDownloadPrompt(false)}
                      className="block mt-5 mx-auto text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Cancel
                    </button>
          
                    {/* Subtle glowing ring */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-300 to-indigo-300 opacity-20 blur-2xl -z-10"></div>
                  </motion.div>
                </motion.div>
              )}
            </>
          )}            
        </motion.div>
      </motion.section>

      {/* Live Demo Section */}
      <section className="relative z-10 text-center pb-32">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl font-extrabold text-sky-800 mb-12"
        >
          See Snappcrop in Action
        </motion.h2>

        <div className="relative w-[280px] sm:w-[320px] md:w-[360px] mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-blue-100">
          <motion.div
            key="demo2-selfie"
            initial={{ opacity: 1 }}
            animate={{ opacity: showPassport ? 0 : 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src="/demo-selfie2.png"
              alt="Before - Selfie (diverse)"
              className="w-full h-full object-cover brightness-95"
            />
          </motion.div>
          
          <motion.div
            key="demo2-passport"
            initial={{ opacity: 0 }}
            animate={{ opacity: showPassport ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src="/demo-passport2.png"
              alt="After - Passport Photo (diverse)"
              className="w-full h-full object-cover brightness-100"
            />
          </motion.div>
        </div>

        <p className="mt-6 text-gray-600 text-sm max-w-lg mx-auto">
          Watch how Snappcrop automatically transforms your selfie into a
          passport-ready photo.
        </p>
      </section>

      {/* Footer */}
      <footer className="text-center pb-10 text-gray-500 text-sm">
        © {new Date().getFullYear()} Snappcrop — Speak. Snap. Smile.
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0.8;
            transform: scale(1.03);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 2s ease-in-out;
        }
        @keyframes wave-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes wave-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-wave-slow { animation: wave-slow 6s ease-in-out infinite; }
        .animate-wave-fast { animation: wave-fast 4s ease-in-out infinite; }
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10px, -10px) scale(1.1); }
          66% { transform: translate(-10px, 10px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 0.95; box-shadow: 0 0 10px rgba(56, 189, 248, 0.3); }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 20px rgba(79, 70, 229, 0.4); }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2.5s ease-in-out infinite;
        }        
      `}</style>

        {/* Global Loading Overlay */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            {/* Spinner with Snappcrop Logo */}
            <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
              {/* Outer Rings */}
              <div className="absolute inset-0 rounded-full border-4 border-sky-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-600 animate-spin"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-b-indigo-500 animate-spin-slow"></div>
        
              {/* Logo in center */}
              <div className="absolute w-10 h-10 rounded-full overflow-hidden shadow-lg bg-white flex items-center justify-center animate-pulse-soft">
                <NextImage
                  src={logo}
                  alt="Snappcrop Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>
        
            {/* Text below */}
            <p className="text-sky-700 font-semibold text-sm animate-pulse">
              Processing your photo, please wait...
            </p>
          </motion.div>
        )}
    </main>
  );
}
