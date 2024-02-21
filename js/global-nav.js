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
    let selector = "section > header > h2, section > h1";
    for (let i = 2; i <= 6; i++) {
        selector += ", section > h" + i;
        selector += ", .cols-2 > div > h" + i;
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

    // Setup the secondary navigation.
    const secNav = document.getElementById('sec-nav');
    const section = document.querySelector('#main-content > section');
    const headings = section.querySelectorAll('h2, h3, h4');

    let headings_count = 0;
    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        if (!heading.id) {
            continue;
        }
        headings_count++;
        const link = document.createElement('a');
        
        link.href = '#' + heading.id;
        link.textContent = heading.textContent.replace(/¶$/, '');

        // Set the class based on the heading level.
        if (heading.tagName === 'H2') {
            link.classList.add('primary');
        } else if (heading.tagName === 'H3') {
            link.classList.add('secondary');
        }
        else if (heading.tagName === 'H4') {
            link.classList.add('tertiary');
        }
        

        // Gently scroll to the header when the link is clicked.
        link.addEventListener('click', function(event) {
            event.preventDefault();
            document.getElementById(heading.id).scrollIntoView({
                behavior: 'smooth',
            });
            window.history.pushState(null, null, '#' + heading.id);
        });

        secNav.appendChild(link);
    }
    if (headings_count < 2) {
        secNav.style.display = 'none';
    }
    else {

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const is_active = entry.intersectionRatio >= 0.5;
                const link = secNav.querySelector(`a[href="#${id}"]`);
                link.classList.toggle('active', is_active);

                if (is_active) {
                    link.classList.remove('before-active');
                }
                else {
                    const top = entry.boundingClientRect.top;
                    if (top < 0) {
                        link.classList.add('before-active');
                    }
                    else {
                        link.classList.remove('before-active');
                    }
                }
            });

            let has_active = secNav.querySelector("a.active") !== null;

            if (has_active) {
                const links = secNav.querySelectorAll("a");
                let is_before = true;
                for (let i = 0; i < links.length; i++) {
                    const link = links.item(i);
                    if (link.classList.contains("active")) {
                        is_before = false;
                    }
                    link.classList.toggle("before-active", is_before);
                }
            }
        }, { threshold: [0.5] });

        headings.forEach(heading => {
            if (!heading.id) {
                return;
            }
            observer.observe(heading);
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
