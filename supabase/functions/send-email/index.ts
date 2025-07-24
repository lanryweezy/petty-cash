import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createTransport } from "https://deno.land/x/nodemailer/mod.ts";

serve(async (req) => {
  const { to, subject, text } = await req.json()

  const transporter = createTransport({
    host: Deno.env.get("SMTP_HOST"),
    port: Deno.env.get("SMTP_PORT"),
    secure: false,
    auth: {
      user: Deno.env.get("SMTP_USER"),
      pass: Deno.env.get("SMTP_PASS"),
    },
  });

  const mailOptions = {
    from: Deno.env.get("SMTP_USER"),
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(
      JSON.stringify({ message: "Email sent successfully" }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
