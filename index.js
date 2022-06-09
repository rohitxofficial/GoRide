const bodyParser = require("body-parser");
const express = require("express");
const request = require("request");
const Blockchain = require("./server/blockchain");
const PubSub = require("./server/app/pubnub");
const fuel = require("./server/fuels/");
const distance_matrix = require("google-distance-matrix");
const Block = require("./server/blockchain/block");
const hash = require("./server/util/crypto-hash");
const mysql = require("mysql2");
const util = require("util");
const fs = require("fs");

// SQL Initial Configurations
const conn = mysql.createConnection({
  // {MY_SQL_Credentials}
});

const query = util.promisify(conn.query).bind(conn);

// Resetting Active Status to 0 for all drivers at Initilization
(async function () {
  await query(
    `UPDATE Drivers
      SET "Active" = '0';`
  );
})();

// Distance Matrix API Key
distance_matrix.key("{GOOGLE_MAPS_API_KEY}");

// Initilizations
const app = express();
const blockchain = new Blockchain();
const confirmed_blockchain = new Blockchain();
const pubsub = new PubSub({ blockchain, confirmed_blockchain });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "pug");

// Default Parameters
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = "http://localhost:" + DEFAULT_PORT;

// Get Methods
app.get("/fare_calculation", (req, res) => {
  res.sendFile(__dirname + "/public/fare_calculation.html");
});

app.get("/drive_with_us", (req, res) => {
  res.sendFile(__dirname + "/public/drive_with_us.html");
});

app.get("/about_us", (req, res) => {
  res.sendFile(__dirname + "/public/about_us.html");
});

app.get("/contact_us", (req, res) => {
  res.sendFile(__dirname + "/public/contact_us.html");
});

// Riders Side Get Methods
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/riders/home.html");
});

app.get("/sorry", (req, res) => {
  res.sendFile(__dirname + "/public/riders/sorry.html");
});

// Drivers Get Method
app.get("/drivers_login", (req, res) => {
  res.sendFile(__dirname + "/public/drivers/drivers_login.html");
});

app.get("/wrong_credentials", (req, res) => {
  res.sendFile(__dirname + "/public/drivers/wrong_credentials.html");
});

// Blockchain Get Methods
app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.get("/api/confirmed_blocks", (req, res) => {
  res.json(confirmed_blockchain.chain);
});

// Post Methods
// Function to Log Current Location in Database
app.post("/updateLocation", (req, res) => {
  var lat = req.body.lat;
  var lng = req.body.lng;
  var email = req.body.email;

  (async function () {
    console.log("here");
    console.log("here");
    await query(
      `UPDATE Drivers
        SET Latitude = '${lat}' and Longitude = '${lng}'
        WHERE Email = '${email}';`
    );
  })();
});

// Riders Post Methods
// fare Post Method
var origins;
var destinations;

