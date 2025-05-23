// Variables
const Vars = global.Vars = {};
Vars.SECRET_KEY = "Rosalith's Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.";

// Importing .js files
require("./ReBlock.js");
require("./Blocks/util.js");

const ReBlock = global.ReBlock;
ReBlock.Start().then(() => {
    console.warn("[ReBlock] All blocks finished their cycle.");
});