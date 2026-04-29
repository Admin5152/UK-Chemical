import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const MANAGER_EMAIL = "sethagyeimensah2@gmail.com";
const APP_URL = process.env.APP_URL || "https://ukchemical3.vercel.app";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Notify Manager about new approval request
  app.post("/api/notify-approval", async (req, res) => {
    const { requestId } = req.body;
    
    try {
      const { data: request, error } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error || !request) {
        return res.status(404).json({ error: "Request not found" });
      }

      const approveUrl = `${APP_URL}/api/resolve-approval?id=${requestId}&decision=approved`;
      const denyUrl = `${APP_URL}/api/resolve-approval?id=${requestId}&decision=denied`;

      await resend.emails.send({
        from: "UK Chemicals <onboarding@resend.dev>",
        to: MANAGER_EMAIL,
        subject: `[Action Required] ${request.requested_by_name} wants to ${request.action_type} ${request.product_name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
            <h2 style="color:#1a1a1a">⚠️ Approval Request — UK Chemicals</h2>
            <p><strong>${request.requested_by_name}</strong> (${request.requested_by_email}) is requesting permission to <strong>${request.action_type}</strong> the product:</p>
            <h3 style="color:#2d6a4f">${request.product_name}</h3>
            <p>Please review and click one of the buttons below to respond:</p>
            <div style="margin:24px 0">
              <a href="${approveUrl}" style="background:#16a34a;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;margin-right:16px;font-weight:bold">✅ ALLOW THIS ACTION</a>
              <a href="${denyUrl}" style="background:#dc2626;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">❌ DENY THIS ACTION</a>
            </div>
            <p style="color:#6b7280;font-size:12px">Request made on ${new Date(request.created_at).toLocaleString()} · UK Chemicals Inventory System</p>
          </div>
        `,
      });

      res.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Notify error:", message);
      res.status(500).json({ error: message });
    }
  });

  // API Route: Handle Approval/Denial from email links
  app.get("/api/resolve-approval", async (req, res) => {
    const { id, decision } = req.query;
    const status = decision === 'approved' ? 'approved' : 'denied';

    try {
      const { data: request, error: fetchError } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !request) {
        return res.status(404).send("Request not found");
      }

      const { error: updateError } = await supabase
        .from("approval_requests")
        .update({
          status: status,
          resolved_at: new Date().toISOString(),
          resolved_by: "Manager"
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Send confirmation email to Employee
      await resend.emails.send({
        from: "UK Chemicals <onboarding@resend.dev>",
        to: request.requested_by_email,
        subject: `Your request was ${status.toUpperCase()}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
            <h2>UK Chemicals — Request Status</h2>
            <p>Hi ${request.requested_by_name},</p>
            <p>Your request to <strong>${request.action_type}</strong> product <strong>${request.product_name}</strong> was <strong>${status}</strong> by the manager.</p>
            ${status === 'approved' ? '<p style="color:green">You have 24 hours to complete this action in the inventory system.</p>' : '<p style="color:red">Please contact your manager if you have questions.</p>'}
          </div>
        `
      });

      res.send(`
        <html>
          <body style="font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f8fafc">
            <h1 style="color:${status === 'approved' ? '#16a34a' : '#dc2626'}">${status.toUpperCase()} Successfully</h1>
            <p>The employee has been notified.</p>
            <a href="${APP_URL}" style="text-decoration:none; color:#10b981; font-weight:bold">← Return to UK Chemicals</a>
          </body>
        </html>
      `);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Resolve error:", message);
      res.status(500).send("Error resolving request: " + message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
