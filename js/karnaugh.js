function makeVariableSelector(container, name, onChange) {
    container.classList.add('variable-selector');
    let state = 0;
    container.classList.add(`state-${state}`);
    const notSpan = document.createElement('span');
    notSpan.classList.add('not');
    notSpan.innerText = 'non';
    const variableSpan = document.createElement('span');
    variableSpan.innerText = name;
    container.appendChild(notSpan);
    container.appendChild(variableSpan);
    container.addEventListener('click', function (e) {
        container.classList.remove(`state-${state}`);
        state = (state + 1) % 3;
        container.classList.add(`state-${state}`);
        if (onChange) {
            onChange(state);
        }
    });
    return function() {
        return state;
    }
}

function makeCell(container, onChange) {
    container.classList.add('cell');
    let state = 0;
    container.innerText = state ? '1' : '0';
    container.classList.add(`cell-${state}`);

    container.addEventListener('click', function (e) {
        container.classList.remove(`cell-${state}`);
        state = (state + 1) % 2;
        container.innerText = state ? '1' : '0';
        container.classList.add(`cell-${state}`);
        if (onChange) {
            onChange(state);
        }
    });

    return function() {
        return state;
    }
}

function generateGrayCode(n) {
    if (n === 0) {
        return [];
    }
    if (n === 1) {
        return [[0], [1]];
    }
    const prev = generateGrayCode(n - 1);
    const result = [];
    for (let i = 0; i < prev.length; i++) {
        result.push([0].concat(prev[i]));
    }
    for (let i = prev.length - 1; i >= 0; i--) {
        result.push([1].concat(prev[i]));
    }
    return result;
}

function makeTable(container, rowVars, colVars, onChange) {
    const colInterpretations = generateGrayCode(colVars);
    const rowInterpretations = generateGrayCode(rowVars);

    const rows = [];
    container.classList.add('table');
    const header = document.createElement('tr');
    const corner = document.createElement('th');
    header.appendChild(corner);
    for (let i = 0; i < colInterpretations.length; i++) {
        const th = document.createElement('th');
        th.innerText = colInterpretations[i].join(' ');
        header.appendChild(th);
    }
    container.appendChild(header);
    for (let i = 0; i < rowInterpretations.length; i++) {
        const row = document.createElement('tr');
        const th = document.createElement('th');
        th.innerText = rowInterpretations[i].join(' ');
        row.appendChild(th);
        rows.push(makeRow(row, colInterpretations, function (interpretation, state) {
            if (onChange) {
                onChange(interpretation.concat(rowInterpretations[i]), state);
            }
        }));
        container.appendChild(row);
    }
    return function() {
        return rows.map(function (row) {
            return row();
        });
    }
}

function makeRow(container, interpretations, onChange) {
    container.classList.add('row');
    const cells = [];
    for (let i = 0; i < interpretations.length; i++) {
        const cell = document.createElement('td');
        cells.push(makeCell(cell, function (state) {
            onChange(interpretations[i], state);
        }));
        container.appendChild(cell);
    }
    return function() {
        return cells.map(cell => cell());
    }
}

function makeVarsList(container, vars) {
    container.classList.add('groups');
    const plusDiv = document.createElement('div');
    plusDiv.classList.add('plus');
    const plusSpan = document.createElement('span');
    plusSpan.innerText = '+';
    plusDiv.appendChild(plusSpan);
    container.appendChild(plusDiv);

    const rows = [];
    let row_count = 0;
    const addRow = function () {
        if (row_count > 0) {
            const orDiv = document.createElement('div');
            orDiv.classList.add('or');
            orDiv.innerText = 'ou';
            container.insertBefore(orDiv, plusDiv);
        }
        row_count += 1;
        const row = document.createElement('div');
        row.classList.add('variable-row');
        const div = document.createElement('div');
        div.classList.add('variables');

        let readRow;
        const fs = vars.map(function (variable, i) {
            if (i > 0) {
                const andSpan = document.createElement('span');
                andSpan.classList.add('and');
                andSpan.innerText = 'et';
                div.appendChild(andSpan);
            }
            const innerDiv = document.createElement('div');
            const f = makeVariableSelector(innerDiv, variable, function(value) { console.log(
                rows.indexOf(readRow), readRow(), variable, value); });
            div.appendChild(innerDiv);
            return f;
        });
        readRow = function () {
            return fs.map(f => f());
        };
        rows.push(readRow);

        row.appendChild(div);

        const minusDiv = document.createElement('div');
        minusDiv.classList.add('minus');
        minusSpan = document.createElement('span');
        minusSpan.innerText = '-';
        minusSpan.addEventListener('click', function (e) {
            // Find a sibling orDiv and remove it
            console.log(row.previousElementSibling, row.nextElementSibling);
            const orDiv = row.previousElementSibling || row.nextElementSibling;
            container.removeChild(row);
            if (orDiv !== null && orDiv.classList.contains('or')) {
                container.removeChild(orDiv);
            }
            row_count -= 1;
            // Remove readRow from rows
            let index = rows.indexOf(readRow);
            if (index > -1) {
                rows.splice(index, 1);
            }
        });
        minusDiv.appendChild(minusSpan);
        row.appendChild(minusDiv);
        container.insertBefore(row, plusDiv);
    };

    addRow();

    plusDiv.addEventListener('click', function (e) {
        addRow();
    });
}