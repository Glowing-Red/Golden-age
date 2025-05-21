const ReBlock = global.ReBlock;
ReBlock.CreateBlock("Utilities", class Block_Utilities {
    RejectCycle = false;

    constructor() {
        
    }

    Start() {
        const Vars = global.Vars;
        Vars.SECRET_KEY = "Secret Test";
    }
});