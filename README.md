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
   npm run dev
   ```

3. **Generate SSL Certificates**

   - Follow the steps in `cert_generation_step.txt` for certificate generation.

4. **Install MongoDB (Optional)**

   > **Disclaimer:**  
   > MongoDB is only required if you want to use it as your database.  
   > By default, the app will run on its own using SQLite.

   - MongoDB must be installed and running if you choose to use it.
   - Refer to the official MongoDB installation guide:  
     [MongoDB Manual Installation](https://www.mongodb.com/docs/manual/installation/)

5. **Set Up MongoDB as a Replica Set (Required for Prisma with MongoDB)**

   If you want to use MongoDB, Prisma requires it to run as a replica set for transactions and advanced features:

   a. **Stop any existing MongoDB process (if running):**
   ```bash
   sudo systemctl stop mongod
   # Or if started manually, press Ctrl+C
   ```

   b. **Start MongoDB as a replica set:**
   ```bash
   mongod --replSet rs0 --dbpath /data/db --port 27017
   ```
   Ensure `/data/db` exists and is writable.

   c. **In a new terminal, initialize the replica set:**
   ```bash
   mongo --port 27017
   > rs.initiate()
   ```

   d. **Verify the replica set status:**
   ```bash
   > rs.status()
   ```

6. **Install mkcert**

   - `mkcert` is required to generate local trusted certificates.
   - Installation guide:  
     [mkcert GitHub Repository](https://github.com/FiloSottile/mkcert)

7. **Set Up SSL Certificates**

   ```
   ./setup_mods_ssl.sh
   ```

8. **Install Certificate on Android**

   - Go to:  
     `Settings > Security > Encryption & credentials > Install a certificate > CA`
   - Select the file: `rootCA.pem`
