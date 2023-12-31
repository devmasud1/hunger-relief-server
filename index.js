const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      "https://hunger-relief0.web.app",
      "https://hunger-relief0.firebaseapp.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aunb3y8.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db("hungerRelief").collection("foods");
    const foodRequestCollection = client
      .db("hungerRelief")
      .collection("foodRequests");

    //jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "1h" });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    //jwt api end

    //foods api here
    app.get("/api/v1/foods", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });
    //foods api end

    //add food by user api
    app.post("/api/v1/food", async (req, res) => {
      const addFood = req.body;
      const result = await foodCollection.insertOne(addFood);
      res.send(result);
    });

    app.get("/api/v1/food", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { donator_email: req.query.email };

        const result = await foodCollection.find(query).toArray();
        res.send(result);
      }
    });

    app.delete("/api/v1/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/api/v1/food/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedFood = req.body;
      const updateDoc = {
        $set: {
          food_name: updatedFood.food_name,
          food_image: updatedFood.food_image,
          food_quantity: updatedFood.food_quantity,
          pickup_location: updatedFood.pickup_location,
          expired_date: updatedFood.expired_date,
          additional_notes: updatedFood.additional_notes,
          donar_name: updatedFood.donar_name,
          donator_email: updatedFood.donator_email,
          donator_image: updatedFood.donator_image,
          food_status: updatedFood.food_status,
        },
      };
      const result = await foodCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //add food by user api end

    //Food Request api start here
    app.post("/api/v1/food-request", async (req, res) => {
      const foodRequest = req.body;
      const result = await foodRequestCollection.insertOne(foodRequest);
      res.send(result);
    });

    app.get("/api/v1/food-request", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { user_email: req.query.email };

        const options = {
          projection: {
            donar_name: 1,
            donar_email: 1,
            pickup_location: 1,
            expired_date: 1,
            request_date: 1,
            donation_money: 1,
            status: 1,
          },
        };

        const result = await foodRequestCollection
          .find(query, options)
          .toArray();
        res.send(result);
      }
    });

    app.delete("/api/v1/food-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodRequestCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/api/v1/food-request/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedStatus = req.body;
      const updateDoc = {
        $set: {
          status: updatedStatus.status,
        },
      };
      const result = await foodRequestCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //Food Request api close

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hunger-Relief is available here");
});

app.listen(port, () => {
  console.log(`Hunger-Relief listening on port ${port}`);
});
