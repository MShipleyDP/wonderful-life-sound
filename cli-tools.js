#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Sound categories metadata (must match index.html)
const CATEGORIES = {
  "01_breaking_glass": "Breaking Glass",
  "02_bell_angel_wings": "Bell (Angel Wings) 🔔",
  "03_train_whistle": "Train Whistle",
  "04_fireworks": "Fireworks",
  "05_ice_cracking": "Ice Cracking",
  "06_1920s_music": "1920s Music",
  "07_phone_ringing": "Phone Ringing",
  "08_city_noises": "City Noises",
  "09_piano_christmas_music": "Piano Christmas Music",
  "10_angelic_heavenly_sound": "Angelic/Heavenly Sound",
  "11_car_taxi_sounds": "Car/Taxi Sounds",
  "12_1920s_police_sirens": "1920s Police Sirens",
  "13_crashing_garbage_cans": "Crashing Garbage Cans",
  "14_party_graduation_sounds": "Party/Graduation Sounds",
  "15_wedding_march_cheers": "Wedding March/Cheers",
  "16_camera_snapping": "Camera Snapping",
  "17_stars_and_stripes_forever": "Stars & Stripes Forever",
  "18_war_plane_sounds": "War Plane Sounds",
  "19_splashing_water": "Splashing Water",
  "20_italian_music_bar_sounds": "Italian Music/Bar Sounds",
  "21_reality_shift_transition": "Reality Shift/Transition",
  "22_jazzy_bar_music": "Jazzy Bar Music",
  "23_drunken_city_sounds": "Drunken City Sounds",
  "24_somber_cemetery_music": "Somber Cemetery Music",
  "25_time_slowing_effect": "Time Slowing Effect"
};

const GITHUB_PAGES_URL = 'https://mshipleydp.github.io/wonderful-life-sound';

// Command functions
function listSounds(category) {
  console.log('\n🎵 Sound Library\n');

  if (category) {
    // List specific category
    if (!CATEGORIES[category]) {
      console.error(`❌ Invalid category: ${category}`);
      console.log('\nAvailable categories:');
      Object.keys(CATEGORIES).forEach(key => {
        console.log(`  - ${key}: ${CATEGORIES[key]}`);
      });
      process.exit(1);
    }

    const folderPath = path.join(__dirname, category);
    if (!fs.existsSync(folderPath)) {
      console.log(`📁 ${CATEGORIES[category]}: No files yet`);
      return;
    }

    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.mp3'))
      .sort();

    console.log(`📁 ${CATEGORIES[category]} (${files.length} files)`);
    files.forEach(file => {
      const stats = fs.statSync(path.join(folderPath, file));
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   - ${file} (${sizeMB} MB)`);
    });
  } else {
    // List all categories
    Object.keys(CATEGORIES).forEach(key => {
      const folderPath = path.join(__dirname, key);
      if (!fs.existsSync(folderPath)) {
        console.log(`📁 ${key}: ${CATEGORIES[key]} (0 files)`);
        return;
      }

      const files = fs.readdirSync(folderPath)
        .filter(f => f.endsWith('.mp3'))
        .sort();

      console.log(`📁 ${key}: ${CATEGORIES[key]} (${files.length} files)`);
    });
  }

  console.log('');
}

function addSound(category, filename) {
  console.log(`\n➕ Adding sound: ${filename} to ${category}\n`);

  // Validate category
  if (!CATEGORIES[category]) {
    console.error(`❌ Invalid category: ${category}`);
    console.log('\nAvailable categories:');
    Object.keys(CATEGORIES).forEach(key => {
      console.log(`  - ${key}: ${CATEGORIES[key]}`);
    });
    process.exit(1);
  }

  // Validate file exists
  const sourcePath = path.join(__dirname, filename);
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ File not found: ${filename}`);
    console.log('\nMake sure the MP3 file is in the current directory.');
    process.exit(1);
  }

  // Validate it's an MP3
  if (!filename.endsWith('.mp3')) {
    console.error(`❌ File must be an MP3: ${filename}`);
    process.exit(1);
  }

  // Create category folder if it doesn't exist
  const categoryPath = path.join(__dirname, category);
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath);
    console.log(`✅ Created category folder: ${category}`);
  }

  // Copy file to category folder
  const destPath = path.join(categoryPath, filename);
  if (fs.existsSync(destPath)) {
    console.error(`❌ File already exists in category: ${filename}`);
    process.exit(1);
  }

  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Added ${filename} to ${CATEGORIES[category]}`);

  // Show next steps
  console.log('\n📝 Next steps:');
  console.log('1. Test the sound in your browser (refresh index.html)');
  console.log('2. When ready, run: node cli-tools.js sync-to-github "Add new sound"');
  console.log('');
}

function removeSound(category, filename) {
  console.log(`\n➖ Removing sound: ${filename} from ${category}\n`);

  // Validate category
  if (!CATEGORIES[category]) {
    console.error(`❌ Invalid category: ${category}`);
    process.exit(1);
  }

  // Check if file exists
  const filePath = path.join(__dirname, category, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${category}/${filename}`);
    process.exit(1);
  }

  // Remove file
  fs.unlinkSync(filePath);
  console.log(`✅ Removed ${filename} from ${CATEGORIES[category]}`);

  // Show next steps
  console.log('\n📝 Next steps:');
  console.log('1. When ready, run: node cli-tools.js sync-to-github "Remove sound"');
  console.log('');
}

