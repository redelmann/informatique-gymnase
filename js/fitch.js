const lq = logicQuestions;

function makeSeparator(elem, container, position) {
    const div = document.createElement('div');
    div.classList.add('separator');
    
    const addLineButton = document.createElement('a');
    addLineButton.innerHTML = 'Ajouter une ligne';
    addLineButton.addEventListener('click', function() {
        let current_position = 0;
        let position_in_container = null;
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            if (child === div) {
                position_in_container = i;
                break;
            }
            if (child.classList.contains('separator')) {
                current_position++;
            }
        }
        if (container.classList.contains('subproof-parts')) {
            current_position += 1;
        }
        if (position_in_container === null) {
            throw new Error('Separator not found in container');
        }
        const line = elem.newLine(current_position);
        makeLine(line, container, position_in_container + 1);
        makeSeparator(elem, container, position_in_container + 2);
    });
    div.appendChild(addLineButton);

    const addSubproofButton = document.createElement('a');
    addSubproofButton.innerHTML = 'Ajouter une sous-preuve';
    addSubproofButton.addEventListener('click', function() {
        let current_position = 0;
        let position_in_container = null;
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            if (child === div) {
                position_in_container = i;
                break;
            }
            if (child.classList.contains('separator')) {
                current_position++;
            }
        }
        if (container.classList.contains('subproof-parts')) {
            current_position += 1;
        }
        if (position_in_container === null) {
            throw new Error('Separator not found in container');
        }
        const subproof = elem.newSubproof(current_position);
        makeSubproof(subproof, container, position_in_container + 1);
        makeSeparator(elem, container, position_in_container + 2);
    });
    div.appendChild(addSubproofButton);

    if (position === undefined || position === null || position >= container.children.length) {
        container.appendChild(div);
    }
    else {
        container.insertBefore(div, container.children[position]);
    }
}


function makeProof(proof, container) {
    makeSeparator(proof, container);
    for (let i = 0; i < proof.parts.length; i++) {
        makePart(proof.parts[i], container);
        makeSeparator(proof, container);
    }
}

function makePart(part, container, position) {
    if (part instanceof lq.Line) {
        makeLine(part, container, position);
    }
    else {
        makeSubproof(part, container, position);
    }
}

function makeSubproof(subproof, container, position) {
    const div = document.createElement('div');
    div.classList.add('subproof-container');

    const range_div = document.createElement('div');
    range_div.classList.add('subproof-range');
    range_div.innerHTML = subproof.range;
    div.appendChild(range_div);

    const parts_div = document.createElement('div');
    parts_div.classList.add('subproof-parts');
    div.appendChild(parts_div);

    makeLine(subproof.assumption, parts_div, 0, true);
    makeSeparator(subproof, parts_div);
    for (let i = 0; i < subproof.parts.length; i++) {
        makePart(subproof.parts[i], parts_div);
        makeSeparator(subproof, parts_div);
    }
    makeLine(subproof.conclusion, parts_div);

    subproof.addListener(function() {
        range_div.innerHTML = subproof.range;
    });

    if (position === undefined || position === null || position >= container.children.length) {
        container.appendChild(div);
    }
    else {
        container.insertBefore(div, container.children[position]);
    }
}

