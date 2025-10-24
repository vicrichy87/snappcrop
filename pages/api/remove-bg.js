export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const formData = await req.formData?.() || null;
    if (!formData) {
      return res.status(400).json({ error: "Invalid form data" });
    }

    // If you plan to use an external API, call it here
    // Placeholder for now:
    return res.status(200).json({ url: "https://via.placeholder.com/600" });
  } catch (error) {
    console.error("❌ remove-bg error:", error);
    res.status(500).json({ error: "Background removal failed" });
  }
}
