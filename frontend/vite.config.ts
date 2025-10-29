import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    port: 5173,
    allowedHosts: [
      'pleadingly-misshapen-wilber.ngrok-free.dev', // 👈 add your ngrok host here
    ],
  },
 


  // server: {
  //   host: true,          // listen on all interfaces
  //   port: 5173,
  //   // ✅ allow Cloudflare Tunnel hostnames
  //   allowedHosts: [/.*\.trycloudflare\.com$/],
  //   // ✅ fix HMR over HTTPS tunnel
  //   hmr: {
  //     protocol: 'wss',
  //     host: 'voice-refuse-desirable-english.trycloudflare.com', // or omit host if you prefer clientPort only
  //     port: 443,
  //     // alternatively: clientPort: 443,
  //   },
  //   // ✅ sets absolute URLs in HMR payloads (helps some setups)
  //   origin: 'https://voice-refuse-desirable-english.trycloudflare.com',
  // },


  // server: {
  //   host: true,
  //   port: 5173,

  //   // ✅ Allow both ngrok and Cloudflare tunnels
  //   allowedHosts: [
  //     'pleadingly-misshapen-wilber.ngrok-free.dev',
  //     /.*\.trycloudflare\.com$/,
  //   ],

  //   // ✅ Enable HMR over HTTPS (for Cloudflare)
  //   hmr: {
  //     protocol: 'wss',
  //     host: 'voice-refuse-desirable-english.trycloudflare.com',
  //     port: 443,
  //   },

  //   // ✅ Make HMR and asset URLs absolute
  //   origin: 'https://voice-refuse-desirable-english.trycloudflare.com',
  // },
});
