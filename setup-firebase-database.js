const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const FIREBASE_TOKEN = process.env.FIREBASE_TOKEN;
const DATABASE_URL = 'https://wonderful-life-sound-default-rtdb.firebaseio.com';
const GITHUB_PAGES_URL = 'https://mshipleydp.github.io/wonderful-life-sound';

// Sound categories metadata
const categoriesMetadata = {
  "01_breaking_glass": {
    title: "Breaking Glass",
    directorRequest: "Breaking glass",
    description: "Multiple scenes with glass breaking",
    order: 1
  },
  "02_bell_angel_wings": {
    title: "Bell (Angel Wings)",
    directorRequest: "Bell (for every time a bell rings and angel gets his wings)",
    description: "KEY MOTIF - 'Every time a bell rings, an angel gets his wings'",
    order: 2
  },
  "03_train_whistle": {
    title: "Train Whistle",
    directorRequest: "Train whistle",
    description: "George's dreams of travel",
    order: 3
  },
  "04_fireworks": {
    title: "Fireworks",
    directorRequest: "Fireworks",
    description: "Celebration scenes",
    order: 4
  },
  "05_ice_cracking": {
    title: "Ice Cracking",
    directorRequest: "Ice cracking",
    description: "Harry falls through ice scene",
    order: 5
  },
  "06_1920s_music": {
    title: "1920s Music",
    directorRequest: "1920s music",
    description: "Period appropriate background",
    order: 6
  },
  "07_phone_ringing": {
    title: "Phone Ringing",
    directorRequest: "Phone ringing",
    description: "Multiple phone calls throughout",
    order: 7
  },
  "08_city_noises": {
    title: "City Noises",
    directorRequest: "City noises",
    description: "Bedford Falls ambience",
    order: 8
  },
  "09_piano_christmas_music": {
    title: "Piano Christmas Music",
    directorRequest: "Piano Christmas music",
    description: "Intermission, pre/post show - 52 tracks!",
    order: 9
  },
  "10_angelic_heavenly_sound": {
    title: "Angelic/Heavenly Sound",
    directorRequest: "Angelic/Heavenly sound",
    description: "Angel appearances, opening",
    order: 10
  },
  "11_car_taxi_sounds": {
    title: "Car/Taxi Sounds",
    directorRequest: "Car/taxi sounds",
    description: "Ernie's taxi scenes",
    order: 11
  },
  "12_1920s_police_sirens": {
    title: "1920s Police Sirens",
    directorRequest: "1920s police sirens",
    description: "Period appropriate sirens",
    order: 12
  },
  "13_crashing_garbage_cans": {
    title: "Crashing Garbage Cans",
    directorRequest: "Crashing garbage cans",
    description: "Dramatic moments",
    order: 13
  },
  "14_party_graduation_sounds": {
    title: "Party/Graduation Sounds",
    directorRequest: "Party/graduation sounds (Charleston party!)",
    description: "1920s graduation party with Charleston dance",
    order: 14
  },
  "15_wedding_march_cheers": {
    title: "Wedding March/Cheers",
    directorRequest: "Wedding march/cheers",
    description: "George & Mary's wedding",
    order: 15
  },
  "16_camera_snapping": {
    title: "Camera Snapping",
    directorRequest: "Camera snapping",
    description: "Photography moments",
    order: 16
  },
  "17_stars_and_stripes_forever": {
    title: "Stars & Stripes Forever",
    directorRequest: "Stars and Stripes Forever",
    description: "Patriotic music - Harry's war hero return",
    order: 17
  },
  "18_war_plane_sounds": {
    title: "War Plane Sounds",
    directorRequest: "War plane sounds",
    description: "WWII reference scenes",
    order: 18
  },
  "19_splashing_water": {
    title: "Splashing Water",
    directorRequest: "Splashing water",
    description: "Bridge/river scenes",
    order: 19
  },
  "20_italian_music_bar_sounds": {
    title: "Italian Music/Bar Sounds",
    directorRequest: "Italian music/bar sounds",
    description: "Martini's bar scenes - warm atmosphere",
    order: 20
  },
  "21_reality_shift_transition": {
    title: "Reality Shift/Transition",
    directorRequest: "Reality shift/transition",
    description: "George never born transition effect",
    order: 21
  },
  "22_jazzy_bar_music": {
    title: "Jazzy Bar Music",
    directorRequest: "Jazzy bar music",
    description: "Pottersville bar scenes - dark, noir atmosphere",
    order: 22
  },
  "23_drunken_city_sounds": {
    title: "Drunken City Sounds",
    directorRequest: "Drunken city sounds",
    description: "Dark Pottersville ambience - rough, chaotic",
    order: 23
  },
  "24_somber_cemetery_music": {
    title: "Somber Cemetery Music",
    directorRequest: "Somber cemetery music",
    description: "Cemetery scene mood",
    order: 24
  },
  "25_time_slowing_effect": {
    title: "Time Slowing Effect",
    directorRequest: "Time slowing effect",
    description: "Joseph slows time effect",
    order: 25
  }
};

// Update Firebase Realtime Database using REST API
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

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Database update failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function setupDatabase() {
  console.log('🚀 Setting up Firebase Realtime Database...\n');

  if (!FIREBASE_TOKEN) {
    console.error('❌ FIREBASE_TOKEN environment variable not set!');
    process.exit(1);
  }

  const soundsData = {};

  // Get all category folders
  const folders = Object.keys(categoriesMetadata);

  for (const folder of folders) {
    console.log(`📁 Processing category: ${categoriesMetadata[folder].title}`);

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

    const filesData = files.map(file => ({
      filename: file,
      url: `${GITHUB_PAGES_URL}/${folder}/${file}`,
      path: `${folder}/${file}`
    }));

    // Store category data
    soundsData[folder] = {
      ...categoriesMetadata[folder],
      files: filesData,
      fileCount: filesData.length
    };

    console.log(`✅ Added ${filesData.length} files`);
  }

  // Write to Firebase Realtime Database
  console.log('\n📝 Writing sound metadata to Firebase...');
  try {
    await updateDatabase('/sounds', soundsData);
    console.log('✅ Database updated successfully!');
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    process.exit(1);
  }

  // Set up database rules
  console.log('\n🔒 Setting up database security rules...');
  const rules = {
    rules: {
      sounds: {
        ".read": true,
        ".write": false  // Only admin can write via Firebase console
      },
      selections: {
        ".read": true,
        ".write": true  // Anyone can save their selections
      }
    }
  };

  try {
    await updateDatabase('/.settings/rules', rules);
    console.log('✅ Security rules configured!');
  } catch (error) {
    console.log('Warning: Could not set rules via API (set them manually in Firebase console)');
  }

  // Summary
  const totalCategories = Object.keys(soundsData).length;
  const totalFiles = Object.values(soundsData).reduce((sum, cat) => sum + cat.fileCount, 0);

  console.log('\n✨ Setup Complete! ✨');
  console.log(`📊 Total categories: ${totalCategories}`);
  console.log(`📊 Total files: ${totalFiles}`);

  console.log('\n🔗 Firebase Database:');
  console.log(`   ${DATABASE_URL}`);
  console.log('\n🔗 GitHub Pages:');
  console.log(`   ${GITHUB_PAGES_URL}`);
}

// Run setup
setupDatabase()
  .then(() => {
    console.log('\n✅ Setup script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
