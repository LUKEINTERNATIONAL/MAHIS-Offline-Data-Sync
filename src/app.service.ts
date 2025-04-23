// app.service.ts
import { Injectable } from '@nestjs/common';
import { PayloadDto } from './app.controller';

@Injectable()
export class AppService {
  getHello(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MAHIS Offline Data Sync API</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #333;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #7f8c8d;
            margin-bottom: 25px;
        }
        .api-info {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin-top: 20px;
            text-align: left;
        }
        .api-info h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .endpoint {
            font-family: monospace;
            background-color: #e9ecef;
            padding: 8px 12px;
            border-radius: 4px;
            margin: 5px 0;
            display: inline-block;
        }
        .status {
            display: inline-block;
            background-color: #28a745;
            color: white;
            border-radius: 30px;
            padding: 8px 16px;
            font-weight: bold;
            margin-bottom: 25px;
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
            <p><span class="endpoint">POST /receive-payload</span> - Submit data for synchronization</p>
            
            <h3>Server Information:</h3>
            <p>Environment: ${process.env.NODE_ENV || 'Development'}</p>
            <p>Version: 1.0.0</p>
            <p>Last Updated: ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  processPayload(payload: PayloadDto) {
    // Process the payload here
    // This is where you would add your business logic
    
    return {
      success: true,
      message: 'Payload received successfully',
      receivedData: payload,
      timestamp: new Date().toISOString()
    };
  }
}