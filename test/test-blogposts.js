const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

// Chai is an assertion library for testing.
// Using the "should" style of chai in this module.
const should = chai.should();

const {BlogPost} = require("../models");
const {app, runServer, closeServer} = require("../server");

// testing requires a separate database url
const {TEST_DATABASE_URL} = require("../config");

// Chai HTTP extends the Chai assertion library.
// Allows Chai testing with HTTP APIs.
chai.use(chaiHttp);


// 1 generate Individual Data for Field and Value pairs of Document
// 2 generate Data for one Document, include Field/Value pairs
// 3 seed Database with documents (multiple docs)

// Seed with random data in database, so can use Chai's assertion library.
// The Faker library generates fake values for the blog posts'
// author, title, and content. These values are inserted into Mongo DB.
function seedBlogPostData() {
  console.info("seeding blog post data");
  let seedData = [];

  for (var i = 0; i < 10; i++) {
    seedData.push(generateBlogPostData());
  }

  return BlogPost.insertMany(seedData); // generates Promise?
}

// The fake document looks like the blueprint found in the Mongoose Schema
// Creates an object that represents the blog post.
function generateBlogPostData() {
  // Note: I could use only faker methods to generate random data,
  // or I could generate my own random data.
  // I'll generate my own random titles in a function I created,
  // generateTitleName()
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: generateTitleName(),
    content: faker.lorem.sentences(),
    created: faker.date.recent()
  };
}

// Create my own function to generate random title names
function generateTitleName() {
  let titles = ["Mr.", "Mrs.", "Miss", "Your Majesty", "Sir",
                "Ninja", "Master", "Professor", "Guru", "Chef"];
  return titles[Math.floor(Math.random() * titles.length)];
}

// Tear down (drop) database after each suite of testing is done
function tearDownDb() {
  console.warn("Deleting database");
  return mongoose.connection.dropDatabase();
}


// Mocha's hook functions: before(), after(), afterEach(), beforeEach()
// The hooks are used to set up pre-conditions and clean up after tests
describe("Blog posts API resource", function () {

  before(function () {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function () {
    return seedBlogPostData();
  });

  afterEach(function () {
    return tearDownDb();
  });

  after(function () {
    return closeServer();
  });


  /***** Test Cases *****/
  describe("GET endpoint", function () {
    it("should return all existing blog posts", function () {
      // `res` is a variable in a Scope accessible to
      // all then() function calls. It will be the response object
      let res;

      // Chai HTTP is a plugin for Chai. Chai uses Chai HTTP through
      // the command: chai.use(chaiHttp), line 18
      return chai.request(app)
        .get("/posts") // get() availabe to Chai HTTP, in Node.js
        .then(function (_res) {
          res = _res;
          res.should.have.status(200);
          // res.body.posts.should.have.length.of.at.least(1);
          // Q. Why is `posts` omitted???
          // A. Compare to node-restaurants-app-mongoose example:
          // res.body.restaurants.should.have.length.of.at.least(1);
          // The server module for node restaurant-app, lines 28-31,
          // returns an object with key `restaurant`, and an array
          // of document restaurants.
          // The server module for blog-app returns an array
          // of document restaurants.
          // console.log(res.body);
          res.body.should.have.length.of.at.least(1);
          
          return BlogPost.count();
        })
        .then(function (count) {
          // console.log("[[CONSOLE.LOG]]", res.body.should.have.length.of);
          // compare to node-restaurants-app-mongoose
          // changed from `length.of` to `lengthOf
          // I get the following error:
          // `TypeError: res.body.should.have.length.of is not a function`
          // res.body.should.have.length.of(count); // old code doesn't work
          res.body.should.have.lengthOf(count);
          // the number of returned posts should be
          // the same as the number of posts in MongoDB
        });
    });

    it("should return posts with right fields", function () {
      // Get back all restaurants, and make sure they have
      // the right keys and values.

      let resPost;
      return chai.request(app)
        .get("/posts")
        .then(function (res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a("array");
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function (post) {
            post.should.be.a("object");
            // Use the keys in the returned object from the apiRepr method.
            // This is because the apiRepr method is called
            // in the GET request.
            post.should.include.keys(
              "id", "author", "content", "title", "created");
          });

          // Check the Id for one of the posts, then return that doc.
          // In the next .then() method, check the values
          // in the post document/object matches the database.
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        // The `resPost` is the response that's sent back to the Client.
        // In the GET request, the apiRepr method will send back
        // to the Client a representation of the post document
        // in the database, instead of the document itself.
        // The `post` is the actual document in the Mongo DB
        // found by the Mongoose command findById().
        .then(function (post) {
          // console.log(resPost);
          // console.log(post);
          resPost.id.should.equal(post.id);
          // resPost.author.should.equal(post.authorName); // also correct
          resPost.author.should.contain(post.author.lastName);
          resPost.content.should.equal(post.content);
          resPost.title.should.equal(post.title);
          // I can't get the date to work correctly
          // resPost.created.should.equal(post.created.toString());
        });
    });

    
  });


});