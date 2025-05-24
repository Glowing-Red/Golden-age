const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Utilities", class Block_Utilities {
    #Block = undefined;
    #RejectCycle = true;
    #Level = 4;
    #Order = 2;

    constructor(block) {
        this.#Block = block;

        block.RejectCycle = this.#RejectCycle;
        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    Run() {
        console.log("Util: ", Vars.TstString);
        console.log(Date.now())
    }
});