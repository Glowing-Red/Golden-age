// Variables
const Vars = global.Vars = {};
Vars.SECRET_KEY = "Rosalith's Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.";

// Importing ReBlock
require("./ReBlock.js");

// Importing Level 5 Blocks
require("./Blocks/mongdo.js");
require("./Blocks/templtae.js");

// Importing Level 4 Blocks
require("./Blocks/test.js");
require("./Blocks/util.js");

const ReBlock = global.ReBlock;
ReBlock.Start().then(() => {
    console.warn("[Server] ReBlock: All blocks finished their cycle.");
});