app.post("/fare", (req, res) => {
  origins = [req.body.origin];
  destinations = [req.body.destination];

  var distance_global;
  var time_global;

  distance_matrix.matrix(origins, destinations, function (err, distances) {
    if (err) {
      return console.log(err);
    }
    if (!distances) {
      return console.log("no distances");
    }
    if (distances.status == "OK") {
      for (var i = 0; i < origins.length; i++) {
        for (var j = 0; j < destinations.length; j++) {
          var origin = distances.origin_addresses[i];
          var destination = distances.destination_addresses[j];
          if (distances.rows[0].elements[j].status == "OK") {
            var time = distances.rows[i].elements[j].duration.text;
            var distance = distances.rows[i].elements[j].distance.text;
            distance_global = distance.slice(0, -3);
            time_global = time;
          } else {
            console.log(
              destination + " is not reachable by land from " + origin
            );
          }
        }
      }
    }
  });

  var price_cng;

  (async function () {
    const res = await fuel.getPrice();

    price_cng = await res.fuelPrice.cngPrice;
  })();

  setTimeout(() => {
    var fare_global;

    if (parseFloat(distance_global) <= 5.0) {
      fare_global = 100;
    } else {
      fare_global =
        parseFloat(100) +
        parseFloat(parseFloat(distance_global) * parseFloat(10)) +
        parseFloat(
          parseFloat(price_cng) * (parseFloat(distance_global) / parseFloat(25))
        );
    }

    (async function () {
      var active_drivers_list = await query(
        `SELECT Latitude, Longitude
        FROM Drivers
        WHERE Active='1';`
      );

      var drivers_count = active_drivers_list.length;

      var final_drivers_list = [];

      for (var i = 0; i < drivers_count; i++) {
        final_drivers_list.push({
          lat: active_drivers_list[i].Latitude,
          lng: active_drivers_list[i].Longitude,
        });
      }

      res.render(__dirname + "/public/riders/confirm.pug", {
        origin: origins[0],
        destination: destinations[0],
        time: time_global,
        distance: distance_global,
        fare: Math.round(fare_global * 100) / 100,
        drivers_count: drivers_count,
        final_drivers_list: final_drivers_list,
      });
    })();
  }, 2000);
});

// await Post Method
app.post("/await", (req, res) => {
  var user_name = req.body.username;
  var phone_num = req.body.phonenum;

  var distance_global;
  var time_global;

  distance_matrix.matrix(origins, destinations, function (err, distances) {
    if (err) {
      return console.log(err);
    }
    if (!distances) {
      return console.log("no distances");
    }
    if (distances.status == "OK") {
      for (var i = 0; i < origins.length; i++) {
        for (var j = 0; j < destinations.length; j++) {
          var origin = distances.origin_addresses[i];
          var destination = distances.destination_addresses[j];
          if (distances.rows[0].elements[j].status == "OK") {
            var time = distances.rows[i].elements[j].duration.text;
            var distance = distances.rows[i].elements[j].distance.text;
            distance_global = distance.slice(0, -3);
            time_global = time;
          } else {
            console.log(
              destination + " is not reachable by land from " + origin
            );
          }
        }
      }
    }
  });

  var price_cng;

  var data;

  (async function () {
    const res = await fuel.getPrice();

    price_cng = await res.fuelPrice.cngPrice;
  })();

  setTimeout(() => {
    var fare_global;

    if (parseFloat(distance_global) <= 5.0) {
      fare_global = 100;
    } else {
      fare_global =
        parseFloat(100) +
        parseFloat(parseFloat(distance_global) * parseFloat(10)) +
        parseFloat(
          parseFloat(price_cng) * (parseFloat(distance_global) / parseFloat(25))
        );
    }

    data = {
      id: blockchain.chain.length,
      name: user_name,
      phone: phone_num,
      origin: origins[0],
      destination: destinations[0],
      time: time_global,
      distance: distance_global,
      fare: Math.round(fare_global * 100) / 100,
    };

    blockchain.addBlock({ data });

    pubsub.broadcastChain();

    var interval = setInterval(function () {
      for (var i = confirmed_blockchain.chain.length - 1; i > 0; i--) {
        if (confirmed_blockchain.chain[i].data.id == data.id) {
          var block = confirmed_blockchain.chain[i].data;

          (async function () {
            var query_res = await query(
              `SELECT * from Drivers WHERE Email='${block.driver}';`
            );

            console.log(query_res);

            clearInterval(interval);
            res.render(__dirname + "/public/riders/final_page.pug", {
              name: query_res[0].Name,
              phone: query_res[0].Phone,
              car: query_res[0].Car_Name,
              car_num: query_res[0].Car_Number,
              origin: origins[0],
              destination: destinations[0],
            });
          })();
        }
      }
    }, 2000);
  }, 2000);
});

