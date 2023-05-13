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

    // Select all h1, h2 and h3 headers in the main content area
    // and add an anchor link to each one.
    const headers = document.querySelectorAll("main h1, main h2, main h3");
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const anchor = document.createElement("a");
        let id = header.id;
        if (!id) {
            id = slug(header.textContent);
            header.id = id;
        }
        anchor.href = "#" + id;
        anchor.classList.add("anchor-link");
        anchor.innerHTML = "<i class='fa fa-link'></i>";
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
