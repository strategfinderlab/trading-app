import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "soporte@strategyfinderlab.com",
  to: email,
  subject: "Bienvenido a Strategy Finder Lab",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #111;">
      
      <h2 style="color:#d4af37;">Bienvenid@ a Strategy Finder Lab</h2>

      <p>Tu acceso ya está activo.</p>

      <p>
        Entra aquí y crea tu contraseña pulsando <b>“Primer acceso”</b>:
      </p>

      <p style="margin: 20px 0;">
        <a href="https://strategyfinderlab.com/login"
           style="background:#d4af37; color:#000; padding:12px 20px; text-decoration:none; border-radius:6px; font-weight:bold;">
          Acceder a Strategy Finder Lab
        </a>
      </p>

      <p>
        Tu email de acceso es el mismo con el que has realizado el pago.
      </p>

      <p>
        Una vez dentro, ya puedes empezar a registrar tus entradas y analizar tu estrategia con datos reales.
      </p>

      <hr style="margin:30px 0; border:none; border-top:1px solid #eee;" />

      <p style="font-size:14px; color:#555;">
        Una petición personal: cuando lleves unas semanas usando la herramienta,
        me encantaría saber qué te parece. Tu feedback me ayuda muchísimo a mejorarla.
      </p>

      <p style="font-size:14px; color:#555;">
        Si tienes cualquier duda, puedes responder directamente a este email.
      </p>

      <p style="margin-top:30px;">
        — Strategy Finder Lab
      </p>

    </div>
  `,
});