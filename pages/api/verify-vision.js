// pages/api/verify-vision.js
import vision from "@google-cloud/vision";

export default async function handler(req, res) {
  try {
    // Step 1: Parse GOOGLE_CREDENTIALS from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    // Step 2: Initialize Vision API client
    const client = new vision.ImageAnnotatorClient({ credentials });

    // Step 3: Use a public test image (Google Cloud sample)
    const imageUrl = "https://storage.googleapis.com/cloud-samples-data/vision/face/faces.jpeg";

    // Step 4: Run face detection test
    const [result] = await client.faceDetection(imageUrl);
    const faces = result.faceAnnotations || [];

    if (faces.length === 0) {
      return res.status(200).json({
        success: true,
        message: "✅ Vision API connected, but no faces detected in sample image.",
      });
    }

    const face = faces[0];
    return res.status(200).json({
      success: true,
      message: "✅ Vision API connected successfully!",
      joyLikelihood: face.joyLikelihood,
      angerLikelihood: face.angerLikelihood,
      detectionConfidence: face.detectionConfidence,
    });
  } catch (error) {
    console.error("❌ Vision API verification failed:", error);
    return res.status(500).json({
      success: false,
      message: `❌ Vision API verification failed: ${error.message}`,
    });
  }
}
