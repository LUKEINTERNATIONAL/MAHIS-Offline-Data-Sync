#!/bin/bash

# ---- SETTINGS ----
DEVICE_IP="192.168.0.105"  # <- Replace with your device's actual IP
CERT_DIR="./certs"

# ---- Step 1: Check if mkcert is installed ----
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert not found. Please install mkcert before running this script."
    exit 1
fi

# ---- Step 2: Install mkcert CA ----
echo "✅ Installing mkcert local CA..."
mkcert -install

# ---- Step 3: Create certs directory before generating ----
echo "✅ Creating certs directory at $CERT_DIR..."
mkdir -p "$CERT_DIR"

# ---- Step 4: Generate certificates ----
echo "✅ Generating certs for $DEVICE_IP, localhost, and 127.0.0.1..."
mkcert "$DEVICE_IP" localhost 127.0.0.1

CERT_FILE="$DEVICE_IP+2.pem"
KEY_FILE="$DEVICE_IP+2-key.pem"

if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]]; then
    echo "❌ Certificate generation failed or files not found."
    exit 1
fi

# ---- Step 5: Replace and rename certs ----
echo "✅ Moving certs to $CERT_DIR..."
mv "$CERT_FILE" "$CERT_DIR/cert.pem"
mv "$KEY_FILE" "$CERT_DIR/key.pem"

# ---- Step 6: Show mkcert root CA directory ----
CAROOT=$(mkcert -CAROOT)
echo "👉 Your rootCA.pem is located at: $CAROOT/rootCA.pem"

# ---- Step 7: Reminder for Android CA import ----
echo ""
echo "🚀 Next Step:"
echo "Copy the file below to your Android device and install it as a trusted CA:"
echo "$CAROOT/rootCA.pem"
echo ""
echo "📱 On Android: Settings > Security > Encryption & credentials > Install a certificate > CA"
