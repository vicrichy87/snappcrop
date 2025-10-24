import vision from "@google-cloud/vision";

// ✅ Initialize Vision client using environment variables (Vercel-safe)
const client = new vision.ImageAnnotatorClient({
  credentials: {
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GCP_CLIENT_EMAIL,
  },
  projectId: process.env.GCP_PROJECT_ID,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageUrl } = JSON.parse(req.body);
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing imageUrl" });
    }

    // ✅ Call Google Vision API
    const [result] = await client.faceDetection(imageUrl);
    const faces = result.faceAnnotations || [];

    if (faces.length === 0) {
      return res.status(200).json({
        success: false,
        message: "⚠️ No face detected. Please upload a clear selfie.",
      });
    }

    // ✅ Extract key facial data
    const face = faces[0];
    const emotions = {
      joy: face.joyLikelihood,
      sorrow: face.sorrowLikelihood,
      anger: face.angerLikelihood,
      surprise: face.surpriseLikelihood,
      headTilt: face.tiltAngle,
      pan: face.panAngle,
      roll: face.rollAngle,
      underExposed: face.underExposedLikelihood,
      blurred: face.blurredLikelihood,
    };

    // ✅ Compliance logic
    const nonNeutralEmotions = ["LIKELY", "VERY_LIKELY"];
    const hasEmotion =
      nonNeutralEmotions.includes(emotions.joy) ||
      nonNeutralEmotions.includes(emotions.anger) ||
      nonNeutralEmotions.includes(emotions.sorrow) ||
      nonNeutralEmotions.includes(emotions.surprise);

    const hasTilt = Math.abs(emotions.headTilt) > 10;
    const hasPan = Math.abs(emotions.pan) > 10;
    const isNeutral = !hasEmotion && !hasTilt && !hasPan;

    const complianceMessage = isNeutral
      ? "✅ Face detected and complies with passport photo standards."
      : "⚠️ Face detected, but expression or head angle may not comply.";

    // ✅ Return structured data for frontend
    return res.status(200).json({
      success: true,
      message: complianceMessage,
      isCompliant: isNeutral,
      details: emotions,
    });
  } catch (error) {
    console.error("❌ Vision API error:", error);
    return res.status(500).json({
      error: `Vision API error: ${error.message}`,
    });
  }
}
