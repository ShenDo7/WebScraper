// Dependencies
const cheerio = require("cheerio");
const express = require("express");
const { engine } = require("express-handlebars");
const mongoose = require("mongoose");
const axios = require("axios");
const Article = require("./models/article.js");
const Note = require("./models/note.js");

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraper_db";

// Initialize MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Initialize Express
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make public a static folder
app.use(express.static("public"));

// Set up Handlebars
app.engine("handlebars", engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set("views", "./views");

// Routes
app.get("/", async (req, res) => {
  try {
    const articles = await Article.find({});
    res.render("index", { articles });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching articles");
  }
});

app.get("/scrape", async (req, res) => {
  try {
    const response = await axios.get("https://www.cointelegraph.com");
    const $ = cheerio.load(response.data);
    
    console.log("Scraping articles...");
    
    const articles = [];
    $("article").each(function (i, element) {
      const title = $(this)
        .children(".post-preview-item-card__text-wrp")
        .children("p")
        .text();
      const url = $(this)
        .children("a")
        .attr("href");

      if (title && url) {
        articles.push({ title, url });
      }
    });

    // Save articles to database
    for (const article of articles) {
      try {
        await Article.create(article);
        console.log("Saved:", article.title);
      } catch (err) {
        // Skip duplicates or errors
        if (err.code !== 11000) {
          console.error("Error saving article:", err.message);
        }
      }
    }

    res.redirect("/");
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).send("Error scraping articles");
  }
});

app.get("/saved", async (req, res) => {
  try {
    const saved = await Article.find({ saved: true });
    res.render("saved", { saved });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching saved articles");
  }
});

app.get("/note/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching note" });
  }
});

app.post("/article/save/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { saved: true },
      { new: true }
    );
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving article" });
  }
});

app.post("/article/delete/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { saved: false },
      { new: true }
    );
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error removing article" });
  }
});

app.get("/articles/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching article" });
  }
});

app.post("/note/delete/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { notes: [] },
      { new: true }
    );
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting notes" });
  }
});

app.post("/articles/:id", async (req, res) => {
  try {
    const note = await Note.create(req.body);
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $push: { note: note._id } },
      { new: true }
    );
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding note" });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
