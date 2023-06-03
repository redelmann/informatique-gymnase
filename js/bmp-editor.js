
function setup_bmp_editor(container, header_bytes, pixels_bytes, save_key) {
    let save_pixels = save_key !== undefined;

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
    }
    const editor = document.createElement("div");
    editor.classList.add("bmp-editor");
    const preview = document.createElement("div");
    preview.classList.add("bmp-preview");
    const image = document.createElement("img");
    const link = document.createElement("a");
    link.textContent = "Télécharger";
    preview.appendChild(image);
    preview.appendChild(link);
    container.appendChild(editor);
    container.appendChild(preview);

    const bytes = new Uint8Array(header_bytes.length + pixels_bytes.length);

    link.addEventListener("click", function() {
        const blob = new Blob([bytes], {type: "image/bmp"});
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "image.bmp";
    });

    for (let i = 0; i < header_bytes.length; i++) {
        bytes[i] = header_bytes[i];
    }

    for (let i = 0; i < pixels_bytes.length; i++) {
        const j = header_bytes.length + i;
    
        bytes[j] = pixels_bytes[i];
    }

    for (let i = 0; i < bytes.length; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.size = 2;
        input.maxLength = 2;
        input.value = byte_to_hex(bytes[i]);
        input.pattern = "[0-9a-fA-F]{2}";
        input.addEventListener("focus", function() {
            input.select();
        })
        input.addEventListener("input", function() {
            bytes[i] = byte_from_hex(input.value);
            update_preview();
            if (input.value.length == 2) {
                const next = input.nextElementSibling;
                if (next) {
                    next.focus();
                }
            }
        });
        input.addEventListener("blur", function() {
            input.value = byte_to_hex(bytes[i]);
            if (save_pixels) {
                sessionStorage.setItem("bmp-" + save_key + "-pixels", bytes.slice(header_bytes.length).join(","));
            }
        });
        input.addEventListener("keydown", function(event) {
            if (input.selectionStart == 0 && event.key == "ArrowLeft") {
                const previous = input.previousElementSibling;
                if (previous) {
                    console.log("previous");
                    previous.focus();
                }
                event.preventDefault();
                return false;
            }
            if (input.selectionEnd == 2 && event.key == "ArrowRight") {
                const next = input.nextElementSibling;
                if (next) {
                    console.log("next");
                    next.focus();
                }
                event.preventDefault();
                return false;
            }
        });
        if (i < header_bytes.length) {
            input.disabled = true;
        }
        editor.appendChild(input);
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