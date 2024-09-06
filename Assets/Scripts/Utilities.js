function FormatString(template, ...values) {
   return template.replace(/%s/g, () => values.shift());
}

function IsTable(item) {
   return Object.prototype.toString.call(item) === "[object Object]";
}

function isValidString(value) {
   return (typeof value === 'string' && value.trim() !== '' && value !== null);
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