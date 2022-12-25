document.addEventListener("DOMContentLoaded", function(event) {
    const navs = document.querySelectorAll(".global-nav");
    for (let i = 0; i < navs.length; i++) {
        const nav = navs[i];
        nav.addEventListener("change", function() {
            window.location.href = nav.options[nav.selectedIndex].value;
        });
    }
});
