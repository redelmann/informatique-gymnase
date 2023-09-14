const lq = logicQuestions;

function setUpFitch(proof, container, key) {
    console.log(key);
    if (proof === undefined) {
        proof = new lq.Proof();
    }
    const state = { proof: proof };
    const proof_div = document.createElement('div');
    const menu_div = document.createElement('div');

    makeMenu(state, proof_div, menu_div, key);

    let made_proof = false;

    if (key) {
        // On refresh, load the proof from sessionStorage
        const json = window.sessionStorage.getItem('fitch-' + key);
        console.log("JSON", json);
        if (json) {
            try {
                state.proof = lq.Proof.fromJSON(JSON.parse(json));
                proof_div.innerHTML = '';
                makeProof(state, proof_div);
                made_proof = true;
            }
            catch (e) {
                console.error(e);
            }
        }

        // On page unload, save the proof to sessionStorage
        window.addEventListener('beforeunload', function() {
            window.sessionStorage.setItem('fitch-' + key,
                JSON.stringify(state.proof.toJSON()));
        });
    }

    if (!made_proof) {
        makeProof(state, proof_div);
    }

    container.appendChild(menu_div);
    container.appendChild(proof_div);
}

async function asyncSaveToFile(string) {
    const file = await window.showSaveFilePicker({
        types: [{
            description: "Fitch",
            accept: {
                "text/plain": ['.fitch']
            }
        }]
    });
  
    const writable = await file.createWritable();
    await writable.write(string);
    await writable.close();
}
  
function defaultSaveToFile(string) {
    const blob = new Blob([string], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proof.fitch';
    a.click();
    URL.revokeObjectURL(url);
}

function makeMenu(state, proof_container, menu_container, key) {
    menu_container.classList.add('proof-menu');

    const export_button = document.createElement('a');
    export_button.innerHTML = 'Exporter';
    export_button.addEventListener('click', function() {
        const json = JSON.stringify(state.proof.toJSON(), null, 2);
        // File explorer to download the file

        if (window.showSaveFilePicker) {
            asyncSaveToFile(json);
        }
        else {
            defaultSaveToFile(json);
        }
    });
    menu_container.appendChild(export_button);

    const import_button = document.createElement('a');
    import_button.innerHTML = 'Importer';
    import_button.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.addEventListener('change', function() {
            const file = input.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', function() {
                try {
                    const json = JSON.parse(reader.result);
                    state.proof = lq.Proof.fromJSON(json);
                    proof_container.innerHTML = '';
                    makeProof(state, proof_container);
                }
                catch (e) {
                    console.error(e);
                    alert('Erreur lors de l\'importation du fichier');
                }
            });
            reader.readAsText(file);
        });
        input.click();
    });
    menu_container.appendChild(import_button);
}

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


