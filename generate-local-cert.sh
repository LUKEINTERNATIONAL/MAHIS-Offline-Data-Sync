#!/bin/bash

# === Config ===
CA_DIR="$HOME/myCA"
DOMAIN="192.168.76.148"
DAYS_VALID=825
CERT_DIR="./ssl"

# === Create folders ===
mkdir -p "$CA_DIR"/{certs,newcerts,private}
mkdir -p "$CERT_DIR"
touch "$CA_DIR/index.txt"
echo 1000 > "$CA_DIR/serial"

echo "🔐 Generating CA private key..."
openssl genrsa -out "$CA_DIR/private/ca.key.pem" 4096

echo "📜 Creating CA root certificate..."
openssl req -x509 -new -nodes -key "$CA_DIR/private/ca.key.pem" \
  -sha256 -days 3650 -out "$CA_DIR/certs/ca.cert.pem" -subj "/CN=My Local Dev CA"

echo "🔐 Creating server private key..."
openssl genrsa -out "$CERT_DIR/server.key.pem" 2048

echo "📜 Creating server CSR..."
openssl req -new -key "$CERT_DIR/server.key.pem" \
  -out "$CERT_DIR/server.csr.pem" -subj "/CN=$DOMAIN"

echo "🧾 Creating SAN config..."
cat > "$CERT_DIR/san.cnf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = $DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $DOMAIN
EOF

echo "🔏 Signing the server certificate with the CA..."
openssl x509 -req -in "$CERT_DIR/server.csr.pem" \
  -CA "$CA_DIR/certs/ca.cert.pem" -CAkey "$CA_DIR/private/ca.key.pem" \
  -CAcreateserial -out "$CERT_DIR/server.cert.pem" \
  -days $DAYS_VALID -sha256 -extfile "$CERT_DIR/san.cnf" -extensions v3_req

echo "✅ Certificates generated in '$CERT_DIR'"

# === Optional: Trust the CA (Linux/macOS only) ===
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "🔐 Adding CA to macOS system trust store..."
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CA_DIR/certs/ca.cert.pem"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "🔐 Adding CA to Linux trust store..."
  sudo cp "$CA_DIR/certs/ca.cert.pem" /usr/local/share/ca-certificates/myCA.crt
  sudo update-ca-certificates
else
  echo "⚠️ Automatic CA trust not supported for your OS ($OSTYPE). Please install '$CA_DIR/certs/ca.cert.pem' manually."
fi

