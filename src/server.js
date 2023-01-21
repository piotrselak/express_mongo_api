const express = require('express');
const dbo = require('./db/conn')
const {ObjectID} = require("mongodb");

const app = express();
const PORT = 3000;

app.use(express.json())

dbo.connectToServer(console.log);


app.get('/products', async function (req, res) {
    const dbConnect = dbo.getDb();

    let sortBy = req.query.sortBy;
    sortBy = sortBy === undefined ? "name" : sortBy

    let lessThan = req.query.lesserThan;
    lessThan = lessThan === undefined ? 1000000 : parseInt(lessThan)

    let moreThan = req.query.biggerThan;
    moreThan = moreThan === undefined ? 0 : parseInt(moreThan)

    const query = { price: {$gt: moreThan, $lt: lessThan}}

    dbConnect
        .collection("products")
        .find(query)
        .sort({[sortBy]: 1})
        .toArray(function (err, result) {
            if (err) {
                res.status(400).send("Error fetching listings!");
            } else {
                res.json(result);
            }
        });
});

app.post("/products",async function (req, res) {
    const dbConnect = dbo.getDb();
    const body = req.body

    const result = await dbConnect
        .collection("products")
        .find({"name": body.name})
        .toArray(function (err, result) {
            if (err)
                res.status(400).send("Given product exists!");
            if (result.length === 0) {
                dbConnect
                    .collection("products")
                    .insertOne(body)
                res.status(201).send("Ok!")
            } else res.status(400).send("Given product exists!")
        });
})

app.put("/products/:id", async function (req, res) {
    const dbConnect = dbo.getDb();
    const body = req.body
    const id = req.params.id

    const result = await dbConnect
        .collection("products")
        .updateOne({"_id": ObjectID(id)}, { "$set": body })

    if (result.modifiedCount > 0)
        res.status(201).send("Succesfully updated!\n")
    else
        res.status(404).send("Not found\n")
})

app.delete("/products/:id", async function (req, res) {
    const dbConnect = dbo.getDb();
    const id = req.params.id

    const result = await dbConnect
        .collection("products")
        .deleteOne({"_id": ObjectID(id)})

    if (result.deletedCount > 0)
        res.status(201).send("Succesfully deleted!\n")
    else
        res.status(404).send("Not found\n")
})

app.get("/raport", async function (req, res) {
    const dbConnect = dbo.getDb();
    const aggCursor = dbConnect
        .collection("products")
        .aggregate([
            {
                "$project": { "name": 1, "amount": 1, "price": 1, "totalPrice": { "$multiply": [ "$price", "$amount" ] } }
            }
        ])
    let arr = []
    for await (const doc of aggCursor) {
        arr = [...arr, doc]
    }
    res.status(200).json(arr)
})

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is successfully running"+ PORT)
    else
        console.log("Error occurred, server can't start", error);
    }
);