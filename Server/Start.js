// Importing ReBlock
require("./ReBlock.js");

// Variables
const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

Vars.SECRET_KEY = "Rosalith's Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.";

// Importing Level 5 Blocks
require("./Blocks/mongdo.js");
require("./Blocks/templtae.js");

// Importing Level 4 Blocks
require("./Blocks/test.js");
require("./Blocks/util.js");

ReBlock.SequentialStart().then(() => {
    console.warn("[Server](SequentialStart) ReBlock: All blocks finished their cycle.");
});