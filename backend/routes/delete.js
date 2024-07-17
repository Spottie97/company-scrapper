const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const router = express.Router();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let collection;

async function connectToMongoDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    collection = client.db("companyData").collection("companies");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToMongoDB();

router.delete('/delete', async (req, res) => {
  const { ids } = req.body;

  try {
    if (collection) {
      await collection.deleteMany({ id: { $in: ids } });
    }
    res.status(200).send("Deleted successfully");
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "Error deleting data" });
  }
});

module.exports = router;