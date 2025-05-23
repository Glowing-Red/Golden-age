const ReBlock = global.ReBlock;
ReBlock.CreateBlock("Utilities", class Block_Utilities {
    static Level = 10;
    static Order = 10;

    #Block = undefined;
    RejectCycle = false;

    constructor(block) {
        this.#Block = block;
    }

    Start() {
        const Vars = global.Vars;
        Vars.SECRET_KEY = "Secret Test";

        console.log("Run " + this.#Block.Name);
    }
});