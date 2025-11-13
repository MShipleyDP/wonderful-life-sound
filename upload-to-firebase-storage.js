#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const FIREBASE_TOKEN = process.env.FIREBASE_TOKEN;
const PROJECT_ID = 'wonderful-life-sound';
const BUCKET = `${PROJECT_ID}.appspot.com`;
const DATABASE_URL = 'https://wonderful-life-sound-default-rtdb.firebaseio.com';

// Sound categories (same as setup script)
const categoriesMetadata = {
  "01_breaking_glass": { title: "Breaking Glass", order: 1 },
  "02_bell_angel_wings": { title: "Bell (Angel Wings)", order: 2 },
  "03_train_whistle": { title: "Train Whistle", order: 3 },
  "04_fireworks": { title: "Fireworks", order: 4 },
  "05_ice_cracking": { title: "Ice Cracking", order: 5 },
  "06_1920s_music": { title: "1920s Music", order: 6 },
  "07_phone_ringing": { title: "Phone Ringing", order: 7 },
  "08_city_noises": { title: "City Noises", order: 8 },
  "09_piano_christmas_music": { title: "Piano Christmas Music", order: 9 },
  "10_angelic_heavenly_sound": { title: "Angelic/Heavenly Sound", order: 10 },
  "11_car_taxi_sounds": { title: "Car/Taxi Sounds", order: 11 },
  "12_1920s_police_sirens": { title: "1920s Police Sirens", order: 12 },
  "13_crashing_garbage_cans": { title: "Crashing Garbage Cans", order: 13 },
  "14_party_graduation_sounds": { title: "Party/Graduation Sounds", order: 14 },
  "15_wedding_march_cheers": { title: "Wedding March/Cheers", order: 15 },
  "16_camera_snapping": { title: "Camera Snapping", order: 16 },
  "17_stars_and_stripes_forever": { title: "Stars & Stripes Forever", order: 17 },
  "18_war_plane_sounds": { title: "War Plane Sounds", order: 18 },
  "19_splashing_water": { title: "Splashing Water", order: 19 },
  "20_italian_music_bar_sounds": { title: "Italian Music/Bar Sounds", order: 20 },
  "21_reality_shift_transition": { title: "Reality Shift/Transition", order: 21 },
  "22_jazzy_bar_music": { title: "Jazzy Bar Music", order: 22 },
  "23_drunken_city_sounds": { title: "Drunken City Sounds", order: 23 },
  "24_somber_cemetery_music": { title: "Somber Cemetery Music", order: 24 },
  "25_time_slowing_effect": { title: "Time Slowing Effect", order: 25 }
};

// Upload file to Firebase Storage using REST API
async function uploadFile(localPath, storagePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(localPath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?name=${encodeURIComponent(storagePath)}`;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIREBASE_TOKEN}`,
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileContent.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(responseData);
          // Get public URL
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media`;
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(fileContent);
    req.end();
  });
}

// Update Firebase Realtime Database
async function updateDatabase(path, data) {
  return new Promise((resolve, reject) => {
    const url = `${DATABASE_URL}${path}.json?auth=${FIREBASE_TOKEN}`;
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Database update failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => { reject(error); });
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Uploading MP3 files to Firebase Storage...\\n');

  if (!FIREBASE_TOKEN) {
    console.error('❌ FIREBASE_TOKEN environment variable not set!');
    process.exit(1);
  }

  const soundsData = {};
  const folders = Object.keys(categoriesMetadata);
  let totalUploaded = 0;

  for (const folder of folders) {
    console.log(`\\n📁 Processing category: ${categoriesMetadata[folder].title}`);
    const folderPath = path.join(__dirname, folder);

    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️  Folder not found: ${folder}, skipping...`);
      continue;
    }

    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.mp3'))
      .sort();

    console.log(`   Found ${files.length} MP3 files`);

    const filesData = [];

    for (const file of files) {
      const localPath = path.join(folderPath, file);
      const storagePath = `sounds/${folder}/${file}`;

      try {
        console.log(`   ⬆️  Uploading: ${file}...`);
        const url = await uploadFile(localPath, storagePath);

        filesData.push({
          filename: file,
          url: url,
          path: storagePath
        });

        totalUploaded++;
        console.log(`   ✅ Uploaded: ${file}`);
      } catch (error) {
        console.error(`   ❌ Failed to upload ${file}:`, error.message);
      }
    }

    // Store category data
    soundsData[folder] = {
      ...categoriesMetadata[folder],
      files: filesData,
      fileCount: filesData.length
    };

    console.log(`✅ Completed ${folder}: ${filesData.length} files uploaded`);
  }

  // Update database with new Firebase Storage URLs
  console.log('\\n📝 Updating Firebase Database with new URLs...');
  try {
    await updateDatabase('/sounds', soundsData);
    console.log('✅ Database updated successfully!');
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    process.exit(1);
  }

  console.log('\\n✨ Upload Complete! ✨');
  console.log(`📊 Total files uploaded: ${totalUploaded}`);
  console.log(`📊 Total categories: ${Object.keys(soundsData).length}`);
  console.log('\\n🔗 Firebase Storage Console:');
  console.log(`   https://console.firebase.google.com/project/${PROJECT_ID}/storage`);
}

main()
  .then(() => {
    console.log('\\n✅ Script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\\n❌ Script failed:', error);
    process.exit(1);
  });
