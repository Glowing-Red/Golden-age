const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Template", class Block_Utilities {
    #Block = undefined;
    #Level = 5;
    #Order = 2;

    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    Start() {
        console.log("Run " + this.#Block.Name);
    }
});