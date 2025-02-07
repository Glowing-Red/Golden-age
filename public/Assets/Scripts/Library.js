function Wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function FormatString(template, ...values) {
    return template.replace(/%s/g, () => values.shift());
}

function IsTable(item) {
    return Object.prototype.toString.call(item) === "[object Object]";
}

function IsArray(item) {
    return Array.isArray(item);
}

function IsValidString(value) {
    return (typeof value === "string" && value.trim() !== "");
}

function IsOverflow(element) {
    return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
}

function IsNumber(value) {
    if (typeof value === "number" && !isNaN(value)) {
        return true;
    }

    return false;
}

function IsBoolean(value) {
    return typeof value === "boolean";
}

function ToNumber(parameter) {
    const parsed = parseFloat(parameter);

    if (isNaN(parsed)) {
        return NaN;
    }

    return parsed;
}

function ToBoolean(param) {
    if (IsBoolean(param)) {
        return param;
    }

    if (IsValidString(param)) {
        const lowerParam = param.toLowerCase();

        if (lowerParam === "true") {
            return true;
        } else if (lowerParam === "false") {
            return;
        }
    }

    if (IsNumber(ToNumber(param))) {
        if (IsNumber(ToNumber(param)) === 1) {
            return true;
        } else if (IsNumber(ToNumber(param)) === 0) {
            return false;
        }
    }

    return false;
}

function ToString(parameter) {
    return String(parameter);
}

function GetLength(table) {
    return Object.keys(table).length;
}

function GetKeys(table) {
    return Object.keys(table);
}

function DeepCopy(obj) {
    if (!IsArray(obj) && !IsTable(obj)) {
        return obj;
    }
    
    if (IsArray(obj)) {
        return obj.map(item => DeepCopy(item));
    }
    
    const result = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = DeepCopy(obj[key]);
        }
    }

    return result;
}

function ForTable(table, callback) {
    const keys = Object.keys(table);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        callback(key, i, table[key]);
    }
}

function ForArray(array, callback) {
    if (!Array.isArray(array)) {
        throw new TypeError("Expected an array");
    }

    for (let i = 0; i < array.length; i++) {
        callback(i, array[i]);
    }
}

function PropertyConvert(property) {
    const Properties = {
        "Html": "innerHTML",
        "Text": "textContent",
        "Class": "className",
        "Style": "style",
        "Id": "id"
    }

    if (Properties[property] != null) {
        return Properties[property];
    }

    return property;
}

function Instance(instance, Properties, Parent) {
    const isElement = instance instanceof HTMLElement
    let element = isElement ? instance : undefined;

    if (IsValidString(instance) && instance.trim().startsWith("<")) {
		const placeholder = document.createElement("template");
		placeholder.innerHTML = instance.trim();
        
        element = placeholder.content.firstChild;
    } else if (IsValidString(instance)) {
		element = document.createElement(instance);
    }
    
    if (!element) {
        return null;
    }
    
    if (Properties && !(Properties instanceof HTMLElement)) {
        element = isElement ? instance : document.createElement(instance);

        for (const [key, value] of Object.entries(Properties)) {
            if (IsTable(value)) {
                for (const [key_2, value_2] of Object.entries(value)) {
                    element[PropertyConvert(key)][key_2] = value_2;
                }
            } else if (IsArray(value)) {
                if (value.every(IsValidString)) {
                    const combinedValue = value.join(" ");
    
                    element[PropertyConvert(key)] = combinedValue;
                }
            } else {
                element[PropertyConvert(key)] = value;
            }
        }
    }

    if (isElement && element.SetParent) {
        return;
    }
    
    Object.defineProperty(element, "Parent", {
        get() {
            return this._parent;
        },
        set(newParent) {
            if (this._parent) {
                this._parent.removeChild(element);
            }

            if (newParent) {
                newParent.appendChild(element);
            }

            this._parent = newParent;
        }
    });

    Object.defineProperty(element, "Id", {
        get() {
            return element.id;
        },
        set(newId) {
            element.id = newId;
        }
    });

    Object.defineProperty(element, "Style", {
        set(table) {
            if (!IsTable(table)) {
                return
            }

            for (const [key, value] of Object.entries(table)) {
                element.style[key] = value;
            }
        }
    });

    Object.defineProperty(element, "SetParent", {
        value: function (targetElement, adjacentPosition) {
            if (adjacentPosition) {
                targetElement.insertAdjacentElement(adjacentPosition, element);
            } else {
                element.Parent = targetElement;
            }
        }
    });

    Object.defineProperty(element, "RemoveProperties", {
        value: function (...properties) {
            properties.forEach(prop => {
                element.style.removeProperty(prop);
            });
        }
    });

    Object.defineProperty(element, "Destroy", {
        value: function () {
            element.remove();
        }
    });

    if (Parent) {
        element.Parent = Parent;
    } else if (Properties && (Properties instanceof HTMLElement)) {
        element.Parent = Properties;
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

function WrapText(element) {
    const originalFontSize = parseFloat(window.getComputedStyle(element).fontSize);

    function ResizeFontSize() {
        let fontSize = parseFloat(window.getComputedStyle(element).fontSize);

        while (IsOverflow(element) && fontSize > 1) {
            fontSize--;
            element.style.fontSize = fontSize + "px";
        }

        while (!IsOverflow(element) && fontSize < originalFontSize) {
            fontSize++;
            element.style.fontSize = fontSize + "px";

            if (IsOverflow(element)) {
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