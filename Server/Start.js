// Importing ReBlock
require("./ReBlock.js");

const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

// Importing Blocks
require("./Blocks/templtae.js");
require("./Blocks/test.js");
require("./Blocks/Utilities.js");
require("./Blocks/Variables/Important.js");
require("./Blocks/Database/MongoDB.js");

ReBlock.SequentialStart().then(() => {
    console.warn("[Server](SequentialStart) ReBlock: All blocks finished their cycle.");

    const PORT = Vars.PORT; 
    const domain = Vars.Domain;
    const server = Vars.Server;

    server.listen(PORT, () => {
        console.log(`Server running on ${domain}/home`);
    });
}).catch(err => {
    console.error("Failed to start ReBlock cycle or server:", err);
    process.exit(1);
});