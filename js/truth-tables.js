function populateTable(container, exprs) {

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (typeof exprs === 'string') {
        exprs = exprs.split(',');
        exprs = exprs.map(logicQuestions.parse);
    }
    
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
            th.innerText = logicQuestions.verboseExprToString(exprs[i]);
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
