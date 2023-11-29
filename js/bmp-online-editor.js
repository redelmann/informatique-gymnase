
function setup_bmp_online_editor(container, name, zone) {

    const request = new XMLHttpRequest();
    request.open("GET", "bmp-server/peek.php?img=" + encodeURIComponent(name) + "&zone=" + encodeURIComponent(zone));
    request.responseType = "json";
    request.addEventListener("load", function() {
        if (request.status == 200) {
            const response = request.response;
            const base64 = response.image;
            const data = atob(base64);
            const bytes = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                bytes[i] = data.charCodeAt(i);
            }
            const last_update = response.timestamp;
            const ranges = response.ranges;
            setup_bmp_editor(container, name, bytes, zone, ranges, last_update);
        }
    });
    request.send();
}

function setup_bmp_editor(container, name, bytes, zone, ranges, last_update) {
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

    function in_range(needle) {
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            if (needle >= range[0] && needle <= range[1]) {
                return true;
            }
        }
        return false;
    }

    let focused_index = null;
    let writes_pending = 0;

    link.addEventListener("click", function() {
        const blob = new Blob([bytes], {type: "image/bmp"});
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "image.bmp";
    });
    const inputs = [];
    for (let i = 0; i < bytes.length; i++) {
        const input = document.createElement("input");
        inputs.push(input);
        input.type = "text";
        input.size = 2;
        input.maxLength = 2;
        input.value = byte_to_hex(bytes[i]);
        input.pattern = "[0-9a-fA-F]{2}";
        input.title = "Position " + i.toString(16).toUpperCase() + " hex (" + i + " dec)";
        input.addEventListener("focus", function() {
            input.select();
            focused_index = i;
        })
        input.addEventListener("input", function() {
            let value = input.value;
            while (value.length < 2) {
                value = value + "0";
            }
            bytes[i] = byte_from_hex(value);
            send_write(i, bytes[i]);
            update_preview();
            if (input.value.length == 2) {
                let next = input.nextElementSibling;
                while (next && next.disabled) {
                    next = next.nextElementSibling;
                }
                if (next) {
                    next.focus();
                }
            }
        });
        input.addEventListener("blur", function() {
            input.value = byte_to_hex(bytes[i]);
            focused_index = null;
        });
        input.addEventListener("keydown", function(event) {
            if (input.selectionStart == 0 && event.key == "ArrowLeft") {
                let previous = input.previousElementSibling;
                while (previous && previous.disabled) {
                    previous = previous.previousElementSibling;
                }
                if (previous) {
                    previous.focus();
                }
                event.preventDefault();
                return false;
            }
            if (input.selectionEnd == 2 && event.key == "ArrowRight") {
                let next = input.nextElementSibling;
                while (next && next.disabled) {
                    next = next.nextElementSibling;
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
                send_write(i, bytes[i]);
                update_preview();
                event.preventDefault();
                return false;
            }
            if (event.key == "ArrowDown" && event.altKey) {
                const value = byte_from_hex(input.value);
                let decrement = event.shiftKey ? 16 : 1;
                input.value = byte_to_hex((value + 256 - decrement) % 256);
                bytes[i] = byte_from_hex(input.value);
                send_write(i, bytes[i]);
                update_preview();
                event.preventDefault();
                return false;
            }
            if (event.key == "ArrowUp") {
                const left = input.offsetLeft;
                let top = input.offsetTop;
                let previous = input.previousElementSibling;
                let keep_going = true;
                while (keep_going) {
                    keep_going = false;
                    while (previous && previous.offsetTop == top) {
                        previous = previous.previousElementSibling;
                    }
                    while (previous && previous.offsetLeft > left) {
                        previous = previous.previousElementSibling;
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
                let next = input.nextElementSibling;
                let keep_going = true;
                while (keep_going) {
                    keep_going = false;
                    while (next && next.offsetTop == top) {
                        next = next.nextElementSibling;
                    }
                    while (next && next.offsetLeft < left) {
                        next = next.nextElementSibling;
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
                let previous = input.previousElementSibling;
                while (previous && previous.disabled) {
                    previous = previous.previousElementSibling;
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
        if (!in_range(i)) {
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
        console.log("update_preview");
        image.src = base64_data();
    }

    function update_editor() {
        console.log("update_editor");
        for (let i = 0; i < bytes.length; i++) {
            if (focused_index !== null && i == focused_index) {
                continue;
            }
            inputs[i].value = byte_to_hex(bytes[i]);
        }
    }

    function fetch_pixels() {
        const request = new XMLHttpRequest();
        request.open("GET", "bmp-server/peek.php?img=" + encodeURIComponent(name) + "&zone=" + encodeURIComponent(zone));
        request.responseType = "json";
        request.addEventListener("load", function() {
            if (writes_pending > 0) {
                return;
            }
            if (request.status == 200) {
                const response = request.response;
                console.log(response);
                const base64 = response.image;
                const timestamp = response.timestamp;
                if (timestamp < last_update) {
                    return;
                }
                last_update = timestamp;
                const data = atob(base64);
                for (let i = 0; i < data.length; i++) {
                    bytes[i] = data.charCodeAt(i);
                }
                update_preview();
                update_editor();
            }
        });
        request.send();
    }

    function send_write(index, value) {
        writes_pending++;
        const request = new XMLHttpRequest();
        request.open("POST", "bmp-server/write.php");
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.responseType = "json";
        request.addEventListener("load", function() {
            if (request.status == 200) {
                const response = request.response;
                console.log(response);
            }
            writes_pending--;
        });
        request.send(
            "img=" + encodeURIComponent(name) +
            "&index=" + index +
            "&value=" + value +
            "&zone=" + encodeURIComponent(zone));
    }

    setInterval(fetch_pixels, 1000);

    update_preview();
}