import vision from "@google-cloud/vision";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    const { imageUrl } = JSON.parse(req.body || "{}");
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Missing imageUrl" });
    }

    // --- Initialize Vision API client using environment variable ---
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}");
    const client = new vision.ImageAnnotatorClient({ credentials });

    // --- Analyze the image ---
    const [result] = await client.faceDetection(imageUrl);
    const faces = result.faceAnnotations;

    if (!faces || faces.length === 0) {
      return res.status(200).json({
        success: true,
        isCompliant: false,
        message: "⚠️ No face detected. Please ensure your face is clearly visible.",
      });
    }

    const face = faces[0];
    const {
      joyLikelihood,
      angerLikelihood,
      sorrowLikelihood,
      surpriseLikelihood,
      blurredLikelihood,
      headwearLikelihood,
      detectionConfidence,
      rollAngle,
      panAngle,
      tiltAngle,
    } = face;

    // --- Compliance checks ---
    const isNeutralExpression =
      joyLikelihood !== "VERY_LIKELY" &&
      angerLikelihood !== "VERY_LIKELY" &&
      sorrowLikelihood !== "VERY_LIKELY" &&
      surpriseLikelihood !== "VERY_LIKELY";

    const isFaceClear = blurredLikelihood === "VERY_UNLIKELY";
    const noHeadwear = headwearLikelihood === "VERY_UNLIKELY";
    const isFacingForward =
      Math.abs(rollAngle) < 10 && Math.abs(panAngle) < 10 && Math.abs(tiltAngle) < 10;

    const isCompliant =
      isNeutralExpression && isFaceClear && noHeadwear && isFacingForward;

    // --- Build message ---
    let message = "";
    if (isCompliant) {
      message = "✅ Face meets passport requirements: clear, neutral, and facing forward.";
    } else {
      message = "⚠️ Please retake the photo:";
      if (!isNeutralExpression) message += " keep a neutral expression;";
      if (!isFaceClear) message += " improve lighting or focus;";
      if (!noHeadwear) message += " remove hats or sunglasses;";
      if (!isFacingForward) message += " face the camera directly;";
    }

    return res.status(200).json({
      success: true,
      isCompliant,
      message,
      joyLikelihood,
      angerLikelihood,
      blurredLikelihood,
      headwearLikelihood,
      rollAngle,
      panAngle,
      tiltAngle,
      detectionConfidence,
    });
  } catch (error) {
    console.error("Vision API error:", error);
    return res.status(500).json({
      success: false,
      message: `❌ Vision API verification failed: ${error.message || error}`,
    });
  }
}
