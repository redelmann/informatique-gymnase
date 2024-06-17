
class KarnaughCell {
    constructor(element, interpretation) {
        this.element = element;
        this.interpretation = interpretation;
    }

    apply(fun) {
        return fun(this.element, this.interpretation);
    }
}

class KarnaughTable {
    constructor(table, variables) {
        if (typeof table === 'string') {
            table = document.getElementById(table);
        }
        this.table = table;
        this.variables = variables;
        this.cells = [];
        this.build();
    }

    build() {
        this.table.classList.add('karnaugh');

        if (this.variables.length === 2) {
            this.build2D();
        }
        else if (this.variables.length === 3) {
            this.build3D();
        }
        else if (this.variables.length === 4) {
            this.build4D();
        }
        else {
            throw new Error('Unsupported number of variables');
        }
    }

    build2D() {
        { // Top row
            const row = document.createElement('tr');
            const corner = document.createElement('td');
            corner.classList.add('empty');
            row.appendChild(corner);
            for (let i = 0; i < 2; i++) {
                const th = document.createElement('th');
                th.innerText = this.variables[0];
                if (i === 0) {
                    th.innerText = 'non ' + th.innerText;
                }
                th.classList.add('sep');
                row.appendChild(th);
            }
            this.table.appendChild(row);
        }

        for (let i = 0; i < 2; i++) {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.innerText = this.variables[1];
            if (i === 0) {
                th.innerText = 'non ' + th.innerText;
            }
            th.classList.add('sep');
            th.classList.add('vertical');
            row.appendChild(th);
            for (let j = 0; j < 2; j++) {
                const interpretation = {};
                interpretation[this.variables[0]] = j;
                interpretation[this.variables[1]] = i;
                const td = document.createElement('td');
                const cell = new KarnaughCell(td, interpretation);
                this.cells.push(cell);
                row.appendChild(td);
            }
            this.table.appendChild(row);
        }
    }

    build3D() {
        { // Top row
            const row = document.createElement('tr');
            const corner = document.createElement('td');
            corner.classList.add('empty');
            corner.rowSpan = 2;
            row.appendChild(corner);
            for (let i = 0; i < 2; i++) {
                const th = document.createElement('th');
                th.innerText = this.variables[0];
                th.colSpan = 2;
                if (i === 0) {
                    th.innerText = 'non ' + th.innerText;
                }
                row.appendChild(th);
            }
            this.table.appendChild(row);
        }

        { // Second row
            const row = document.createElement('tr');
            for (let i = 0; i < 3; i++) {
                const th = document.createElement('th');
                th.innerText = this.variables[1];
                if (i === 1) {
                    th.colSpan = 2;
                }
                else {
                    th.innerText = 'non ' + th.innerText;
                }
                th.classList.add('sep');
                row.appendChild(th);
            }
            this.table.appendChild(row);
        }

        for (let i = 0; i < 2; i++) {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.innerText = this.variables[2];
            if (i === 0) {
                th.innerText = 'non ' + th.innerText;
            }
            th.classList.add('sep');
            th.classList.add('vertical');
            row.appendChild(th);
            for (let j = 0; j < 4; j++) {
                const interpretation = {};
                interpretation[this.variables[0]] = j >= 2 ? 1 : 0;
                interpretation[this.variables[1]] = j === 1 || j === 2 ? 1 : 0;
                interpretation[this.variables[2]] = i;
                const td = document.createElement('td');
                const cell = new KarnaughCell(td, interpretation);
                this.cells.push(cell);
                row.appendChild(td);
            }
            this.table.appendChild(row);
        }
    }

