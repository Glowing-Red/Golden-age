global.ReBlock = new class ReBlock {
    #Blocks = {};

    constructor() { }

    CreateBlock(blockName, blockClass) {
        const Blocks = this.#Blocks;
        const lower = blockName.toLowerCase();

        if (Blocks[lower]) {
            throw new Error(`Block with name "${blockName}" already exists.`);
        }

        const block = Blocks[lower] = {
            Name: blockName
        }

        const newClass = block.Class = new blockClass(block);

        return newClass;
    }

    GetBlock(name) {
        const Blocks = this.#Blocks;
        const lower = name.toLowerCase();

        if (!Blocks[lower]) {
            throw new Error(`There is no block with the "${name}" that exists.`);
        }

        return Blocks[lower].Class;
    }

    async Start() {
        const Blocks = this.#Blocks;
        const Promises = {}

        console.warn("[Server] ReBlock Started!");

        Promises.Start = Object.keys(Blocks).map((key) => {
            const block = Blocks[key];

            if (typeof block.Class.Start === "function" && block.Class.RejectCycle !== true) {
                return Promise.resolve()
                    .then(() => block.Class.Start())
                    .catch((err) => {
                        console.error(`Error in block "${block.Name}" Start():`, err);

                        throw err;
                    });
            }

            return Promise.resolve();
        });

        try {
            await Promise.all(Promises.Start);
        } catch (err) {
            throw new Error("ReBlock.Start() failed due to Blocks.Start() error.");
        }

        Promises.Init = Object.keys(Blocks).map((key) => {
            const block = Blocks[key];

            if (typeof block.Class.Init === "function" && block.Class.RejectCycle !== true) {
                return Promise.resolve()
                    .then(() => block.Class.Init())
                    .catch((err) => {
                        console.error(`Error in block "${block.Name}" Init():`, err);

                        throw err;
                    });
            }

            return Promise.resolve();
        });

        try {
            await Promise.all(Promises.Init);
        } catch (err) {
            throw new Error("ReBlock.Start() failed due to Blocks.Init() error.");
        }
    }
}();