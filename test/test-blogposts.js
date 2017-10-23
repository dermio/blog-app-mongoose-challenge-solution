const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

// Chai is an assertion library for testing.
// Using the 'should' style of chai in this module.
const should = chai.should();

const {BlogPost} = require("../models");
const {app, runServer, closeServer} = require("../server");

// testing requires a separate database url
const {TEST_DATABASE_URL} = require("../config");

// Chai HTTP extends the Chai assertion library.
// Allows Chai testing with HTTP APIs.
chai.use(chaiHttp);