function syncToGitHub(commitMessage) {
  console.log('\n🔄 Syncing to GitHub...\n');

  try {
    // Check if there are changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (!status.trim()) {
      console.log('✅ No changes to sync');
      return;
    }

    console.log('📝 Changes detected:');
    console.log(status);

    // Check current branch
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`🌿 Current branch: ${branch}`);

    if (branch === 'development') {
      console.log('\n⚠️  Warning: You are on the development branch.');
      console.log('Best practice: Create a feature branch for changes.');
      console.log('\nTo create a feature branch:');
      console.log('  git checkout -b feature/add-sounds');
      console.log('\nContinuing with development branch...\n');
    }

    // Add all changes
    execSync('git add .');
    console.log('✅ Staged changes');

    // Commit
    const message = commitMessage || 'Update sound files';
    execSync(`git commit -m "${message}"`, { encoding: 'utf8', stdio: 'inherit' });
    console.log('✅ Committed changes');

    // Push
    execSync(`git push -u origin ${branch}`, { encoding: 'utf8', stdio: 'inherit' });
    console.log('✅ Pushed to GitHub');

    console.log('\n🎉 Sync complete! Changes will be live in a few minutes.');
    console.log(`   ${GITHUB_PAGES_URL}\n`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.log('\nYou can manually sync with:');
    console.log('  git add .');
    console.log('  git commit -m "Update sounds"');
    console.log('  git push');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🎭 Wonderful Life Sound Manager - CLI Tools

Usage:
  node cli-tools.js <command> [arguments]

Commands:
  list [category]                  List all sounds or sounds in a category
  add-sound <category> <file.mp3>  Add a new sound to a category
  remove-sound <category> <file>   Remove a sound from a category
  sync-to-github [message]         Commit and push changes to GitHub
  help                             Show this help message

Examples:
  node cli-tools.js list
  node cli-tools.js list 02_bell_angel_wings
  node cli-tools.js add-sound 02_bell_angel_wings new_bell.mp3
  node cli-tools.js remove-sound 02_bell_angel_wings old_bell.mp3
  node cli-tools.js sync-to-github "Add new bell sounds"

Categories:
${Object.keys(CATEGORIES).map(key => `  ${key}: ${CATEGORIES[key]}`).join('\n')}
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    listSounds(args[1]);
    break;

  case 'add-sound':
    if (args.length < 3) {
      console.error('❌ Usage: node cli-tools.js add-sound <category> <file.mp3>');
      process.exit(1);
    }
    addSound(args[1], args[2]);
    break;

  case 'remove-sound':
    if (args.length < 3) {
      console.error('❌ Usage: node cli-tools.js remove-sound <category> <file>');
      process.exit(1);
    }
    removeSound(args[1], args[2]);
    break;

  case 'sync-to-github':
    syncToGitHub(args[1]);
    break;

  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  default:
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
