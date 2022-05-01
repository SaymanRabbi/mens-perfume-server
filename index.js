const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
//middleware;
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yx5wc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const productCollection = client.db('productsCollection').collection('product');
        app.get('/product', async (req, res) => {
            const query = {}
            const cursor = productCollection.find(query)
            const result = await cursor.toArray()
            res.send(result);
        })
        //singel product with id;
        app.get('/product/:id' ,async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productCollection.findOne(query)
            res.send(result);
        })
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const data = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: data.quantity
                },
            };
            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result)
            
        })
        
    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})