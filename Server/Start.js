// Importing ReBlock
require("./ReBlock.js");

const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

const fs = require("fs");
const path = require("path");

// Function to recursively load all blocks except ReBlock
function LoadBlocks(directoryPath) {
    fs.readdirSync(directoryPath, { withFileTypes: true }).forEach(dirent => {
        const fullPath = path.join(directoryPath, dirent.name);

        if (dirent.isDirectory()) {
            LoadBlocks(fullPath);
        } else if (dirent.isFile() && path.extname(fullPath) === ".js") {
            require(fullPath);
        }
    });
}

// Load all blocks
LoadBlocks(path.join(__dirname, "Blocks"));

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