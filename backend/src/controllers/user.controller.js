const { db } = require('../config/firebase');

// GET /api/user/:id — return user profile from Firestore
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = userDoc.data();
    res.json({
      id: userDoc.id,
      name: data.name || null,
      email: data.email || null,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
