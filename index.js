const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const cluster = process.env.DB_CLUSTER;


const uri = `mongodb+srv://${user}:${pass}@${cluster}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

const run = async () => {
  try {
    const db = client.db('simple-student-crud');
    const studentsCollection = db.collection('students');

    app.get('/v1/students/list', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 10;
      const skip = (page - 1) * size;

      const query = {}
      const cursor = studentsCollection.find(query).sort({ _id: -1 });
      const patient = await cursor.skip(skip).limit(size).toArray();

      const totalRecord = await studentsCollection.estimatedDocumentCount();
      const total = Math.ceil(totalRecord / size);

      const data = {
        status: true,
        data: patient,
        pagination: {
          total,
          current: page,
        }
      }

      res.send(data);
    });


    app.get('/v1/students/single/:id', async (req, res) => {
      const id = req.params.id;

      let patient = null;

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) }
        patient = await studentsCollection.findOne(query);
      }

      const result = patient ? {
        status: true,
        data: patient
      } : {
        status: false,
        message: 'Data not found.'
      }

      res.send(result);
    });


    app.post('/v1/students/create', async (req, res) => {
      const data = req.body;
      const response = await studentsCollection.insertOne(data);

      const result = response?.acknowledged ? {
        status: true,
        _id: response.insertedId,
        message: 'Data create successful.'
      } : {
        status: false,
        message: 'Something is wrong.'
      }

      res.send(result);
    });


    app.patch('/v1/students/update/:id', async (req, res) => {
      const id = req.params.id;
      const updateObject = req.body;

      let response = null;

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) }
        const updatedDoc = {
          $set: updateObject
        }

        response = await studentsCollection.updateOne(query, updatedDoc);
      }

      const result = response?.acknowledged ? {
        status: true,
        message: 'Update successful.'
      } : {
        status: false,
        message: 'Invalid id.'
      }

      res.send(result);
    });


    app.delete('/v1/students/delete/:id', async (req, res) => {
      const id = req.params.id;

      let response = null;

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) };
        response = await studentsCollection.deleteOne(query);
      }

      const result = response?.deletedCount ? {
        status: true,
        message: 'Delete successful.'
      } : {
        status: false,
        message: 'Delete unsuccessful.'
      }

      res.send(result);
    })
  }
  finally {

  }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
  res.send({ message: 'The server is Running...' });
});

app.listen(port, () => {
  console.log(`The server running on ${port}`);
});