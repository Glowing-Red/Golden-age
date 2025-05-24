global.ReBlock = new class ReBlock {
    #Started = false;
    #Blocks = {};

    constructor() { }

    CreateBlock(blockName, blockClass) {
        if (this.#Started == true) {
            throw new Error(`[Server] ReBlock: Cannot create blocks after the lifecycle has started.`);
        }

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

    GetRawBlock(name) {
        const Blocks = this.#Blocks;
        const lower = name.toLowerCase();

        if (!Blocks[lower]) {
            throw new Error(`There is no block with the "${name}" that exists.`);
        }

        return Blocks[lower];
    }

    GetBlock(name) {
        const block = this.GetRawBlock(name);

        if (block) {
            return block.Class;
        }

        return null;
    }

    async Start() {
        if (this.#Started != false) {
            throw new Error(`[Server] ReBlock lifecycle already started!`);
        }

        this.#Started = true;
        const Promises = {}

        const Blocks = this.#Blocks;
        const sortedKeys = Object.keys(Blocks)
            .filter((key) => Blocks[key].RejectCycle !== true)
            .sort((a, b) => {
                const blockA = Blocks[a];
                const blockB = Blocks[b];

                if (blockB.Level !== blockA.Level) {
                    return blockB.Level - blockA.Level;
                }

                return blockA.Order - blockB.Order;
            }
        );
        
        console.warn("[Server] ReBlock: Started!");
        
        Promises.Start = sortedKeys.map((key) => {
            const block = Blocks[key];
            
            if (typeof block.Class.Start === "function") {
                return Promise.resolve()
                    .then(() => block.Class.Start())
                    .catch((err) => {
                        console.error(`[Server] ReBlock: Error in block "${block.Name}".Start():`, err);

                        throw err;
                    });
            }

            return Promise.resolve();
        });

        try {
            await Promise.all(Promises.Start);
        } catch (err) {
            throw new Error("[Server] ReBlock.Start(): Failed due to Block.Start() error.");
        }

        Promises.Init = sortedKeys.map((key) => {
            const block = Blocks[key];

            if (typeof block.Class.Init === "function") {
                return Promise.resolve()
                    .then(() => block.Class.Init())
                    .catch((err) => {
                        console.error(`[Server] ReBlock: Error in block "${block.Name}".Init():`, err);

                        throw err;
                    });
            }

            return Promise.resolve();
        });

        try {
            await Promise.all(Promises.Init);
        } catch (err) {
            throw new Error("[Server] ReBlock.Start(): Failed due to Block.Init() error.");
        }
    }
}();