const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT ||5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q36fl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
  console.log('abc')
  const authHeader =req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'Unauthorized access'})
  }
  
}


 async function run(){
     try{
        await client.connect();
        console.log('database connected ');
        const toolsCollection = client.db('bycle').collection('tools');
        const bookingCollection = client.db('bycle').collection('bookings');
        const reviewCollection = client.db('bycle').collection('review');
        const userCollection = client.db('bycle').collection('users');
        app.get('/tools',async(req,res)=>{
           const query ='';
           const cursor =toolsCollection.find(query);
           const  tools =await cursor.toArray();
           res.send(tools);
           //
        })

        app.put('/user/:email',async(req,res)=>{
          const email =req.params.email;
          const user =req.body;
          const filter = {email:email};
          const options ={upsert:true};
          const updateDoc = {
            $set: user,
          };
          const result = await userCollection.updateOne(filter,updateDoc,options);
          const token = jwt.sign({email : email},process.env.ACCESS_TOKEN_SECRET, {expiresIn :'1h'})
          res.send({result, token});

        })

        app.post('/booking',async(req,res)=>{
            const booking =req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);

        })

        app.post('/review',async(req,res)=>{
          const review =req.body;
          const result =await reviewCollection.insertOne(review);
          res.send(result);
        })

        app.get('/review',async(req,res)=>{
          const query ='';
          const review = await reviewCollection.find(query);
          const  result = await review.toArray();
          res.send(result);
        })

        
      //   app.get('/booking',async(req,res)=>{
      //     const query ='';
      //     const tolo =bookingCollection.find(query);
      //     const result =await tolo.toArray();
      //     res.send(result);

      //   })

      //   app.get('/booking/:id',async(req,res)=>{
      //     const id=req.params.id;
      //     const query ={_id:ObjectID(id)}
      //     const result =await bookingCollection.findOne(query);
      //     res.send(result);
      // })

        app.get('/booking',verifyJWT, async(req,res)=>{
          const email =req.query.email;
          console.log(authorization);
          const query={email:email};
          const bookingitem = await bookingCollection.find(query);
          const items =await bookingitem.toArray();
          res.send(items);
        })

        

        app.delete('/booking',async(req,res)=>{
          const id =req.query.amount;
          const query ={_id:ObjectId(id)};
          const delete1 =await bookingCollection.deleteOne(query);
          res.send(delete1);
        })

//
        
//



        // upore ar hat debona shob kaj ekhan theke korbo ami 


     }
     finally{

     }

}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello FROM BYCLE !')
})

app.listen(port, () => {
  console.log(`BYCLE PARTS APP listening on port ${port}`)
})