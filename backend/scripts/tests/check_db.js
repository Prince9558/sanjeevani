const { MongoClient } = require('mongodb');
const fs = require('fs');

async function run() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);
  let out = "";

  try {
    await client.connect();
    out += "Connected directly using MongoClient\n";

    const db = client.db("foodvalue");
    const collections = await db.listCollections().toArray();
    out += "Collections in foodvalue: " + collections.map(c => c.name).join(", ") + "\n";

    for (const name of ["unreserveditems", "reserveditems", "collecteditems", "foods", "users"]) {
      const col = db.collection(name);
      const count = await col.countDocuments();
      out += `Collection '${name}' has ${count} documents.\n`;
    }

  } finally {
    await client.close();
    fs.writeFileSync("db_out.txt", out);
  }
}

run().catch(console.dir);
