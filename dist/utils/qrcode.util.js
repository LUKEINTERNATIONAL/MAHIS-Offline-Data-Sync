"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCodeDataURL = generateQRCodeDataURL;
const QRCode = require("qrcode");
async function generateQRCodeDataURL(data) {
    try {
        return await QRCode.toDataURL(data, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    }
    catch (err) {
        console.error('QR Code generation error:', err);
        return '';
    }
}
//# sourceMappingURL=qrcode.util.js.map