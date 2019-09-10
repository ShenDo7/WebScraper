var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var articleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  }
});

var Article = mongoose.model("Article", articleSchema);

module.exports = Article;
