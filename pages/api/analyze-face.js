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

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}");
    const client = new vision.ImageAnnotatorClient({ credentials });

    // 🧠 Step 1: Try to fetch the image
    let imageRequest;
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Image fetch failed (${response.status})`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageRequest = { image: { content: buffer.toString("base64") } };
    } catch (fetchError) {
      console.warn("⚠️ Could not fetch image directly, falling back to URL:", fetchError);
      imageRequest = { image: { source: { imageUri: imageUrl } } };
    }

    // 🧠 Step 2: Call Vision API
    const [result] = await client.faceDetection(imageRequest);
    const faces = result.faceAnnotations || [];

    if (!faces.length) {
      return res.status(200).json({
        success: true,
        isCompliant: false,
        message: "⚠️ No face detected. Please ensure your face is visible.",
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
      message: `❌ Vision API failed: ${error.message}`,
    });
  }
}
