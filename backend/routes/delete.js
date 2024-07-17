const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const router = express.Router();

const uri = process.env.MONGO_URI;

async function connectToMongoDB() {
  try {
    const client = new MongoClient(uri, {
      useUnifiedTopology: true,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    return client.db("companyData").collection("companies");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; // rethrow the error to prevent the app from continuing
  }
}

const collectionPromise = connectToMongoDB();

router.delete('/', async (req, res) => {
  const { ids } = req.body;

  try {
    const collection = await collectionPromise;
    await collection.deleteMany({ id: { $in: ids } });
    res.status(200).send("Deleted successfully");
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "Error deleting data" });
  }
});

module.exports = router;