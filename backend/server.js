const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// PASTE YOUR SERVICE ACCOUNT JSON PATH HERE
const serviceAccount = require("./path-to-your-firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// THE LOGIC FUNCTION
app.post('/api/create-post', async (req, res) => {
  const { userId, content, userName } = req.body;

  try {
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const currentPoints = userDoc.exists ? (userDoc.data().totalPoints || 0) : 0;
      
      // Calculate Points
      const updatedPoints = currentPoints === 0 ? 7 : currentPoints + 2;

      // 1. Create Post
      const postRef = db.collection('posts').doc();
      t.set(postRef, {
        content,
        authorId: userId,
        authorName: userName,
        createdAt: admin.firestore.Timestamp.now(),
        likes: [],
        comments: []
      });

      // 2. Update User Points
      t.set(userRef, { totalPoints: updatedPoints }, { merge: true });
    });

    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));