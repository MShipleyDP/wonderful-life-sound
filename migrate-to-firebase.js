const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: "wonderful-life-sound",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

// For now, we'll use Application Default Credentials from Firebase CLI
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'wonderful-life-sound',
  storageBucket: 'wonderful-life-sound.firebasestorage.app',
  databaseURL: 'https://wonderful-life-sound-default-rtdb.firebaseio.com'
});

const bucket = admin.storage().bucket();
const db = admin.database();

// Sound categories metadata (extracted from HTML)
const categoriesMetadata = {
  "01_breaking_glass": {
    title: "Breaking Glass",
    directorRequest: "Breaking glass",
    description: "Multiple scenes with glass breaking"
  },
  "02_bell_angel_wings": {
    title: "Bell (Angel Wings) 🔔",
    directorRequest: "Bell (for every time a bell rings and angel gets his wings)",
    description: "KEY MOTIF - 'Every time a bell rings, an angel gets his wings'"
  },
  "03_train_whistle": {
    title: "Train Whistle",
    directorRequest: "Train whistle",
    description: "George's dreams of travel"
  },
  "04_fireworks": {
    title: "Fireworks",
    directorRequest: "Fireworks",
    description: "Celebration scenes"
  },
  "05_ice_cracking": {
    title: "Ice Cracking",
    directorRequest: "Ice cracking",
    description: "Harry falls through ice scene"
  },
  "06_1920s_music": {
    title: "1920s Music",
    directorRequest: "1920s music",
    description: "Period appropriate background"
  },
  "07_phone_ringing": {
    title: "Phone Ringing",
    directorRequest: "Phone ringing",
    description: "Multiple phone calls throughout"
  },
  "08_city_noises": {
    title: "City Noises",
    directorRequest: "City noises",
    description: "Bedford Falls ambience"
  },
  "09_piano_christmas_music": {
    title: "Piano Christmas Music",
    directorRequest: "Piano Christmas music",
    description: "Intermission, pre/post show - 52 tracks!"
  },
  "10_angelic_heavenly_sound": {
    title: "Angelic/Heavenly Sound",
    directorRequest: "Angelic/Heavenly sound",
    description: "Angel appearances, opening"
  },
  "11_car_taxi_sounds": {
    title: "Car/Taxi Sounds",
    directorRequest: "Car/taxi sounds",
    description: "Ernie's taxi scenes"
  },
  "12_1920s_police_sirens": {
    title: "1920s Police Sirens",
    directorRequest: "1920s police sirens",
    description: "Period appropriate sirens"
  },
  "13_crashing_garbage_cans": {
    title: "Crashing Garbage Cans",
    directorRequest: "Crashing garbage cans",
    description: "Dramatic moments"
  },
  "14_party_graduation_sounds": {
    title: "Party/Graduation Sounds",
    directorRequest: "Party/graduation sounds (Charleston party!)",
    description: "1920s graduation party with Charleston dance"
  },
  "15_wedding_march_cheers": {
    title: "Wedding March/Cheers",
    directorRequest: "Wedding march/cheers",
    description: "George & Mary's wedding"
  },
  "16_camera_snapping": {
    title: "Camera Snapping",
    directorRequest: "Camera snapping",
    description: "Photography moments"
  },
  "17_stars_and_stripes_forever": {
    title: "Stars & Stripes Forever",
    directorRequest: "Stars and Stripes Forever",
    description: "Patriotic music - Harry's war hero return"
  },
  "18_war_plane_sounds": {
    title: "War Plane Sounds",
    directorRequest: "War plane sounds",
    description: "WWII reference scenes"
  },
  "19_splashing_water": {
    title: "Splashing Water",
    directorRequest: "Splashing water",
    description: "Bridge/river scenes"
  },
  "20_italian_music_bar_sounds": {
    title: "Italian Music/Bar Sounds",
    directorRequest: "Italian music/bar sounds",
    description: "Martini's bar scenes - warm atmosphere"
  },
  "21_reality_shift_transition": {
    title: "Reality Shift/Transition",
    directorRequest: "Reality shift/transition",
    description: "George never born transition effect"
  },
  "22_jazzy_bar_music": {
    title: "Jazzy Bar Music",
    directorRequest: "Jazzy bar music",
    description: "Pottersville bar scenes - dark, noir atmosphere"
  },
  "23_drunken_city_sounds": {
    title: "Drunken City Sounds",
    directorRequest: "Drunken city sounds",
    description: "Dark Pottersville ambience - rough, chaotic"
  },
  "24_somber_cemetery_music": {
    title: "Somber Cemetery Music",
    directorRequest: "Somber cemetery music",
    description: "Cemetery scene mood"
  },
  "25_time_slowing_effect": {
    title: "Time Slowing Effect",
    directorRequest: "Time slowing effect",
    description: "Joseph slows time effect"
  }
};

async function uploadFile(localPath, storagePath) {
  console.log(`Uploading: ${localPath} -> ${storagePath}`);
  try {
    await bucket.upload(localPath, {
      destination: storagePath,
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
      }
    });

    // Make the file publicly accessible
    const file = bucket.file(storagePath);
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    console.log(`✅ Uploaded: ${path.basename(localPath)}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${localPath}:`, error.message);
    return null;
  }
}

async function migrateToFirebase() {
  console.log('🚀 Starting migration to Firebase...\n');

  const soundsData = {};
  let totalFiles = 0;
  let uploadedFiles = 0;

  // Get all category folders
  const folders = Object.keys(categoriesMetadata);

  for (const folder of folders) {
    console.log(`\n📁 Processing category: ${categoriesMetadata[folder].title}`);

    const folderPath = path.join(__dirname, folder);

    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️  Folder not found: ${folder}, skipping...`);
      continue;
    }

    // Get all MP3 files in the folder
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.mp3'))
      .sort();

    totalFiles += files.length;

    const uploadedFilesData = [];

    // Upload each file
    for (const file of files) {
      const localPath = path.join(folderPath, file);
      const storagePath = `sounds/${folder}/${file}`;

      const url = await uploadFile(localPath, storagePath);

      if (url) {
        uploadedFilesData.push({
          filename: file,
          url: url,
          path: storagePath
        });
        uploadedFiles++;
      }
    }

    // Store category data
    soundsData[folder] = {
      ...categoriesMetadata[folder],
      files: uploadedFilesData
    };
  }

  // Write to Firebase Realtime Database
  console.log('\n\n📝 Writing to Firebase Realtime Database...');
  try {
    await db.ref('sounds').set(soundsData);
    console.log('✅ Database updated successfully!');
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  }

  // Summary
  console.log('\n\n✨ Migration Complete! ✨');
  console.log(`📊 Total files: ${totalFiles}`);
  console.log(`✅ Successfully uploaded: ${uploadedFiles}`);
  console.log(`❌ Failed: ${totalFiles - uploadedFiles}`);

  console.log('\n🔗 Your Firebase URLs:');
  console.log(`   Database: https://console.firebase.google.com/project/wonderful-life-sound/database`);
  console.log(`   Storage: https://console.firebase.google.com/project/wonderful-life-sound/storage`);
}

// Run migration
migrateToFirebase()
  .then(() => {
    console.log('\n✅ Migration script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
