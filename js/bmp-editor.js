
function setup_bmp_editor(container, header_bytes, pixels_bytes, options) {
    options = options || {};
    const save_key = options.save_key;
    const save_pixels = save_key !== undefined;

    let palette_bytes = options.palette_bytes || 0;
    if (typeof palette_bytes === "number") {
        palette_bytes = new Array(palette_bytes * 4).fill(0xff);
    }

    if (typeof pixels_bytes === "number") {
        pixels_bytes = new Array(pixels_bytes * 3).fill(0xff);
    }
    if (save_pixels) {
        const saved_pixels = sessionStorage.getItem("bmp-" + save_key + "-pixels");
        if (saved_pixels) {
            pixels_bytes = saved_pixels.split(",").map(function(number) {
                return parseInt(number);
            });
        }
        const saved_palette = sessionStorage.getItem("bmp-" + save_key + "-palette");
        if (saved_palette) {
            palette_bytes = saved_palette.split(",").map(function(number) {
                return parseInt(number);
            });
        }
    }
    const editor = document.createElement("div");
    editor.classList.add("bmp-editor");
    const preview = document.createElement("div");
    preview.classList.add("bmp-preview");
    const image = document.createElement("img");
    const link = document.createElement("a");
    link.textContent = "Télécharger";
    const preview_container = document.createElement("div");
    preview_container.classList.add("bmp-preview-container");
    preview.appendChild(image);
    preview.appendChild(link);
    container.appendChild(editor);
    preview_container.appendChild(preview);
    container.appendChild(preview_container);

    const colorPicker = document.createElement("div");
    colorPicker.classList.add("color-picker");
    const colors = ["Bleu", "Vert", "Rouge"];

    preview.appendChild(colorPicker);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = "#000000";
    colorPicker.appendChild(colorInput);

    const values = [];

    for(let i = 0; i < 3; i++) {
        const div = document.createElement("div");
        div.classList.add("color");
        const label = document.createElement("div");
        label.classList.add("color-label");
        label.textContent = colors[i];
        const value = document.createElement("div");
        value.classList.add("color-value");
        value.textContent = "00";
        div.appendChild(label);
        div.appendChild(value);
        values.push(value);
        colorPicker.appendChild(div);
    }

    colorInput.addEventListener("input", function() {
        const color = colorInput.value;
        const red = color.substring(1, 3).toUpperCase();
        const green = color.substring(3, 5).toUpperCase();
        const blue = color.substring(5, 7).toUpperCase();
        values[0].textContent = blue;
        values[1].textContent = green;
        values[2].textContent = red;
    });


    function nextInput(input) {
        if (input.nextElementSibling) {
            return input.nextElementSibling;
        }
        let group = input.parentElement;
        while (group.nextElementSibling) {
            group = group.nextElementSibling;
            if (group.children.length > 0) {
                return group.children[0];
            }
        }
        return null;
    }

    function prevInput(input) {
        if (input.previousElementSibling) {
            return input.previousElementSibling;
        }
        let group = input.parentElement;
        while (group.previousElementSibling) {
            group = group.previousElementSibling;
            if (group.children.length > 0) {
                return group.children[group.children.length - 1];
            }
        }
        return null;
    }

    const bytes = new Uint8Array(header_bytes.length + palette_bytes.length + pixels_bytes.length);

    link.addEventListener("click", function() {
        const blob = new Blob([bytes], {type: "image/bmp"});
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "image.bmp";
    });

    for (let i = 0; i < header_bytes.length; i++) {
        bytes[i] = header_bytes[i];
    }

    for (let i = 0; i < palette_bytes.length; i++) {
        const j = header_bytes.length + i;
    
        bytes[j] = palette_bytes[i];
    }

    for (let i = 0; i < pixels_bytes.length; i++) {
        const j = header_bytes.length + palette_bytes.length + i;
    
        bytes[j] = pixels_bytes[i];
    }

    let group;

    for (let i = 0; i < bytes.length; i++) {
        if (i % 3 == 0) {
            group = document.createElement("div");
            group.classList.add("bmp-group");
            editor.appendChild(group);
        }
        const input = document.createElement("input");
        input.type = "text";
        input.size = 2;
        input.maxLength = 2;
        input.value = byte_to_hex(bytes[i]);
        input.pattern = "[0-9a-fA-F]{2}";
        input.title = "Position " + i.toString(16).toUpperCase() + " hex (" + i + " dec)";
        input.addEventListener("focus", function() {
            input.select();
        })
        input.addEventListener("input", function() {
            let value = input.value;
            while (value.length < 2) {
                value = value + "0";
            }
            bytes[i] = byte_from_hex(value);
            update_preview();
            if (input.value.length == 2) {
                let next = nextInput(input)
                while (next && next.disabled) {
                    next = nextInput(next);
                }
                if (next) {
                    next.focus();
                }
            }
        });
        input.addEventListener("blur", function() {
            input.value = byte_to_hex(bytes[i]);
            if (save_pixels) {
                sessionStorage.setItem(
                    "bmp-" + save_key + "-pixels",
                    bytes.slice(header_bytes.length + palette_bytes.length).join(","));
                sessionStorage.setItem(
                    "bmp-" + save_key + "-palette",
                    bytes.slice(header_bytes.length, header_bytes.length + palette_bytes.length).join(","));
            }
        });
        input.addEventListener("keydown", function(event) {
            if (input.selectionStart == 0 && event.key == "ArrowLeft") {
                let previous = prevInput(input);
                while (previous && previous.disabled) {
                    previous = prevInput(previous);
                }
                if (previous) {
                    previous.focus();
                }
                event.preventDefault();
                return false;
            }
            if (input.selectionEnd == 2 && event.key == "ArrowRight") {
                let next = nextInput(input);
                while (next && next.disabled) {
                    next = nextInput(next);
                }
                if (next) {
                    next.focus();
                }
                event.preventDefault();
                return false;
            }
            if (event.key == "ArrowUp" && event.altKey) {
                const value = byte_from_hex(input.value);
                let increment = event.shiftKey ? 16 : 1;
                input.value = byte_to_hex((value + increment) % 256);
                bytes[i] = byte_from_hex(input.value);
                update_preview();
                event.preventDefault();
                return false;
            }
            if (event.key == "ArrowDown" && event.altKey) {
                const value = byte_from_hex(input.value);
                let decrement = event.shiftKey ? 16 : 1;
                input.value = byte_to_hex((value + 256 - decrement) % 256);
                bytes[i] = byte_from_hex(input.value);
                update_preview();
                event.preventDefault();
                return false;
            }
            if (event.key == "ArrowUp") {
                const left = input.offsetLeft;
                let top = input.offsetTop;
                let previous = prevInput(input);
                let keep_going = true;
                while (keep_going) {
                    keep_going = false;
                    while (previous && previous.offsetTop == top) {
                        previous = prevInput(previous);
                    }
                    while (previous && previous.offsetLeft > left) {
                        previous = prevInput(previous);
                    }
                    if (previous && previous.disabled) {
                        top = previous.offsetTop;
                        keep_going = true;
                    }
                }
                if (previous) {
                    previous.focus();
                }
                event.preventDefault();
                return false;
            }
            if (event.key == "ArrowDown") {
                const left = input.offsetLeft;
                let top = input.offsetTop;
                let next = nextInput(input);
                let keep_going = true;
                while (keep_going) {
                    keep_going = false;
                    while (next && next.offsetTop == top) {
                        next = nextInput(next);
                    }
                    while (next && next.offsetLeft < left) {
                        next = nextInput(next);
                    }
                    if (next && next.disabled) {
                        top = next.offsetTop;
                        keep_going = true;
                    }
                }
                if (next) {
                    next.focus();
                }
                event.preventDefault();
                return false;
            }
            if (input.value == "" && event.key == "Backspace") {
                let previous = prevInput(input);
                while (previous && previous.disabled) {
                    previous = prevInput(previous);
                }
                if (previous) {
                    previous.focus();
                }
                else {
                    input.blur();
                }
                event.preventDefault();
                return false;
            }
        });
        if (i < header_bytes.length) {
            input.disabled = true;
        }
        if (i < header_bytes.length + palette_bytes.length) {
            const j = i - header_bytes.length;
            if (j % 4 == 3) {
                input.disabled = true;
            }
        }
        group.appendChild(input);
    }

    function byte_to_hex(byte) {
        const hex = byte.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function byte_from_hex(hex) {
        return parseInt(hex, 16) & 0xff;
    }

    function base64_data() {
        const base64 = btoa(String.fromCharCode.apply(null, bytes));
        return "data:image/bmp;base64," + base64;
    }

    function update_preview() {
        image.src = base64_data();
    }

    update_preview();
}