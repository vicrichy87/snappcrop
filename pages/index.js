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
import { getSession } from "./_app";

export default function Home() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const inputRef = useRef(null);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMessage("");
    setIsBgRemoved(false);
    setDownloadUrl(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(f);
  };

  const triggerFile = () => inputRef.current?.click();

  const handleRemoveBackground = async () => {
    if (!file || !previewUrl) return setMessage("Please upload a selfie first.");
    setLoading(true);
    setMessage("Removing background...");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error");
      setPreviewUrl(data.url);
      setIsBgRemoved(true);
      setMessage("Background removed successfully!");
    } catch {
      setMessage("Failed to remove background. Try again.");
    } finally {
      setLoading(false);
    }
  };

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
      const blob = await new Promise((r) =>
        canvas.toBlob(r, "image/jpeg", 0.95)
      );
      const fd = new FormData();
      fd.append("file", blob, `snappcrop-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");

      const session = await getSession();
      if (session?.user?.id) {
        await supabase.from("photos").insert({
          user_id: session.user.id,
          filename: data.url.split("/").pop(),
        });
      }

      setDownloadUrl(data.url);
      setMessage("Saved successfully!");
    } catch {
      setMessage("Error saving image.");
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100 min-h-screen flex flex-col items-center justify-center px-6">
      {/* Floating Blobs */}
      <div className="absolute top-[-10rem] left-[-10rem] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute bottom-[-10rem] right-[-10rem] w-[400px] h-[400px] bg-purple-200/40 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.15 } } }}
        className="text-center mt-20 mb-10 relative z-10"
      >
        <motion.div variants={fadeUp} className="flex justify-center mb-4">
          <Image
            src={logo}
            alt="Snappcrop Logo"
            width={90}
            height={90}
            className="rounded-2xl shadow-md object-contain"
            priority
          />
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-5xl font-extrabold text-sky-800 drop-shadow-sm"
        >
          Create Perfect Passport Photos Instantly
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Upload your selfie and let AI handle the rest — cropping, background
          removal, and export in perfect passport dimensions.
        </motion.p>
      </motion.section>

      {/* Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-3xl border border-blue-100"
      >
        {!previewUrl ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/30"
          >
            <FaCloudUploadAlt className="text-5xl text-blue-600 mb-3 animate-bounce" />
            <button
              onClick={triggerFile}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition"
            >
              Upload Selfie
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>
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
            <div className="flex justify-between mt-6 flex-wrap gap-3">
              <button
                onClick={handleRemoveBackground}
                disabled={loading}
                className={`px-6 py-3 rounded-full text-white font-semibold transition ${
                  isBgRemoved
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <FaMagic className="inline mr-2" />
                {isBgRemoved ? "Background Removed" : "Remove Background"}
              </button>
              <button
                onClick={handleCropAndSave}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold shadow-md"
              >
                <FaDownload className="inline mr-2" /> Crop & Save
              </button>
            </div>
          </>
        )}
        {downloadUrl && (
          <motion.a
            href={downloadUrl}
            download
            whileHover={{ scale: 1.05 }}
            className="block mt-6 text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-full font-semibold shadow-lg"
          >
            Download Passport Photo
          </motion.a>
        )}
        {message && (
          <p className="mt-4 text-sm text-gray-600 text-center italic">
            {message}
          </p>
        )}
      </motion.div>

      {/* Footer */}
      <footer className="mt-16 text-gray-500 text-sm text-center z-10">
        © {new Date().getFullYear()} Snappcrop — Speak. Snap. Smile.
      </footer>

      {/* blob animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -20px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 10px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </main>
  );
}
