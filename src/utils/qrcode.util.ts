import * as QRCode from 'qrcode';

/**
 * Generate a QR code as a data URL
 * @param data The text/URL to encode in the QR code
 * @returns Promise resolving to data URL string
 */
export async function generateQRCodeDataURL(data: string): Promise<string> {
  try {
    // Generate QR code as data URL (base64)
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',  // Black dots
        light: '#ffffff'  // White background
      }
    });
  } catch (err) {
    console.error('QR Code generation error:', err);
    return '';
  }
}