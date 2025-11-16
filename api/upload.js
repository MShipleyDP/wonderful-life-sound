const admin = require('firebase-admin');
const busboy = require('busboy');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.database();
const bucket = admin.storage().bucket();

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const bb = busboy({ headers: req.headers });
    let categoryKey = '';
    let customFilename = '';
    let fileBuffer = null;
    let fileContentType = '';
    let originalFilename = '';

    bb.on('field', (fieldname, val) => {
      if (fieldname === 'category') categoryKey = val;
      if (fieldname === 'customFilename') customFilename = val;
    });

    bb.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      originalFilename = filename;
      fileContentType = mimeType;

      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('finish', async () => {
      try {
        if (!categoryKey || !fileBuffer) {
          return res.status(400).json({ error: 'Missing category or file' });
        }

        const filename = customFilename || originalFilename;
        if (!filename.endsWith('.mp3')) {
          return res.status(400).json({ error: 'Only MP3 files allowed' });
        }

        const storagePath = `sounds/${categoryKey}/${filename}`;
        const file = bucket.file(storagePath);

        await file.save(fileBuffer, {
          contentType: fileContentType,
          metadata: {
            metadata: {
              firebaseStorageDownloadTokens: generateUUID()
            }
          }
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

        // Update database
        const categoryRef = db.ref(`sounds/${categoryKey}`);
        const snapshot = await categoryRef.once('value');
        const category = snapshot.val();

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }

        const files = category.files || [];
        files.push({
          filename: filename,
          url: publicUrl,
          path: storagePath
        });

        await categoryRef.update({
          files: files,
          fileCount: files.length
        });

        res.json({
          success: true,
          filename: filename,
          url: publicUrl,
          path: storagePath
        });

      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    req.pipe(bb);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
