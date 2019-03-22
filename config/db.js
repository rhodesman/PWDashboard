
const mongoose = require("mongoose");

// EDIT path to Your mongoDB Cluster Account here
const dbURI = "mongodb+srv://{username}:{password}@{your mongo DB Cluster}-ofttx.mongodb.net/{collection name}?retryWrites=true";

const options = {
    useNewUrlParser: true,
    reconnectTries: Number.MAX_VALUE,
    poolSize: 10
};
mongoose.connect(dbURI, options).then(
    () => {
        console.log("Database connection established!");
    },
    err => {
        console.log("Error connecting Database instance due to: ", err);
    }
);
// require any models
require("../api/models/model");