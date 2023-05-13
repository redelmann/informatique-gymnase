document.addEventListener("DOMContentLoaded", function(event) {
    const navs = document.querySelectorAll(".global-nav");
    for (let i = 0; i < navs.length; i++) {
        const nav = navs[i];
        nav.addEventListener("change", function() {
            window.location.href = nav.options[nav.selectedIndex].value;
        });
    }

    function slug(str) {
        return str.toLowerCase()
            .replace(/ /g, "-")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w-]+/g, "");
    }

    // Select all headers in the sections of the page
    // and add an anchor link to each one.
    let selector = "section > h1";
    for (let i = 2; i <= 6; i++) {
        selector += ", section > h" + i;
    }
    const headers = document.querySelectorAll(selector);
    const usedIds = {};
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const anchor = document.createElement("a");
        let id = header.id;
        if (!id) {
            id = slug(header.textContent);
        }
        while (usedIds[id]) {
            id = id + "-";
        }
        usedIds[id] = true;
        header.id = id;
        anchor.href = "#" + id;
        anchor.classList.add("anchor-link");
        anchor.innerHTML = "<i class='fa'>¶</i>";
        header.appendChild(anchor);

        // Highjack the click event to scroll to the header.
        anchor.addEventListener("click", function(event) {
            event.preventDefault();
            header.scrollIntoView({
                behavior: "smooth",
            });
            // Change the URL to include the hash.
            window.history.pushState(null, null, "#" + id);
        });
    }

    // Check if the URL has a hash and scroll to it.
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const elem = document.getElementById(id);
        if (elem) {
            console.log("Scrolling to #" + id)
            console.log(elem);
            elem.scrollIntoView({
                behavior: "smooth",
            });
        }
    }
});
