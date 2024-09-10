async function Init() {
   try {
      const header = document.body.querySelector("header");
      
      if (header) {
         document.documentElement.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);   
      }
      
      
   } catch (error) {
      console.error("Initialization error:", error);
   } finally {
      console.log("Init");
   }
};

function applyTextWrapToAll() {
   const elements = document.querySelectorAll('.Text-Wrap');
   
   elements.forEach(WrapText);
}

Init();

window.onload = applyTextWrapToAll;