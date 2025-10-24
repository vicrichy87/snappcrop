// /pages/api/analyze-face.js
import vision from "@google-cloud/vision";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { imageUrl } = JSON.parse(req.body || "{}");
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing imageUrl in request" });
    }

    let credentials;
    if (process.env.GOOGLE_CREDENTIALS) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      } catch (e) {
        console.error("❌ Invalid GOOGLE_CREDENTIALS JSON:", e);
        return res.status(500).json({ error: "Invalid GOOGLE_CREDENTIALS" });
      }
    }

    // ✅ Initialize Vision API client safely for Vercel
    const client = new vision.ImageAnnotatorClient({
      credentials: credentials,
    });

    const [result] = await client.faceDetection(imageUrl);
    const faces = result.faceAnnotations || [];

    if (faces.length === 0) {
      return res.status(200).json({
        success: false,
        message: "⚠️ No faces detected. Please try another image.",
      });
    }

    const face = faces[0];
    const joy = face.joyLikelihood;
    const sorrow = face.sorrowLikelihood;
    const anger = face.angerLikelihood;
    const surprise = face.surpriseLikelihood;

    const isCompliant =
      joy === "VERY_UNLIKELY" &&
      sorrow === "VERY_UNLIKELY" &&
      anger === "VERY_UNLIKELY" &&
      surprise === "VERY_UNLIKELY";

    return res.status(200).json({
      success: true,
      isCompliant,
      message: isCompliant
        ? "✅ Face detected and expression neutral — ready for passport photo."
        : "⚠️ Face detected but expression not neutral. Please retake your photo.",
      details: { joy, sorrow, anger, surprise },
    });
  } catch (error) {
    console.error("❌ Vision API error:", error);
    return res.status(500).json({
      error: `Vision API error: ${error.message || "Unknown error"}`,
    });
  }
}
