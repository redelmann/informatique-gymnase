function setupSelfCheck(select) {
    const div = document.createElement('div');
    div.classList.add('select-wrapper');
    select.parentNode.replaceChild(div, select);
    div.appendChild(select);

    const emptyOption = document.createElement('option');
    emptyOption.text = '';
    select.prepend(emptyOption);
    select.selectedIndex = 0;

    const icon = document.createElement('i');
    icon.classList.add('fa', 'fa-question-circle');
    div.appendChild(icon);

    select.addEventListener('focus', function() {
        select.selectedIndex = 0;
        div.classList.remove('correct', 'incorrect');
        icon.classList.remove('fa-check-circle', 'fa-times-circle');
        icon.classList.add('fa-question-circle');
    });

    select.addEventListener('change', function() {
        if (select.selectedIndex <= 0) {
            return;
        }
        const selected = select.options[select.selectedIndex];
        icon.classList.remove('fa-question-circle');
        if (selected.hasAttribute('data-correct')) {
            icon.classList.add('fa-check-circle');
            div.classList.add('correct');
        }
        else {
            icon.classList.add('fa-times-circle');
            div.classList.add('incorrect');
        }
        select.blur();
    });
}

(function() {
    const elems = document.querySelectorAll('select.self-pick');
    for(let i = 0; i < elems.length; i++) {
        const select = elems[i];

        setupSelfCheck(select);
    }
})();