function makeLine(line, container, position, is_assumption) {
    let last_expr = null;
    let parsed_expr = null;

    const div = document.createElement('div');
    div.classList.add('line-container');

    const number_div = document.createElement('div');
    number_div.classList.add('line-number');
    number_div.innerHTML = line.number;
    div.appendChild(number_div);

    const expr_div = document.createElement('div');
    expr_div.classList.add('line-expr');
    
    const expr_input = document.createElement('input');
    expr_input.type = 'text';
    expr_input.value = '';
    expr_input.placeholder = 'Proposition ?';
    expr_input.addEventListener('change', function() {
        try {
            parsed_expr = lq.parse(expr_input.value);
            line.setExpr(parsed_expr);
        }
        catch (e) {
            line.setExpr(null);
        }
    });
    expr_div.appendChild(expr_input);
    div.appendChild(expr_div);

    const rule_div = document.createElement('div');
    rule_div.classList.add('line-rule');
    div.appendChild(rule_div);

    const rule_select = document.createElement('select');
    rule_select.addEventListener('change', function() {
        const i = parseInt(rule_select.value);
        if (i >= 0) {
            line.setRule(lq.rules[i]);
        }
        else {
            line.setRule(null);
        }
    });
    const empty_option = document.createElement('option');
    empty_option.value = '-1';
    empty_option.innerHTML = 'Règle ?';
    rule_select.appendChild(empty_option);
    for (let i = 0; i < lq.rules.length - 1; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerHTML = lq.rules_long_names[lq.rules[i].name];
        rule_select.appendChild(option);
    }
    if (is_assumption) {
        rule_div.innerHTML = 'Hypothèse locale';
    }
    else {
        rule_div.appendChild(rule_select);
        rule_select.value = '-1';
    }

    function enableRules(expr) {
        for (let i = 1; i < rule_select.children.length; i++) {
            if (expr === null) {
                rule_select.children[i].disabled = false;
                continue;
            }
            const j = parseInt(rule_select.children[i].value);
            const rule = lq.rules[j];
            const specs = rule.parts_and_subproof_specs(expr);
            if (specs === null) {
                rule_select.children[i].disabled = true;
            }
            else {
                rule_select.children[i].disabled = false;
            }
        }
    }

    const refs_div = document.createElement('div');
    refs_div.classList.add('line-refs');
    div.appendChild(refs_div);

    function makeRefInput(i) {
        const ref_input = document.createElement('input');
        ref_input.type = 'text';
        ref_input.value = '';
        ref_input.placeholder = 'Numéro ?';
        ref_input.addEventListener('change', function() {
            const ref_key = ref_input.value;
            const part = line.root.lookupPart(ref_key);
            if (part) {
                line.setRef(i, part);
            }
            else {
                line.setRef(i, null);
            }
        });
        return ref_input;
    }

    const filler_div = document.createElement('div');
    filler_div.classList.add('line-filler');
    div.appendChild(filler_div);

    const controls_div = document.createElement('div');
    controls_div.classList.add('line-controls');
    div.appendChild(controls_div);

    if (is_assumption) {
        const corner_div = document.createElement('div');
        corner_div.classList.add('line-corner');
        controls_div.appendChild(corner_div);

        const inner_corner_div = document.createElement('div');
        corner_div.appendChild(inner_corner_div);
    }

    const delete_button = document.createElement('a');
    delete_button.innerHTML = 'Supprimer';
    delete_button.addEventListener('click', function() {
        if (is_assumption) {
            console.log('delete subproof', line.parent);
        }
        else {
            console.log('delete line', line);
        }
    });
    if (!line.fixed || is_assumption) {
        controls_div.appendChild(delete_button);
    }

    function update() {
        // if (line.status.ok) {
        //     div.style.backgroundColor = '#3f3';
        // }
        // else {
        //     div.style.backgroundColor = '#fff';
        // }

        if (line.expr === null && expr_input.value !== '') {
            expr_input.classList.add('invalid');
        }
        else {
            expr_input.classList.remove('invalid');
        }

        if (line.expr && parsed_expr !== line.expr) {
            expr_input.value = lq.exprToString(line.expr);
            parsed_expr = line.expr;
        }

        if (line.expr !== last_expr) {
            last_expr = line.expr;
            enableRules(line.expr);
        }

        if (line.rule) {
            rule_select.value = lq.rules.indexOf(line.rule);
        }
        else {
            rule_select.value = '-1';
        }

        refs_div.innerHTML = '';
        for (let i = 0; i < line.refs.length; i++) {
            const ref_input = makeRefInput(i);
            if (line.refs[i]) {
                ref_input.value = line.refs[i].range;
            }
            refs_div.appendChild(ref_input);
        }

        const rule = line.rule;

        let label_done = false;
        if (rule && line.expr) {
            const specs = rule.parts_and_subproof_specs(line.expr);
            if (specs) {
                label_done = true;
                const parts_specs = specs[0];
                const subproof_specs = specs[1];
                for (let i = 0; i < parts_specs.length; i++) {
                    const part_spec = parts_specs[i];
                    const label = lq.exprToString(part_spec);
                    refs_div.children[i].placeholder = label;
                    refs_div.children[i].title = label;
                }
                for (let i = 0; i < subproof_specs.length; i++) {
                    const j = parts_specs.length + i;
                    const subproof_spec = subproof_specs[i];
                    const assumption_spec = subproof_spec[0];
                    const conclusion_spec = subproof_spec[1];
                    const label = lq.exprToString(assumption_spec) + ' - ' + lq.exprToString(conclusion_spec);
                    refs_div.children[j].placeholder = label;
                    refs_div.children[j].title = label;
                }
            }
        }

        if (rule) {
            let k = 0;
            for (let i = 0; i < rule.parts.length; i++, k++) {
                const part = rule.parts[i];
                refs_div.children[k].classList.add('ref-part');
            }
            for (let i = 0; i < rule.subproofs.length; i++, k++) {
                const subproof = rule.subproofs[i];
                refs_div.children[k].classList.add('ref-subproof');
            }
        }
        
        if (!label_done) {
            for (let i = 0; i < refs_div.children.length; i++) {
                refs_div.children[i].placeholder = '?';
                refs_div.children[i].title = '?';
            }
        }

        number_div.innerHTML = line.number;
    }

    line.addListener(update);
    update();

    // Add to container at the right position
    if (position === undefined || position === null || position >= container.children.length) {
        container.appendChild(div);
    }
    else {
        container.insertBefore(div, container.children[position]);
    }
}