    build4D() {
        { // Top row
            const row = document.createElement('tr');
            const corner = document.createElement('td');
            corner.classList.add('empty');
            corner.rowSpan = 2;
            corner.colSpan = 2;
            row.appendChild(corner);
            for (let i = 0; i < 2; i++) {
                const th = document.createElement('th');
                th.innerText = this.variables[0];
                th.colSpan = 2;
                if (i === 0) {
                    th.innerText = 'non ' + th.innerText;
                }
                row.appendChild(th);
            }
            this.table.appendChild(row);
        }

        { // Second row
            const row = document.createElement('tr');
            for (let i = 0; i < 3; i++) {
                const th = document.createElement('th');
                th.innerText = this.variables[1];
                if (i === 1) {
                    th.colSpan = 2;
                }
                else {
                    th.innerText = 'non ' + th.innerText;
                }
                th.classList.add('sep');
                row.appendChild(th);
            }
            this.table.appendChild(row);
        }

        for (let i = 0; i < 4; i++) {
            const row = document.createElement('tr');

            if (i % 2 === 0) { // First header

                const th = document.createElement('th');
                th.innerText = this.variables[2];
                if (i === 0) {
                    th.innerText = 'non ' + th.innerText;
                }
                th.rowSpan = 2;
                th.classList.add('vertical');
                row.appendChild(th);
            }

            if (i !== 2) { // Second header
                const th = document.createElement('th');
                th.innerText = this.variables[3];
                if (i === 0 || i === 3) {
                    th.innerText = 'non ' + th.innerText;
                }
                else {
                    th.rowSpan = 2;
                }
                th.classList.add('sep');
                th.classList.add('vertical');
                row.appendChild(th);
            }

            for (let j = 0; j < 4; j++) {
                const interpretation = {};
                interpretation[this.variables[0]] = j >= 2 ? 1 : 0;
                interpretation[this.variables[1]] = j === 1 || j === 2 ? 1 : 0;
                interpretation[this.variables[2]] = i >= 2 ? 1 : 0;
                interpretation[this.variables[3]] = i === 1 || i === 2 ? 1 : 0;
                const td = document.createElement('td');
                const cell = new KarnaughCell(td, interpretation);
                this.cells.push(cell);
                row.appendChild(td);
            }
            this.table.appendChild(row);
        }
    }

    forEachCell(fun) {
        this.cells.forEach(cell =>
            cell.apply((element, interpretation) => {
                fun(element, interpretation);
            }
        ));
    }

    populate(fun) {
        this.forEachCell((element, interpretation) => {
            element.innerText = fun(interpretation);
        });
    }

    display(expr) {
        if (typeof expr === 'string') {
            expr = logicQuestions.parse(expr);
        }

        this.populate(interpretation => {
            return logicQuestions.evaluate(expr, interpretation) ? '1' : '0';
        });
    }

    setClasses(fun) {
        this.cells.forEach(cell =>
            cell.apply((element, interpretation) => {
                element.className = '';
                element.classList.add(...fun(element, interpretation));
            }
        ));
    }

    highlight(expr, exprDim) {
        if (typeof expr === 'string') {
            expr = logicQuestions.parse(expr);
        }

        if (typeof exprDim === 'string') {
            exprDim = logicQuestions.parse(exprDim);
        }

        this.forEachCell((cell, interpretation) => {
            if (logicQuestions.evaluate(expr, interpretation)) {
                cell.classList.add('highlight');
                cell.classList.remove('dimmed');
            }
            else if (exprDim !== undefined && logicQuestions.evaluate(exprDim, interpretation)) {
                cell.classList.add('dimmed');
                cell.classList.remove('highlight');
            }
        });
    }

    verify(expr) {
        if (typeof expr === 'string') {
            expr = logicQuestions.parse(expr);
        }

        this.setClasses((element, interpretation) => {
            const content = element.innerText;
            const selected = logicQuestions.evaluate(expr, interpretation);
            if (selected && content === '0') {
                return ['false-positive'];
            }
            else if (!selected && content === '1') {
                return ['false-negative'];
            }
            else if (selected) {
                return ['true-positive'];
            }
            else {
                return ['true-negative'];
            }
        });
    }

    select(expr) {
        if (typeof expr === 'string') {
            expr = logicQuestions.parse(expr);
        }

        this.forEachCell((element, interpretation) => {
            const selected = logicQuestions.evaluate(expr, interpretation);
            element.classList.toggle('selected', selected);
        });
    }

    unselect() {
        this.forEachCell((element, _) => {
            element.classList.remove('selected');
        });
    }

    unhighlight() {
        this.forEachCell((element, _) => {
            element.classList.remove('highlight');
        });
    }
}