const ReBlock = global.ReBlock;

ReBlock.CreateBlock("Test", class Block_Utilities {
    #Block = undefined;
    #Level = 4;
    #Order = 1;

    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    Start() {
        const Vars = global.Vars;

        console.log("Run " + this.#Block.Name);
    }
});