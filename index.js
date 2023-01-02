const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { send } = require('express/lib/response');
const port = process.env.PORT ||5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q36fl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
  
  const authHeader =req.headers.authorization;
 
  if(!authHeader){
    return res.status(401).send({message:'Unauthorized access'})
  }
  const token  =authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(error, decoded) {
   if(error){
     return res.status(403).send({message :'forbidden access'})
   }
   req.decoded =decoded;
   next();
  });
}


 async function run(){
     try{
        await client.connect();
        console.log('database connected ');
        const toolsCollection = client.db('bycle').collection('tools');
        const bookingCollection = client.db('bycle').collection('bookings');
        const reviewCollection = client.db('bycle').collection('review');
        const userCollection = client.db('bycle').collection('users');
        const paymentCollection = client.db('bycle').collection('payments');
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

        });




        //
        app.patch('/booking/:id',verifyJWT,async(req,res)=>{
          const id =  req.params.id;
          const payment =req.body;
          const filter ={_id:ObjectId(id)}
          const updateDoc = {
            $set: {
              paid:true,
              transaction :payment.transactionId

            }
          };
          const result =await paymentCollection.insertOne(payment);
          const updatedBooking = await bookingCollection.updateOne(filter,updateDoc);
          res.send(updateDoc);
        })
        //

        app.get('/admin/:email',async(req,res)=>{
          const email =req.params.email;
          const user =await userCollection.findOne({email:email})
          const isAdmin =user.role === 'admin';
          res.send({admin :isAdmin})
        })


        app.put('/user/admin/:email',verifyJWT, async(req,res)=>{
          const email =req.params.email;
         const requester = req.decoded.email;
         const requesterAccount =await userCollection.findOne({email:requester});
         if(requesterAccount.role === 'admin'){
          const filter = {email:email};
         
          const updateDoc = {
            $set: {role:'admin'},
          };
          const result = await userCollection.updateOne(filter,updateDoc);
          res.send(result);
         }
         else{
           res.status(403).send({message:'forbidden'})
         }
        

        })



        app.post('/booking',async(req,res)=>{
            const booking =req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);

        })

        app.post('/tools',async(req,res)=>{
          const adding =req.body;
          const addresult =await toolsCollection.insertOne(adding);
          res.send(addresult);
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

      

        app.post('/create-payment-intent', verifyJWT, async(req,res)=>{
        const service=req.body;
        const price =service.price;
        const amount =price*100;
        const paymentIntent =await stripe.paymentIntents.create({
          amount: amount,
          currency :'usd',
          payment_method_types:['card']

        });
        res.send({clientSecret: paymentIntent.client_secret})
        


        })



      //   app.get('/booking/:id',async(req,res)=>{
      //     const id=req.params.id;
      //     const query ={_id:ObjectID(id)}
      //     const result =await bookingCollection.findOne(query);
      //     res.send(result);
      // })

        app.get('/booking',verifyJWT, async(req,res)=>{
          const email =req.query.email;
          const decodedEmail = req.decoded.email;
          if(email === decodedEmail){
            const query={email:email};
          const bookingitem = await bookingCollection.find(query);
          const items =await bookingitem.toArray();
          return res.send(items);
          }
          else{
            return res.status(403).send({message :'forbidden acces '})

          }
          
        })

        //
        app.get('/booking/:id',verifyJWT, async(req,res)=>{
          const id =req.params.id;
          const query ={_id:ObjectId(id)};
          const booking = await bookingCollection.findOne(query);
          res.send(booking);

        })
        //
        //

        app.get('/user',verifyJWT, async(req,res)=>{
          const users =await userCollection.find().toArray();
          res.send(users);
        })
        //
        app.get('/bookingss',async(req,res)=>{
          const allbookd =await bookingCollection.find().toArray();
          res.send(allbookd);

        })

        //
        

        app.delete('/booking',async(req,res)=>{
          const id =req.query.amount;
          const query ={_id:ObjectId(id)};
          const delete1 =await bookingCollection.deleteOne(query);
          res.send(delete1);
        })



        //
        app.delete('/user',async(req,res)=>{
          const id =req.query.amount;
          const query ={_id:ObjectId(id)};
          const delete1 =await userCollection.deleteOne(query);
          res.send(delete1);
        })

        //


        app.delete('/deleted',async(req,res)=>{
          const id =req.query.amount;
          const query ={_id:ObjectId(id)};
          const delete1 =await toolsCollection.deleteOne(query);
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



const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});