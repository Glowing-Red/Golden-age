const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock(ReBlock.GenerateName(), class {
    #Block = undefined;
    
    #Level = 100;
    #Order = 3;

    constructor(block) {
        this.#Block = block;
        
        block.Level = this.#Level;
        block.Order = this.#Order;

        Vars.Wait = this.Wait;
    }
    
    Wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    Start() {
        console.log("Run " + this.#Block.Name);
    }
});