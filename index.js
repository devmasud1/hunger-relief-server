const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()

const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aunb3y8.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db('hungerRelief').collection('foods');
    const foodRequestCollection = client.db('hungerRelief').collection('foodRequests');

    app.get('/api/v1/foods', async(req, res) => {
        const result = await foodCollection.find().toArray();
        res.send(result);
    })

    app.get('/api/v1/food/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await foodCollection.findOne(query);
      res.send(result);
    })


    //Food Request api
    app.post("/api/v1/food-request", async (req, res) => {
      const foodRequest = req.body;
      const result = await foodRequestCollection.insertOne(foodRequest);
      res.send(result);
    });

    app.get('/api/v1/food-request', async(req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { user_email: req.query.email};

        const options = {
          projection: { donar_name: 1, pickup_location: 1, expired_date: 1, request_date: 1, donation_money: 1 },
        };

        const result =await foodRequestCollection.find(query, options).toArray();
        res.send(result);
      }
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hunger-Relief is available here')
})

app.listen(port, () => {
  console.log(`Hunger-Relief listening on port ${port}`)
})
