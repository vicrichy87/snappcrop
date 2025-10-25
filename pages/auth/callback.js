// pages/auth/callback.js
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    // When redirected back from Google
    const handleAuth = async () => {
      await supabase.auth.getSession();
      window.opener?.postMessage("google-login-success", "*");
      window.close(); // ✅ Closes popup automatically
    };
    handleAuth();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-100 text-sky-700 font-semibold text-lg">
      Finishing login process...
    </div>
  );
}
