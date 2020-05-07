/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable linebreak-style */
/* eslint-disable no-console */
const express = require('express');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const sqlite3 = require('sqlite3').verbose();
require('dotenv/config');

const app = express();
const port = process.env.PORT || 8000;
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.listen(port, () => {
  console.log(`Node app is running at localhost:${port}`);
});

const baseURL = 'https://data.princegeorgescountymd.gov/resource/umjn-t2iz.json?$limit=36000';

const uri = process.env.MONGODB_URL;
fetch(baseURL)
  .then((r) => r.json())
  .then((data) => {
    MongoClient.connect(uri, { useNewUrlParser: true },
      { useUnifiedTopology: true }, async (err, client) => {
        if (err) {
          console.error(err);
          return;
        }
        const db = await client.db('data');
        const collection = await db.collection('restaurant');
        const filtered = data.filter((key) => (key.category === 'Restaurant' || key.category === 'Carry-out'
           || key.category === 'Fast Food'));
        collection.insertMany(filtered, (error, result) => {
          if (error) throw error;
          console.log(`Number of documents inserted: ${result.insertedCount}`);
          console.log(result.insertedCount);
          client.close();
        });
      });
  });
app.route('/api').put((req, res) => {
  console.log(req.body);
  MongoClient.connect(uri, { useNewUrlParser: true }, async (err, client) => {
    if (err) throw err;
    const db = client.db('data');
    if (req.body.category === 'Zip Code' && req.body.searchBar.match(/^\d{1,5}$/)) {
      await db.collection('restaurant').find({ zip: req.body.searchBar }).toArray().then((data) => {
        res.send(data);
      })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          client.close();
        });
    } else {
      console.log('error');
    }
  });
});