function makeProof(state, container) {
    container.classList.add('proof-container');
    makeSeparator(state.proof, container);
    for (let i = 0; i < state.proof.parts.length; i++) {
        makePart(state.proof.parts[i], container);
        makeSeparator(state.proof, container);
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

    makeLine(subproof.assumption, parts_div, undefined, "assumption");
    makeSeparator(subproof, parts_div);
    for (let i = 0; i < subproof.parts.length; i++) {
        makePart(subproof.parts[i], parts_div);
        makeSeparator(subproof, parts_div);
    }
    makeLine(subproof.conclusion, parts_div, undefined, "conclusion");

    subproof.addListener(function() {
        range_div.innerHTML = subproof.range;
    });

    if (position === undefined || position === null || position >= container.children.length) {
        container.appendChild(div);
    }
    else {
        container.insertBefore(div, container.children[position]);
    }

    function update(event) {
        if (subproof.status.ok) {
            div.classList.remove('invalid');
            div.classList.remove('missing');
            div.classList.add('valid');
        }
        else if (subproof.status.only_missing) {
            div.classList.remove('invalid');
            div.classList.remove('valid');
            div.classList.add('missing');
        }
        else {
            div.classList.remove('valid');
            div.classList.remove('missing');
            div.classList.add('invalid');
        }
    }

    subproof.addListener(update);
    update();
}

function makeLine(line, container, position, type) {
    const is_assumption = type === "assumption";
    const is_conclusion = type === "conclusion";
    let had_expr = false;

    let last_expr = null;
    let parsed_expr = null;
    let last_rule = null;

    const div = document.createElement('div');
    if (is_assumption) {
        div.classList.add('line-assumption');
    }
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
    expr_input.placeholder =
        is_assumption ? 'Hypothèse ?' :
        is_conclusion ? 'Conclusion ?' :
        'Proposition ?';
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
        rule_div.innerHTML = '';
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
        ref_input.placeholder = '?';
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

    const delete_button = document.createElement('a');
    delete_button.innerHTML = '-';
    delete_button.classList.add('delete-button');
    delete_button.title = is_assumption ? 'Supprimer la sous-preuve' : 'Supprimer la ligne';
    delete_button.addEventListener('click', function() {
        if (is_assumption) {
            let current = div;
            while (!current.classList.contains('subproof-container')) {
                current = current.parentElement;
            }
            current.nextElementSibling.remove();
            current.remove();
            line.root.deletePart(line.parent);
        }
        else {
            div.nextElementSibling.remove();
            div.remove();
            line.root.deletePart(line);
        }
    });
    if (!line.fixed || is_assumption) {
        controls_div.appendChild(delete_button);
    }

    function update(event) {
        let root_error_found = false;

        had_expr = had_expr || line.expr !== null;

        // Expr do not match input
        if (line.expr && parsed_expr !== line.expr) {
            expr_input.value = lq.exprToString(line.expr);
            parsed_expr = line.expr;
        }

        // Expr change
        if (line.expr !== last_expr) {
            last_expr = line.expr;
            enableRules(line.expr);
        }

        div.classList.toggle('no-expr', !had_expr);

        // Select correct rule
        if (line.rule) {
            rule_select.value = lq.rules.indexOf(line.rule);
        }
        else {
            rule_select.value = '-1';
        }

        const rule = line.rule;

        // Rule change
        if (rule !== last_rule) {
            last_rule = rule;

            // Repopulate refs inputs
            refs_div.innerHTML = '';
            for (let i = 0; i < line.refs.length; i++) {
                const ref_input = makeRefInput(i);
                refs_div.appendChild(ref_input);
            }
            if (rule) {
                let k = 0;
                for (let i = 0; i < rule.parts.length; i++, k++) {
                    refs_div.children[k].classList.add('ref-part');
                }
                for (let i = 0; i < rule.subproofs.length; i++, k++) {
                    refs_div.children[k].classList.add('ref-subproof');
                }
            }
        }

        // Update refs inputs values
        for (let i = 0; i < line.refs.length; i++) {
            const ref_input = refs_div.children[i];
            if (line.refs[i]) {
                ref_input.value = line.refs[i].range;
            }
            else {
                ref_input.value = '';
            }
        }

        // Expr status
        if (line.status.expr.length > 0) {
            expr_input.classList.add('invalid');
            root_error_found = true;
        }
        else {
            expr_input.classList.remove('invalid');
        }

        // Rule status
        if (line.status.rule.length > 0) {
            rule_select.classList.add('invalid');
            root_error_found = true;
        }
        else {
            rule_select.classList.remove('invalid');
        }

        // Refs status
        for (let i = 0; i < line.status.refs.length; i++) {
            if (line.status.refs[i].length > 0) {
                refs_div.children[i].classList.add('invalid');
                root_error_found = true;
            }
            else {
                refs_div.children[i].classList.remove('invalid');
            }
        }

        if (line.expr && rule === lq.hypothesis) {
            div.classList.add('hypothesis');
        }

        // Update number
        number_div.innerHTML = line.number;
        
        if (line.status.ok) {
            div.classList.remove('invalid');
            div.classList.remove('missing');
            div.classList.add('valid');
        }
        else if (line.status.only_missing) {
            div.classList.remove('invalid');
            div.classList.remove('valid');
            div.classList.add('missing');
        }
        else {
            div.classList.remove('valid');
            div.classList.remove('missing');
            div.classList.add('invalid');
            if (!root_error_found) {
                for (let i = 0; i < refs_div.children.length; i++) {
                    refs_div.children[i].classList.add('invalid');
                }
            }
        }
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