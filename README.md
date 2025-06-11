# MAHIS Offline Data Sync

## Setup Instructions

1. **Configure Environment Variables**

   - Copy `.env.example` to `.env`.
   - Edit the `.env` file with the following settings:

     ```
     API_BASE_URL=http://mahistest.health.gov.mw/api/v1/
     API_USERNAME=Kayeye
     API_PASSWORD=Kasongo@2025
     ```

   - **Note:** Make sure `API_USERNAME` is associated with the facility whose patient data should be pulled.
   - Ensure `API_BASE_URL` includes `/api/v1` at the end.

2. **Run the Application**

   ```
   npm run start:dev
   ```

3. **Generate SSL Certificates**

   - Follow the steps in `cert_generation_step.txt` for certificate generation.

4. **Install MongoDB**

   - MongoDB must be installed and running.
   - Refer to the official MongoDB installation guide:
     [MongoDB Manual Installation](https://www.mongodb.com/docs/manual/installation/)

5. **Install mkcert**

   - `mkcert` is required to generate local trusted certificates.
   - Installation guide:
     [mkcert GitHub Repository](https://github.com/FiloSottile/mkcert)

6. **Set Up SSL Certificates**

   ```
   ./setup_mods_ssl.sh
   ```

7. **Install Certificate on Android**

   - Go to:
     `Settings > Security > Encryption & credentials > Install a certificate > CA`
   - Select the file: `rootCA.pem`
