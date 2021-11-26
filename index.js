const express = require('express');
const { MongoClient } = require('mongodb'); // mongodb data
require('dotenv').config(); // for secure env data
const cors = require('cors');  // For cors blocking
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
const { json } = require('express');

const app = express();
app.use(cors())      // For cors blocking
app.use(express.json());

const port = process.env.PORT || 5000;

//Make admin from firebase service account
const serviceAccount =  JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ezvo3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect();
        const database = client.db("time_travel");
        const watchCollection = database.collection("watches");
        const orderCollection = database.collection("myOrders");
        const usersCollection = database.collection("users");
        const reviewsCollection = database.collection("reviews");

        // GET watches from server
        app.get("/watches", async(req,res) => {
            const cursor = watchCollection.find({});
            const services = await cursor.toArray();
            res.send(services) ; 
            });

        // POST watches to server
        app.post("/watches", async(req, res) => {
            const watch = req.body; 
            const result = await watchCollection.insertOne(watch);
        res.json(result)
        });

        // Add Orders to myOrders
        app.post('/orders', async(req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.json(result);
            })

        // Get MyOrders from server
        app.get("/myOrders", async (req, res) => {
            if(req.query.email){
            const email = req.query.email;
            const query = {email: email}
            const cursor = orderCollection.find(query);
            const myOrders = await cursor.toArray();
            res.json(myOrders)
            }
            else{
                const cursor = orderCollection.find({});
                const myOrders = await cursor.toArray();
                res.json(myOrders) 
            }
            
        })


        // GET reviews from server
        app.get("/reviews", async(req,res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews) ; 
            });
        // Add reviews to reviews
        app.post('/reviews', async(req, res) => {
            const order = req.body
            const result = await reviewsCollection.insertOne(order)
            res.json(result);
            })

        // Add Users to DB
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })

        // DELETE a Order
        app.delete("/myOrders/:id", async(req,res) => {
        const id = req.params.id;
        const query = {order: id}  
        const result = await orderCollection.deleteOne(query);  
        res.json(result);
        })

        // DELETE a Product
        app.delete("/watches/:id", async(req,res) => {
        const id = req.params.id;
        const query = {id: id}  
        const result = await watchCollection.deleteOne(query);  
        res.json(result);
        })

        // Update user for google sign in
        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = {email: user.email};
            const options = { upsert: true};
            const updateDoc = {$set: user};
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        // make Admin
        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const filter = {email: user.email};
            const updateDoc = {$set: {role:'admin'}};
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
           
            
        })

        // Filter admin from DB
        app.get("/users/:email", async (req, res) =>{
            const email = req.params.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if(user?.role === 'admin'){
                isAdmin = true;
            }
            res.json({admin: isAdmin});
        }) 
        
        // Update status for orders
        app.put("/myOrders/:id", async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {$set: {status:'Shipped'}};
            const result = await orderCollection.updateOne(filter, updateDoc,options);
            res.json(result);
        })
    }
    finally{
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send("Running the Time-Travel portal server")
});

app.listen(port, () => {
    console.log("Server Running on", port);
})