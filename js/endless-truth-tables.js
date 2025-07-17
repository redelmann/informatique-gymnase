function setupScrollable(parent, element, generate_row, start, row_count, end_label, total_count) {
    element.className = 'scrollable';

    row_count = Math.max(1, row_count);
    row_count = Math.min(row_count, total_count);

    start = Math.min(start, total_count - row_count);
    start = Math.max(0, start);

    const top_canary = document.createElement('div');
    top_canary.className = 'canary';
    element.appendChild(top_canary);
    top_canary.dataset.position = 'top';

    const top_canary_loading = document.createElement('div');
    top_canary_loading.className = 'loading';
    top_canary_loading.innerText = 'Chargement...';
    top_canary.appendChild(top_canary_loading);

    const content_div = document.createElement('div');
    content_div.className = 'content';
    element.appendChild(content_div);

    function populate_rows() {
        content_div.innerHTML = '';
        for (let i = 0; i < row_count; i++) {
            const row = generate_row(start + i);
            if (!row) {
                break;
            }
            row.dataset.index = start + i;
            content_div.appendChild(row);
        }
    }
    populate_rows();

    const fixed_height = content_div.scrollHeight;
    content_div.style.height = fixed_height + 'px';
    element.style.height = fixed_height + 'px';

    const bottom_canary = document.createElement('div');
    bottom_canary.className = 'canary';
    element.appendChild(bottom_canary);
    bottom_canary.dataset.position = 'bottom';

    const bottom_canary_loading = document.createElement('div');
    bottom_canary_loading.className = 'loading';
    bottom_canary_loading.innerText = 'Chargement...';
    bottom_canary.appendChild(bottom_canary_loading);

    const controls = document.createElement('div');
    controls.className = 'controls';
    parent.appendChild(controls);

    controls.appendChild(document.createTextNode('Affichage des lignes '));

    const target_width = 12 * Math.ceil(Math.log10(total_count)) + 40;

    const start_input = document.createElement('input');
    start_input.type = 'number';
    start_input.value = start;
    start_input.style.width = target_width + 'px';
    controls.appendChild(start_input);

    controls.appendChild(document.createTextNode(' à '));

    const end_input = document.createElement('input');
    end_input.type = 'number';
    end_input.value = start + row_count - 1;
    end_input.style.width = target_width + 'px';
    controls.appendChild(end_input);

    controls.appendChild(document.createTextNode(' sur un total de ' + total_count + ' interprétation' + (total_count > 1 ? 's' : '') + '.'));

    start_input.addEventListener('change', () => {
        let new_start = parseInt(start_input.value, 10);
        if (isNaN(new_start)) {
            start_input.value = start;
            return;
        }
        new_start = Math.max(0, new_start);
        new_start = Math.min(new_start, total_count - row_count);

        start_input.value = new_start;
        end_input.value = Math.min(new_start + row_count - 1, total_count - 1);

        start = new_start;
        populate_rows();
        populate_canaries();
    });

    end_input.addEventListener('change', () => {
        let new_end = parseInt(end_input.value, 10);
        if (isNaN(new_end)) {
            end_input.value = Math.min(start + row_count - 1, total_count - 1);
            return;
        }
        new_end = Math.max(row_count - 1, new_end);
        new_end = Math.min(new_end, total_count - 1);
        end_input.value = new_end;

        const new_start = new_end - row_count + 1;
        start_input.value = new_start;
        start = new_start;
        populate_rows();
        populate_canaries();
    });


    function shift_top() {
        const new_start = start - 1;
        const new_row = generate_row(new_start);
        if (!new_row) {
            return;
        }
        new_row.dataset.index = new_start;
        content_div.insertBefore(new_row, content_div.firstChild);
        start = new_start;
        content_div.lastChild.remove();

        start_input.value = start;
        end_input.value = start + row_count - 1;
    }

    function shift_bottom() {
        const new_end = start + row_count;
        const new_row = generate_row(new_end);
        if (!new_row) {
            return;
        }
        new_row.dataset.index = new_end;

        for (let i = 0; i < row_count; i++) {
            const node_a = content_div.childNodes[i];
            const node_b = i + 1 == row_count ? new_row : content_div.childNodes[i + 1];
            node_a.dataset.index = node_b.dataset.index;
            node_a.innerHTML = node_b.innerHTML;
        }
        start += 1;

        start_input.value = start;
        end_input.value = start + row_count - 1;
    }

    function populate_canaries() {
        top_canary.lastChild.remove();
        top_row = generate_row(start - 1);
        if (top_row) {
            top_row.dataset.index = start - 1;
            top_canary.appendChild(top_row);
            top_canary_loading.style.display = 'flex';
        }
        else {
            const end_div = document.createElement('div');
            end_div.className = 'end_label';
            end_div.innerText = end_label;
            top_canary.appendChild(end_div);
            top_canary_loading.style.display = 'none';
        }

        bottom_canary.lastChild.remove();
        bottom_row = generate_row(start + row_count);
        if (bottom_row) {
            bottom_row.dataset.index = start + row_count;
            bottom_canary.appendChild(bottom_row);
            bottom_canary_loading.style.display = 'flex';
        }
        else {
            const end_div = document.createElement('div');
            end_div.className = 'end_label';
            end_div.innerText = end_label;
            bottom_canary.appendChild(end_div);
            bottom_canary_loading.style.display = 'none';
        }
    }

    let timeout = null;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = (1 - entry.intersectionRatio) * 500 + 50;
                observer.unobserve(top_canary);
                observer.unobserve(bottom_canary);
                timeout = setTimeout(() => {
                    if (entry.target.dataset.position === 'top') {
                        shift_top();
                    } else {
                        shift_bottom();
                    }
                    populate_canaries();
                    timeout = null;
                    observer.observe(top_canary);
                    observer.observe(bottom_canary);
                }, delay);

                return;
            }
        });
    }, {
        root: element,
        threshold: 0.2
    });

    // Create two dummy divs to remove in a few instants.
    top_canary.appendChild(document.createElement('div'));
    bottom_canary.appendChild(document.createElement('div'));

    // The two dummy divs are immediately removed by this call.
    populate_canaries();

    observer.observe(top_canary);
    observer.observe(bottom_canary);

    element.addEventListener('scrollend', () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        element.scrollTo({
            top: top_canary.scrollHeight,
            behavior: 'smooth'
        });
        setTimeout(() => {
            observer.observe(top_canary);
            observer.observe(bottom_canary);
        }, 200);
    });
}

