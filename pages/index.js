// pages/index.js
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { FaCamera, FaCloudUploadAlt, FaMagic, FaDownload } from "react-icons/fa";
import logo from "../public/logo.png";
import { supabase } from "../lib/supabase";
import { getSession } from "./_app";


/**
 * Snappcrop - Elegant Home + Photo Cropper
 * - Upload selfie or take from camera
 * - Preview with react-easy-crop
 * - Remove background (server-side /api/remove-bg)
 * - Crop & save (POST to /api/upload then save metadata to Supabase)
 *
 * Note: Tailwind utility classes used heavily. Ensure tailwind is configured
 * and styles/globals.css imports the Tailwind directives.
 */

export default function Home() {
  // image & editor state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const inputRef = useRef(null);

  // load optional face-api (non-blocking)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === "undefined") return;
      try {
        // lazy-load only if present in node_modules/public/models
        const faceapi = await import("face-api.js").catch(() => null);
        if (!faceapi) return;
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        if (mounted) setMessage((m) => (m ? m : "Face models ready"));
      } catch {
        // silent fail
      }
    })();
    return () => (mounted = false);
  }, []);

  // helpers
  const onCropComplete = useCallback((area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      return;
    }
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
    if (!file || !previewUrl) {
      setMessage("Select an image first.");
      return;
    }
    setLoading(true);
    setMessage("Removing background...");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data?.error || "Remove BG failed");
      setPreviewUrl(data.url);
      setIsBgRemoved(true);
      setMessage("Background removed — looking great!");
    } catch (err) {
      console.error(err);
      setMessage("Background removal failed. Try again or upload a clearer selfie.");
    } finally {
      setLoading(false);
    }
  };

  const handleCropAndSave = async () => {
    if (!croppedAreaPixels || !previewUrl) {
      setMessage("Please crop the image first.");
      return;
    }
    setLoading(true);
    setMessage("Preparing image...");
    try {
      // draw crop to canvas
      const img = new Image();
      img.src = previewUrl;
      await new Promise((r) => (img.onload = r));
      const canvas = document.createElement("canvas");
      canvas.width = 600; // produce 600x600 final
      canvas.height = 600;
      const ctx = canvas.getContext("2d");

      // draw selected area scaled to canvas
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

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      const fd = new FormData();
      fd.append("file", blob, `snappcrop-${Date.now()}.jpg`);

      setMessage("Uploading...");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data?.error || "Upload failed");

      // store metadata in Supabase
      const session = await getSession();
      if (session?.user?.id) {
        await supabase.from("photos").insert({
          user_id: session.user.id,
          filename: data.url.split("/").pop(),
        });
      }
      setDownloadUrl(data.url);
      setMessage("Saved! Your passport photo is ready.");
    } catch (err) {
      console.error(err);
      setMessage("Save failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // UI variants for framer-motion
  const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-100 flex flex-col items-center">
      {/* NAV / HERO */}
      <section className="w-full max-w-6xl px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
        <div className="flex items-center justify-center">
          <Image
            src={logo}
            alt="Snappcrop Logo"
            width={80}
            height={80}
            className="rounded-2xl shadow-md object-contain"
            priority
          />
        </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-sky-800 leading-tight">
              Snappcrop — Instant passport photos from your selfie
            </h1>
            <p className="mt-2 text-slate-600 max-w-xl">
              Smart crop, background removal, and format-ready exports for passports, visas and ID cards — all in seconds.
            </p>             
            <div className="mt-4 flex gap-3">
              <button
                onClick={triggerFile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-md transition"
              >
                <FaCloudUploadAlt /> Try it now
              </button>
              <a href="#how" className="inline-flex items-center gap-2 px-4 py-2 border border-sky-200 rounded-full text-sky-700 hover:bg-sky-50 transition">
                How it works
              </a>
            </div>
          </div>
        </div>

        {/* Animated hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-[420px] aspect-[16/10] bg-gradient-to-br from-white to-sky-50 rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex items-center justify-center"
        >
          {/* decorative blurred blobs */}
          <div className="absolute -left-8 -top-8 w-48 h-48 bg-sky-200/60 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-amber-200/40 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

          {/* phone mockup with floating avatar preview */}
          <div className="relative w-56 h-[370px] bg-white rounded-2xl shadow-inner flex flex-col items-center justify-start p-4">
            <div className="w-full h-44 rounded-lg bg-slate-100/60 border border-slate-100 flex items-center justify-center overflow-hidden">
              {/* placeholder phone image */}
              <div className="text-slate-400 text-sm">Upload a selfie to preview</div>
            </div>
            <div className="mt-4 w-full text-center">
              <div className="text-sm text-slate-500">1 selfie → 1 passport photo</div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-medium">
                <FaMagic /> Auto background removal
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* MAIN EDITOR CARD */}
      <section className="w-full max-w-4xl px-6 lg:px-12 mb-12">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="bg-white rounded-3xl shadow-2xl p-6 md:p-10"
        >
          {/* Upload / Controls */}
          <motion.div variants={fadeUp} className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left: uploader + cropper preview */}
            <div className="flex-1">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                {/* preview area */}
                <div className="relative w-full h-[420px] bg-slate-50">
                  {previewUrl ? (
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
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <FaCamera size={42} />
                      <p className="mt-3">No image selected. Click “Upload” to begin.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* zoom control */}
              <div className="mt-4 flex items-center gap-3">
                <input
                  aria-label="Zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
                <div className="w-36 text-sm text-slate-500 text-right">Zoom</div>
              </div>
            </div>

            {/* Right: actions & info */}
            <div className="w-full md:w-[320px] flex-shrink-0">
              <div className="sticky top-24">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600">Upload</label>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={triggerFile}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow"
                    >
                      <FaCloudUploadAlt /> Upload / Take photo
                    </button>
                    <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600">Background</label>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={handleRemoveBackground}
                      disabled={!previewUrl || loading}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                        isBgRemoved ? "bg-emerald-500 text-white" : "bg-white text-sky-700 border border-sky-100 hover:shadow"
                      }`}
                    >
                      <FaMagic />
                      {isBgRemoved ? "Removed" : loading ? "Working..." : "Remove BG"}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-600">Export</label>
                  <div className="mt-2 grid grid-cols-1 gap-3">
                    <button
                      onClick={handleCropAndSave}
                      disabled={loading || !previewUrl}
                      className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                    >
                      <FaDownload /> Crop & Save (600×600)
                    </button>

                    {downloadUrl && (
                      <a
                        href={downloadUrl}
                        className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow"
                        download
                      >
                        Download Photo
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-600 space-y-2">
                  <div>
                    <strong className="text-slate-700">Tips</strong>
                    <ul className="list-disc ml-5 mt-2">
                      <li>Face forward, neutral expression</li>
                      <li>Avoid heavy shadows and bright backlight</li>
                      <li>Use plain clothes and remove glasses if possible</li>
                    </ul>
                  </div>
                </div>

                {/* small message */}
                <div className="mt-6 text-center text-sm">
                  <div className="inline-block px-3 py-2 rounded-lg bg-sky-50 border border-sky-100 text-slate-700 shadow-sm">
                    {message || "Ready"}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* features / footer area */}
          <motion.div variants={fadeUp} className="mt-8 border-t pt-6">
            <div id="how" className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
                <h4 className="font-semibold text-sky-700">Smart Crop</h4>
                <p className="mt-2 text-sm text-slate-600">Auto-centers your face and suggests a perfect passport crop.</p>
              </div>
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
                <h4 className="font-semibold text-sky-700">Background Removal</h4>
                <p className="mt-2 text-sm text-slate-600">AI-powered background replacement for official requirements.</p>
              </div>
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
                <h4 className="font-semibold text-sky-700">Formats & Download</h4>
                <p className="mt-2 text-sm text-slate-600">Export 600×600 or other sizes ready for printing or upload.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Snappcrop — Built with care • Privacy-focused
      </footer>

      {/* tiny utility styles (animation helper) */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translateY(0px) scale(1);
          }
          33% {
            transform: translateY(-8px) scale(1.05);
          }
          66% {
            transform: translateY(0px) scale(1);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 6s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </main>
  );
}
