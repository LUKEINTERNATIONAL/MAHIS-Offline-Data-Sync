# MAHIS-Offline-Data-Sync
Copy and edit .env.example to .env and place in the below settings (make use API_USERNAME is associated with the facility, to be pulling patients for that facility)

The settings in .env 

Make usre the base_url cotainns /api/v1

API_BASE_URL=http://mahistest.health.gov.mw/api/v1/
API_USERNAME=Kayeye
API_PASSWORD=Kasongo@2025


Run the app via: 

npm run start:dev


for cert generation refer to cert_genaration_step.txt

Make sure you install mongo and is running

Follow the mongo setup via https://www.mongodb.com/docs/manual/installation/
