async function Init() {
   try {
      const header = document.body.querySelector("header");
      
      if (header) {
         document.documentElement.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);   
      }
   } finally {
      console.log("Init done");
   }
};

Init();