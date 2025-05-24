const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Test", class {
    #Block = undefined;
    #Level = 4;
    #Order = 1;

    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    Start() {
        const Utilities = ReBlock.GetBlock("Utilities");
        console.log("Run " + this.#Block.Name);
        console.log("Test: ", Vars.TstString);
        
        Vars.TstString = "Secret Test";
        Utilities.Run();
    }
});