function populateTable(container, exprs, labels) {

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    container.classList.add('endless-truth-table');

    const table_container = document.createElement('div');
    table_container.className = 'table-container';
    container.appendChild(table_container);

    const header = document.createElement('div');
    header.className = 'header-row';
    table_container.appendChild(header);

    const lines_container = document.createElement('div');
    table_container.appendChild(lines_container);

    if (typeof exprs === 'string') {
        exprs = exprs.split(',');
    }

    for (let i = 0; i < exprs.length; i++) {
        if (typeof exprs[i] === 'string') {
            exprs[i] = logicQuestions.parse(exprs[i]);
        }
    }
    
    const allExpr = logicQuestions.ands(exprs);
    const variables = logicQuestions.freeVariables(allExpr);
    const interpretationCount = Math.pow(2, variables.length);

    document.querySelector(':root').style.setProperty('--number-of-variables', variables.length);
    document.querySelector(':root').style.setProperty('--number-of-expressions', exprs.length);

    // Header row
    for (let i = 0; i < variables.length; i++) {
        const cell = document.createElement('div');
        cell.innerText = variables[i];
        header.appendChild(cell);
    }
    if (variables.length > 0) {
        header.lastChild.classList.add('delimited');
    }
    for (let i = 0; i < exprs.length; i++) {
        const cell = document.createElement('div');
        if (labels && i < labels.length && labels[i]) {
            cell.innerText = labels[i];
        }
        else {
            cell.innerText = logicQuestions.verboseExprToString(exprs[i]);
        }
        header.appendChild(cell);
    }

    function generateRow(index) {
        if (index >= interpretationCount) {
            return null;
        }
        if (index < 0) {
            return null;
        }

        const interpretation = {};
        for (let i = 0; i < variables.length; i++) {
            interpretation[variables[i]] = Boolean(index & (1 << (variables.length - 1 - i)));
        }

        const row = document.createElement('div');
        for (let j = 0; j < variables.length; j++) {
            const cell = document.createElement('div');
            cell.innerText = interpretation[variables[j]] ? '1' : '0';
            row.appendChild(cell);
        }
        if (variables.length > 0) {
            row.lastChild.classList.add('delimited');
        }
        for (let i = 0; i < exprs.length; i++) {
            const cell = document.createElement('div');
            cell.innerText = logicQuestions.evaluate(exprs[i], interpretation) ? '1' : '0';
            row.appendChild(cell);
        }

        row.className = 'scrollable-row';
        return row;
    }

    setupScrollable(container, lines_container, generateRow, 0, 8, 'Fin des interprétations', interpretationCount);
}
