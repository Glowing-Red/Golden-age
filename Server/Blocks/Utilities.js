const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Utilities", class {
    #Block = undefined;
    #RejectCycle = true;
    #Level = 90;
    #Order = 1;

    constructor(block) {
        this.#Block = block;

        block.RejectCycle = this.#RejectCycle;
        block.Level = this.#Level;
        block.Order = this.#Order;

        Vars.Wait = this.Wait;
    }

    Wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    Run() {
        console.log("Util: ", Vars.TstString);
        console.log(Date.now())
    }
});