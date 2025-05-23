const ReBlock = global.ReBlock;

ReBlock.CreateBlock("Utilities", class Block_Utilities {
    Level = 10;
    Order = 10;
    RejectCycle = false;

    #Block = undefined;

    constructor(block) {
        this.#Block = block;
    }

    Start() {
        const Vars = global.Vars;
        Vars.SECRET_KEY = "Secret Test";

        console.log("Run " + this.#Block.Name);
    }
});