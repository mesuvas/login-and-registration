const express = require("express")
const cors = require("cors")
const cookieSession = require("cookie-session")
const bodyParser = require("body-parser");


const app = express()

const db = require("./app/models");
const Role = db.role;

db.mongoose
  .connect(`mongodb+srv://admin:MU5zYVBYg3NobCKm@cluster0.uxiwyez.mongodb.net/userdb`,  )
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });


var corsOptions = {
    origin: "http://127.0.0.1:8080"
}

app.use(cors(corsOptions))

app.use(express.json())

// app.use(bodyParser.json());

app.use(express.urlencoded({extended: true}))

app.use(cookieSession({
    name:"user-session",
    keys:['COOKIE_SECRET'], 
    httpOnly: true
}))

// set port, listen for requests
async function initial() {
  try {
    const count = await Role.estimatedDocumentCount();
    if (count === 0) {
      await Promise.all([
        new Role({ name: "user" }).save(),
        new Role({ name: "moderator" }).save(),
        new Role({ name: "admin" }).save(),
      ]);
      console.log("Roles added successfully");
    } else {
      console.log("Roles already exist");
    }
  } catch (err) {
    console.error("Error adding roles:", err);
  }
}
// Handle GET requests to the root path ("/")
app.get('/', (req, res) => {

     // Set the HTTP status code to 200 (OK) and send a JSON response
    res.status(200).json({ 
        status: 'success',
        message: 'Welcome to the Yodh Lab'
    });
});
// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);

//set port, listen for requests
const PORT = process.env.PORT || 8080
app.listen(PORT, () =>{
    console.log(`server is running on port ${PORT}`)
})

