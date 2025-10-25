// pages/index.js
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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

  // ---------------- Load Google Vision API ----------------
  useEffect(() => {
    setMessage("🧠 Initializing Google Vision for face analysis...");
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
          setMessage("🔍 Analyzing face using Google Vision...");
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
            setMessage(data.message);
            console.log("Vision AI details:", data.details);
          } else {
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
      await new Promise((r) => (img.onload = r));
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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
        600,
        600
      );
      const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.95));
      const fd = new FormData();
      fd.append("file", blob, `snappcrop-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");

      const session = await getSession();
      if (!session?.user?.id) {
        setMessage("Please log in to save your photo.");
        return;
      }
      await supabase.from("photos").insert({
        user_id: session.user.id,
        filename: data.url.split("/").pop(),
      });

      setDownloadUrl(data.url);
      setMessage("✅ Saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      setMessage("⚠️ Error saving image.");
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
              <Image
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

        {/* Right side - animated hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-[420px] aspect-[16/10] bg-gradient-to-br from-white to-sky-50 rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex items-center justify-center"
        >
          {/* Blobs */}
          <div className="absolute -left-8 -top-8 w-48 h-48 bg-sky-200/60 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-indigo-200/40 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

          {/* Crossfade Images + Lottie */}
          <div className="relative w-[260px] sm:w-[320px] md:w-[360px] h-[380px] bg-white rounded-3xl shadow-xl border border-sky-100 overflow-hidden">
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: showPassport ? 0 : 1 }}
              transition={{ duration: 1.2 }}
            >
              <Image src="/demo-selfie.png" alt="Selfie" fill className="object-cover" />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: showPassport ? 1 : 0 }}
              transition={{ duration: 1.2 }}
            >
              <Image src="/demo-passport.png" alt="Passport" fill className="object-cover" />
            </motion.div>

            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
              <Lottie
                animationData={aiTransform}
                loop
                autoplay
                className="w-full h-full opacity-85 mix-blend-overlay"
              />
            </div>
            <div className="absolute bottom-0 w-full text-center bg-white/70 backdrop-blur-md py-3 border-t border-sky-100">
              <p className="text-sm text-slate-600 font-medium">
                AI-powered transformation in seconds
              </p>
            </div>
          </div>
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
              <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-blue-100">
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

              <div className="flex justify-center gap-4 flex-wrap mt-6">
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
                  whileHover={{ scale: 1.05 }}
                  onClick={handleCropAndSave}
                  disabled={loading}
                  className="px-6 py-3 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                >
                  <FaDownload className="inline mr-2" /> Crop & Save
                </motion.button>
              </div>
            </>
          )}

          {downloadUrl && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              href={downloadUrl}
              download
              className="block mt-8 text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-full font-semibold shadow-lg"
            >
              Download Passport Photo
            </motion.a>
          )}
          {message && (
            <p className="mt-4 text-sm text-gray-600 italic">{message}</p>
          )}
          {isCompliant !== null && (
            <p className="mt-2 text-sm text-gray-600">
              {isCompliant
                ? "✅ Image complies with passport standards."
                : "⚠️ Image may not comply. Adjust and retry."}
            </p>
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
            <Image
              src="/demo-selfie2.png"
              alt="Before - Selfie (diverse)"
              fill
              className="object-cover brightness-95"
              priority
            />
          </motion.div>

          <motion.div
            key="demo2-passport"
            initial={{ opacity: 0 }}
            animate={{ opacity: showPassport ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src="/demo-passport2.png"
              alt="After - Passport Photo (diverse)"
              fill
              className="object-cover brightness-100"
              priority
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
      `}</style>
    </main>
  );
}
