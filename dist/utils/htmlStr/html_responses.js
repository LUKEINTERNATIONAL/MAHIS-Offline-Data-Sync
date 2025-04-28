"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAPIHomePage = void 0;
const getAPIHomePage = (port, apiUrl, qrCodeUrl) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>MAHIS Offline Data Sync API</title>
      <style>
        /* Layout */
        :root {
          --accent: #2c3e50;
          --text-muted: #7f8c8d;
          --bg: #f5f5f5;
          --card-bg: #ffffff;
          --pill-success: #28a745;
        }
  
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
  
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background-color: var(--bg);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          color: #333;
        }
  
        .container {
          background-color: var(--card-bg);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 3rem 2.5rem;
          text-align: center;
          max-width: 640px;
          width: 100%;
          animation: fadeIn 0.6s ease-out;
        }
  
        h1 {
          color: var(--accent);
          margin-bottom: 0.25rem;
          font-size: 1.75rem;
        }
  
        .subtitle {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
  
        .status {
          display: inline-block;
          background-color: var(--pill-success);
          color: #fff;
          border-radius: 9999px;
          padding: 0.5rem 1.25rem;
          font-weight: 600;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }
  
        .api-info {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem 1.25rem;
          text-align: left;
        }
  
        .api-info h3 {
          margin-top: 0;
          color: var(--accent);
          font-size: 1.1rem;
        }
  
        .endpoint {
          font-family: monospace;
          background-color: #e9ecef;
          padding: 0.35rem 0.75rem;
          border-radius: 4px;
          margin: 0.25rem 0;
          display: inline-block;
          font-size: 0.875rem;
        }
  
        .qr-section {
          margin-top: 2rem;
          text-align: center;
        }
  
        .qr-label {
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
  
        .qr-url {
          font-family: monospace;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          color: #666;
          word-break: break-all;
        }
  
        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>MAHIS Offline Data Sync API</h1>
        <p class="subtitle">Secure data synchronization service</p>
        <div class="status">✓ Active</div>
  
        <div class="api-info">
          <h3>Available Endpoints:</h3>
          <p><span class="endpoint">POST /receive-payload</span> – Submit data for synchronization</p>
  
          <h3>Server Information:</h3>
          <p>Environment: ${process.env.NODE_ENV || "Development"}</p>
          <p>Version: 1.0.0</p>
          <p>Last Updated: ${new Date().toLocaleDateString()}</p>
          <p>Port: ${port}</p>
        </div>
  
        <div class="qr-section">
          <p class="qr-label">Scan to access API endpoint:</p>
          <img src="${qrCodeUrl}" alt="API QR Code" />
          <p class="qr-url">${apiUrl}</p>
        </div>
      </div>
    </body>
  </html>`;
exports.getAPIHomePage = getAPIHomePage;
//# sourceMappingURL=html_responses.js.map