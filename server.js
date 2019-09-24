// Dependencies
const cheerio = require("cheerio");
const express = require("express");
const expressHandlebars = require("express-handlebars");
const mongoose = require("mongoose");
// const logger = require("morgan");
const axios = require("axios");
// var db = require("./models");
const Article = require("./models/article.js");
const Note = require("./models/note.js");

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraper_db";

// initialize mongodb
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
// Initialize Express
let app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/", function(req, res) {
  Article.find({}).then(function(articledb) {
    console.log(articledb);
    res.render("index", { articles: articledb });
  });
});

app.get("/scrape", function(req, res) {
  axios
    .get("https://www.cointelegraph.com")
    .then(function(burrito) {
      var $ = cheerio.load(burrito.data);
      console.log("GETTING STUFF");
      $("article").each(function(i, element) {
        var title = $(this)
          .children(".post-preview-item-card__text-wrp")
          .children("p")
          .text();
        var url = $(this)
          .children("a")
          .attr("href");

        var result = {
          title: title,
          url: url
        };
        console.log(title, url);
        Article.create(result).then(function(articledb) {
          console.log(articledb);
        });
      });
    })
    .catch(err => {
      {
        throw err;
        console.log(err);
      }
    });
  res.redirect("/");
});

app.get("/saved", function(req, res) {
  Article.find({ saved: true }).then(data => {
    res.render("saved", { saved: data });
  });
});

app.get("/note/:id", function(req, res) {
  console.log(req.params.id);
  Note.find({ _id: req.params.id }).then(data => res.json(data));
});

app.post("/article/save/:id", function(req, res) {
  console.log(req.params.id);
  Article.findOneAndUpdate({ _id: req.params.id }, { saved: true }).then(
    dbres => console.log(dbres)
  );
});

app.post("/article/delete/:id", function(req, res) {
  console.log(req.params.id);
  Article.findOneAndUpdate({ _id: req.params.id }, { saved: false }).then(
    dbres => console.log(dbres)
  );
});

app.get("/articles/:id", function(req, res) {
  console.log(req.params.id);
  Article.find({ _id: req.params.id }).then(data => res.json(data[0]));
});

app.post("/articles/:id", function(req, res) {
  console.log(req.params.id);
  Note.create(req.body)
    .then(function(dbNote) {
      console.log(dbNote._id);
      return Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { note: dbNote._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log(`App listening on port ${PORT}`);
});
