// Dependencies
const cheerio = require("cheerio");
const express = require("express");
const expressHandlebars = require("express-handlebars");
const mongoose = require("mongoose");
const axios = require("axios");

const PORT = process.env.PORT || 3001;

// Initialize Express
let app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.get("/scrape", function(req, res) {
  axios
    .get("http://www.cointelegraph.com")
    .then(function(burrito) {
      var $ = cheerio.load(burrito.data);
      console.log("GETTING STUFF");
      $("article").each(function(i, element) {
        var title = console.log(
          $(this)
            .children(".post-preview-item-card__text-wrp")
            .children("p")
            .text()
        );
      });
    })
    .catch(err => {
      {
        throw err;
        console.log(err);
      }
    });
  res.send("SCRAPE COMPLETE");
});

app.listen(PORT, function() {
  console.log(`App listening on port ${PORT}`);
});
