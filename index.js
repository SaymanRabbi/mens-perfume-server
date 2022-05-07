const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
//middleware;
app.use(cors());
app.use(express.json());

function verifyidentity(req,res,next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
       return res.status(401).send({messages:"Unauthorized access"})
    }
    const authtoken = authHeader.split(' ')[1]

     jwt.verify(authtoken,process.env.TOKEN_SECRET,function(err, decoded) {
         if (err) {
            return res.status(403).send({messages:"Forbiden"})
         }
         req.decoded = decoded;
         next()
      })
    
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yx5wc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const productCollection = client.db('productsCollection').collection('product');
        app.post('/product', verifyidentity,async (req, res) => {
            const useremail = req.query.email
            const decodedEmail = req.decoded.emails;
            const data = req.body
            if (useremail === decodedEmail) {
                const result = await productCollection.insertOne(data)
                res.send(result)
            }
            else {
                res.status(403).send({messages:"You Not Verify Your Identity"})
            }
           
        })
        //my item
        app.get('/myitem', verifyidentity, async (req, res) => {
            const decodedEmail = req.decoded.emails;
            const email = req.query.result;
            if (email === decodedEmail) {
                const query = { email };
            const cursor = productCollection.find(query);
            const orders = await cursor.toArray()
            res.send(orders)
            }
            else {
                res.status(403).send({messages:"You Not Verify Your Identity"})
            }
        })
        app.get('/product', async (req, res) => {
            const query = {}
            const serchresult = req.query.location;
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            console.log(page,size);
            const cursor = productCollection.find(query)
            let result;
            if (page || size) {
                console.log('inside')
                result = await cursor.skip(page*size).limit(6).toArray()
            }
            else {
                 result = await cursor.limit(6).toArray()
            }
            res.send(result);
        })
        //singel product with id;
        app.get('/product/:id' ,async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productCollection.findOne(query)
            res.send(result);
        })
        //update product
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
        //delete product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productCollection.deleteOne(query);
            res.send(result)
        })
        //jwt token
        app.post('/token', async (req, res) => {
            const userEmail = req.body;
            const createToken = jwt.sign(userEmail, process.env.TOKEN_SECRET, {
                expiresIn:'1d'
            })
            res.send({createToken})
        })
        //product count
        app.get('/productcount', async (req, res) => {
            const query = {}
            const cursor = productCollection.find(query)
            const result = await productCollection.estimatedDocumentCount()
            res.send({result})
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