// Drivers Post Methods
// drivers-active Post Method
app.post("/drivers-active", (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  var longitude = req.body.longitude;
  var latitude = req.body.latitude;

  (async () => {
    var rows = await query(
      `select * from Drivers where Email='${email}' and Password='${password}';`
    );

    if (rows.length == 0) {
      res.redirect("/wrong_credentials");
    } else {
      (async function () {
        await query(
          `UPDATE Drivers
          SET Active = '1'
          WHERE Email='${email}';`
        );
      })();

      (async function () {
        await query(
          `
          UPDATE Drivers
            SET Longitude = ${longitude}, Latitude = ${latitude}
            WHERE Email = '${email}';
          `
        );
      })();

      let final_Rides = new Set();
      var obj;

      for (let i = blockchain.chain.length - 1; i > 0; i--) {
        if ((Date.now() - Number(blockchain.chain[i].timestamp)) / 1000 > 60) {
          console.log(
            (Date.now() - Number(blockchain.chain[i].timestamp)) / 1000
          );
          break;
        }

        obj = blockchain.chain[i];
        final_Rides.add(obj.data.id);
      }

      for (let i = confirmed_blockchain.chain.length - 1; i > 0; i--) {
        if (
          (Date.now() - Number(confirmed_blockchain.chain[i].timestamp)) /
            1000 >
          60
        ) {
          console.log(
            (Date.now() - Number(confirmed_blockchain.chain[i].timestamp)) /
              1000
          );
          break;
        }

        obj = confirmed_blockchain.chain[i];
        final_Rides.delete(obj.data.id);
      }

      var arr = [];

      for (let item of final_Rides) {
        arr.push(JSON.stringify(blockchain.chain[item].data));
      }

      res.render(__dirname + "/public/drivers/drivers_active.pug", {
        arr: arr,
        email: email,
      });
    }
  })();
});

// redirect Post Method
app.post("/redirect", (req, res) => {
  var ride = req.body.block_index;
  var email = req.body.email;
  var origin = req.body.origin;
  var destination = req.body.destination;
  var time = req.body.time;
  var distance = req.body.distance;
  var fare = req.body.fare;

  (async function () {
    await query(
      `UPDATE Drivers
      SET Active = '2'
      WHERE Email = '${email}';`
    );
  })();

  var data = blockchain.chain[ride].data;

  data.driver = email;

  confirmed_blockchain.addBlock({ data });

  pubsub.broadcastConfirmedChain();

  res.render(__dirname + "/public/drivers/drivers_final.pug", {
    origin: origin.split("+").join(" "),
    destination: destination.split("+").join(" "),
    time: time.split("+").join(" "),
    distance: distance,
    fare: fare,
    pickup: "https://www.google.com/maps?q=" + origin,
    dropoff: "https://www.google.com/maps?q=" + destination,
    rider_name: data.name,
    rider_phone: data.phone,
  });
});

// driver-data Post Method
app.post("/driver-data", (req, res) => {
  var name = req.body.driver_name;
  var email = req.body.driver_email;
  var phone = req.body.driver_mobile;
  var car = req.body.driver_car;
  var car_num = req.body.driver_car_number;
  var password = req.body.password;

  query_to_run = `INSERT INTO Drivers (Name, Email, Phone, Password, Car_Name, Car_Number, Active) VALUES('${name}', '${email}', '${phone}', '${password}', '${car}', '${car_num}', '0');`;

  (async () => {
    var rows;
    rows = await query(query_to_run);

    console.log(rows);

    res.redirect("/drivers_login");
  })();
});

// Sync Blockchain
const syncChains = () => {
  request(
    { url: ROOT_NODE_ADDRESS + "/api/blocks" },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);

        blockchain.replaceChain(rootChain);
      }
    }
  );

  request(
    { url: ROOT_NODE_ADDRESS + "/api/confirmed_blocks" },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);

        confirmed_blockchain.replaceChain(rootChain);
      }
    }
  );
};

// Express Start
let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === "true") {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
  console.log("listening at localhost:" + PORT);

  if (PORT !== DEFAULT_PORT) {
    syncChains();
  }
});
