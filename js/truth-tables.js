function populateTable(container, exprs, labels) {

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (typeof exprs === 'string') {
        exprs = exprs.split(',');
    }

    for (let i = 0; i < exprs.length; i++) {
        if (typeof exprs[i] === 'string') {
            exprs[i] = logicQuestions.parse(exprs[i]);
        }
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('truth-table-container');
    container.parentNode.replaceChild(wrapper, container);
    wrapper.appendChild(container);
    
    const allExpr = logicQuestions.ands(exprs);
    const variables = logicQuestions.freeVariables(allExpr);
    const interpretations = logicQuestions.interpretations(variables);

    // Top row
    {
        const tr = document.createElement('tr');
        for (let i = 0; i < variables.length; i++) {
            const th = document.createElement('th');
            th.innerText = variables[i];
            tr.appendChild(th);
        }
        for (let i = 0; i < exprs.length; i++) {
            const th = document.createElement('th');
            if (labels && i < labels.length) {
                th.innerText = labels[i];
            }
            else {
                th.innerText = logicQuestions.verboseExprToString(exprs[i]);
            }
            if (i === 0) {
                th.classList.add('delimited');
            }
            tr.appendChild(th);
        }
        container.appendChild(tr);
    }

    // Interpretations
    for (let i = 0; i < interpretations.length; i++) {
        const tr = document.createElement('tr');
        const interpretation = interpretations[i];
        for (let j = 0; j < variables.length; j++) {
            const td = document.createElement('td');
            td.innerText = interpretation[variables[j]] ? '1' : '0';
            tr.appendChild(td);
        }
        for (let i = 0; i < exprs.length; i++) {
            const td = document.createElement('td');
            td.innerText = logicQuestions.evaluate(exprs[i], interpretation) ? '1' : '0';
            if (i === 0) {
                td.classList.add('delimited');
            }
            tr.appendChild(td);
        }
        container.appendChild(tr);
    }
}
