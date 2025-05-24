const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Database", class Block_Utilities {
    #Block = undefined;
    #Level = 5;
    #Order = 1;

    constructor(block) {
        this.#Block = block;
        
        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    Start() {
        Vars.TstString = "Hello";

        console.log("Run " + this.#Block.Name);
    }
});