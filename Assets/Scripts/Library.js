function FormatString(template, ...values) {
   return template.replace(/%s/g, () => values.shift());
}

function IsTable(item) {
   return Object.prototype.toString.call(item) === "[object Object]";
}

function isValidString(value) {
   return (typeof value === 'string' && value.trim() !== '');
}

function isOverflow(element) {
   return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
}

function GetLength(table) {
   return Object.entries(table).length;
}

function PropertyConvert(property) {
   const Properties = {
      "Html": "innerHTML",
      "Text": "textContent",
      "Class": "className",
      "Style": "style"
   }
   
   if (Properties[property] != null) {
      return Properties[property];
   }
   
   return null;
}

function Instance(Instance, Properties, Parent) {
   const element = document.createElement(Instance);
   
   for (const [key, value] of Object.entries(Properties)) {
      if (PropertyConvert(key)) {
         if (IsTable(value)) {
            for (const [key_2, value_2] of Object.entries(value)) {
               element[PropertyConvert(key)][key_2] = value_2;
            }
         } else {
            element[PropertyConvert(key)] = value;
         }
      }
   }
   
   Object.defineProperty(element, "Parent", {
      get() {
         return this._parent;
      },
      set(newParent) {
         if (this._parent) {
            this._parent.removeChild(this);
         }

         if (newParent) {
            newParent.appendChild(this);
         }
         
         this._parent = newParent;
      }
   });
   
   if (Parent) {
      element.Parent = Parent
   }
   
   return element;
}

function WrapText(element) {
   const originalFontSize = parseFloat(window.getComputedStyle(element).fontSize);
   
   function ResizeFontSize() {
      let fontSize = parseFloat(window.getComputedStyle(element).fontSize);
      
      while (isOverflow(element) && fontSize > 1) {
         fontSize--;
         element.style.fontSize = fontSize + "px";
      }
      
      while (!isOverflow(element) && fontSize < originalFontSize) {
         fontSize++;
         element.style.fontSize = fontSize + "px";
         
         if (isOverflow(element)) {
            fontSize--;
            element.style.fontSize = fontSize + "px";
            
            return;
         }
       }
   }
   
   ResizeFontSize();
   
   const observer = new ResizeObserver(() => {
      ResizeFontSize();
   });
   
   observer.observe(element);
}