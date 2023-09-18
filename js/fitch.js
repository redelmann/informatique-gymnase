const lq = logicQuestions;

function setUpFitch(proof, container, settings) {
    if (!settings) {
        settings = {};
    }
    if (settings.menu === undefined) {
        settings.menu = true;
    }
    if (settings.static === undefined) {
        settings.static = false;
    }
    if (settings.rules === undefined) {
        settings.rules = [
            { type: "rule", name: "Hypothèse", rule: lq.hypothesis },
            { type: "rule", name: "Répétition", rule: lq.rep },
            { type: "group", name: "Constantes", rules: [
                { type: "rule", name: "Introduction de vrai", rule: lq.trueI },
                { type: "rule", name: "Élimination de faux", rule: lq.falseE },
            ]},
            { type: "group", name: "Négation (non)", rules: [
                { type: "rule", name: "Introduction de non", rule: lq.notI },
                { type: "rule", name: "Élimination de non", rule: lq.notE },
            ]},
            { type: "group", name: "Conjonction (et)", rules: [
                { type: "rule", name: "Introduction de et", rule: lq.andI },
                { type: "rule", name: "Élimination gauche de et", rule: lq.andE1 },
                { type: "rule", name: "Élimination droite de et", rule: lq.andE2 },
            ]},
            { type: "group", name: "Disjonction (ou)", rules: [
                { type: "rule", name: "Introduction gauche de ou", rule: lq.orI1 },
                { type: "rule", name: "Introduction droite de ou", rule: lq.orI2 },
                { type: "rule", name: "Élimination de ou", rule: lq.orE },
            ]},
            { type: "group", name: "Implication (implique)", rules: [
                { type: "rule", name: "Introduction de implique", rule: lq.implI },
                { type: "rule", name: "Élimination de implique", rule: lq.implE },
            ]},
            { type: "group", name: "Équivalence (ssi)", rules: [
                { type: "rule", name: "Introduction de ssi", rule: lq.iffI },
                { type: "rule", name: "Élimination gauche de ssi", rule: lq.iffE1 },
                { type: "rule", name: "Élimination droite de ssi", rule: lq.iffE2 },
            ]},
            { type: "group", name: "Autres", rules: [
                { type: "rule", name: "Tiers exclu", rule: lq.tnd },
                { type: "rule", name: "Raisonnement par l'absurde", rule: lq.raa },
                { type: "rule", name: "Élimination de la double négation", rule: lq.notNotE },
            ]},
        ];
    }

    if (proof === undefined) {
        proof = new lq.Proof();
    }
    const state = { proof: proof };
    const proof_div = document.createElement('div');
    const menu_div = document.createElement('div');

    if (settings.menu) {
        makeMenu(state, proof_div, menu_div, settings);
    }

    let made_proof = false;

    if (settings && settings.key) {
        const key = settings.key;

        // On refresh, load the proof from sessionStorage
        const json = window.sessionStorage.getItem('fitch-' + key);
        console.log("JSON", json);
        if (json) {
            try {
                state.proof = lq.Proof.fromJSON(JSON.parse(json));
                proof_div.innerHTML = '';
                makeProof(state, proof_div, settings);
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
        makeProof(state, proof_div, settings);
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

function makeMenu(state, proof_container, menu_container, settings) {
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
                    makeProof(state, proof_container, settings);
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

function makeSeparator(elem, container, position, settings) {
    if (settings.static) {
        const spacer = document.createElement('div');
        spacer.classList.add('spacer');
        if (position === undefined || position === null || position >= container.children.length) {
            container.appendChild(spacer);
        }
        else {
            container.insertBefore(spacer, container.children[position]);
        }
        return;
    }
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
        makeLine(line, container, position_in_container + 1, "normal", settings);
        makeSeparator(elem, container, position_in_container + 2, settings);
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
        makeSubproof(subproof, container, position_in_container + 1, settings);
        makeSeparator(elem, container, position_in_container + 2, settings);
    });
    div.appendChild(addSubproofButton);

    if (position === undefined || position === null || position >= container.children.length) {
        container.appendChild(div);
    }
    else {
        container.insertBefore(div, container.children[position]);
    }
}


function makeProof(state, container, settings) {
    container.classList.add('proof-container');
    makeSeparator(state.proof, container, undefined, settings);
    for (let i = 0; i < state.proof.parts.length; i++) {
        makePart(state.proof.parts[i], container, undefined, settings);
        makeSeparator(state.proof, container, undefined, settings);
    }
}

function makePart(part, container, position, settings) {
    if (part instanceof lq.Line) {
        makeLine(part, container, position, "normal", settings);
    }
    else {
        makeSubproof(part, container, position, settings);
    }
}

function makeSubproof(subproof, container, position, settings) {
    const div = document.createElement('div');
    div.classList.add('subproof-container');

    const range_div = document.createElement('div');
    range_div.classList.add('subproof-range');
    range_div.innerHTML = subproof.range;
    div.appendChild(range_div);

    const parts_div = document.createElement('div');
    parts_div.classList.add('subproof-parts');
    div.appendChild(parts_div);

    makeLine(subproof.assumption, parts_div, undefined, "assumption", settings);
    makeSeparator(subproof, parts_div, undefined, settings);
    for (let i = 0; i < subproof.parts.length; i++) {
        makePart(subproof.parts[i], parts_div, undefined, settings);
        makeSeparator(subproof, parts_div, undefined, settings);
    }
    makeLine(subproof.conclusion, parts_div, undefined, "conclusion", settings);

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
        if (subproof.status.transitively_ok) {
            div.classList.remove('ok');
            div.classList.remove('invalid');
            div.classList.remove('missing');
            div.classList.add('valid');
        }
        else if (subproof.status.ok) {
            div.classList.remove('invalid');
            div.classList.remove('missing');
            div.classList.remove('valid');
            div.classList.add('ok');
        }
        else if (subproof.status.only_missing) {
            div.classList.remove('ok');
            div.classList.remove('invalid');
            div.classList.remove('valid');
            div.classList.add('missing');
        }
        else {
            div.classList.remove('ok');
            div.classList.remove('valid');
            div.classList.remove('missing');
            div.classList.add('invalid');
        }
    }

    subproof.addListener(update);
    update();
}

function makeLine(line, container, position, type, settings) {
    const is_assumption = type === "assumption";
    const is_conclusion = type === "conclusion";
    let had_expr = false;

    let last_expr = null;
    let last_rule = null;

    const wrapper = document.createElement('div');
    wrapper.classList.add('line-wrapper');

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
    if (settings.static) {
        expr_input.disabled = true;
    }
    expr_input.addEventListener('change', function() {
        if (expr_input.value.length === 0) {
            line.setExpr(null);
        }
        else {
            try {
                const parsed_expr = lq.parse(expr_input.value);
                line.setExpr(parsed_expr);
            }
            catch (e) {
                line.setMalformedExpr();
            }
        }
        if (line.status.expr.length > 0) {
            exprTooltip();
        }
        else {
            closeInfo();
        }
    });
    expr_div.appendChild(expr_input);
    div.appendChild(expr_div);

    const rule_div = document.createElement('div');
    rule_div.classList.add('line-rule');
    div.appendChild(rule_div);

    const rule_select = document.createElement('select');
    rule_select.addEventListener('change', function() {
        const selected_name = rule_select.value;
        const selected_rule = lq.rules_by_name[selected_name];
        if (selected_rule) {
            line.setRule(selected_rule);
        }
        else {
            line.setRule(null);
        }

        if (line.status.rule.length > 0) {
            ruleTooltip();
        }
        else {
            closeInfo();
        }
    });
    if (settings.static) {
        rule_select.disabled = true;
    }
    const empty_option = document.createElement('option');
    empty_option.value = '';
    empty_option.innerHTML = 'Règle ?';
    rule_select.appendChild(empty_option);
    for (let i = 0; i < settings.rules.length; i++) {
        const rules = [];
        let parent_elem = rule_select;

        if (settings.rules[i].type === "group") {
            parent_elem = document.createElement('optgroup');
            parent_elem.label = settings.rules[i].name;
            rule_select.appendChild(parent_elem);
            rules.push(...settings.rules[i].rules);
        }
        else if (settings.rules[i].type === "rule") {
            rules.push(settings.rules[i]);
        }
        console.log(rules);
        for (let j = 0; j < rules.length; j++) {
            const option = document.createElement('option');
            option.value = rules[j].rule.name;
            option.innerHTML = rules[j].name;
            parent_elem.appendChild(option);
        }
    }
    if (is_assumption) {
        rule_div.innerHTML = 'Hypothèse provisoire';
    }
    else {
        rule_div.appendChild(rule_select);
        rule_select.value = '';
    }

    function enableRules(expr) {
        const options = rule_select.querySelectorAll('option');
        for (let i = 0; i < options.length; i++) {
            if (expr === null) {
                options[i].disabled = false;
                continue;
            }
            const rule_name = options[i].value;
            const rule = lq.rules_by_name[rule_name];
            if (!rule) {
                continue;
            }
            const specs = rule.parts_and_subproof_specs(expr);
            if (specs === null) {
                options[i].disabled = true;
            }
            else {
                options[i].disabled = false;
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
            if (line.status.refs[i].length > 0) {
                refTooltip(i);
            }
            else {
                closeInfo();
            }
        });
        if (settings.static) {
            ref_input.disabled = true;
        }
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
            wrapper.nextElementSibling.remove(); // Separator
            wrapper.remove();
            line.root.deletePart(line);
        }
    });
    if (!settings.static && (!line.fixed || is_assumption)) {
        controls_div.appendChild(delete_button);
    }

    function update(event) {
        let root_error_found = false;
        console.log(line.number, event, line.status);

        had_expr = had_expr || line.expr !== null;

        // Expr display
        if (line.expr) {
            expr_input.value = lq.verboseExprToString(line.expr);
        }

        // Expr change
        if (line.expr !== last_expr) {
            last_expr = line.expr;
            enableRules(line.expr);
        }

        div.classList.toggle('no-expr', !had_expr);

        // Select correct rule
        if (line.rule) {
            rule_select.value = line.rule.name;
        }
        else {
            rule_select.value = '';
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

            // Add tooltips
            for (let i = 0; i < refs_div.children.length; i++) {
                refs_div.children[i].addEventListener('focus', function() {
                    refTooltip(i);
                });
                refs_div.children[i].addEventListener('blur', closeInfo);
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
        else {
            div.classList.remove('hypothesis');
        }

        // Update number
        number_div.innerHTML = line.number;

        console.log("???", line.number, line.status);
        
        if (line.status.transitively_ok) {
            div.classList.remove('ok');
            div.classList.remove('invalid');
            div.classList.remove('missing');
            div.classList.add('valid');
        }
        else if (line.status.ok) {
            div.classList.remove('invalid');
            div.classList.remove('missing');
            div.classList.remove('valid');
            div.classList.add('ok');
        }
        else if (line.status.only_missing) {
            div.classList.remove('ok');
            div.classList.remove('invalid');
            div.classList.remove('valid');
            div.classList.add('missing');
        }
        else {
            div.classList.remove('ok');
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

    // Info window
    const info_div = document.createElement('div');
    info_div.classList.add('line-info');

    const cursor_div = document.createElement('div');
    cursor_div.classList.add('info-cursor');
    info_div.appendChild(cursor_div);

    const message_div = document.createElement('div');
    message_div.classList.add('info-message');
    info_div.appendChild(message_div);

    function openInfo() {
        info_div.classList.add('open');
    }

    function positionInfo(element) {
        
        let x = 0;
        let currentElement = element;
        while (!currentElement.classList.contains('line-wrapper')) {
            x += currentElement.offsetLeft;
            currentElement = currentElement.offsetParent;
        }
        info_div.style.left = '0px';
        let line_width = div.getBoundingClientRect().width;
        let element_width = element.getBoundingClientRect().width;
        let info_width = info_div.getBoundingClientRect().width;

        console.log("line_width", line_width);
        console.log("element_width", element_width);
        console.log("info_width", info_width);
        console.log("x", x);

        let center = x + element_width / 2;
        let left = center - info_width / 2;

        if (left + info_width > line_width - 12) {
            left = line_width - 12 - info_width;
        }

        if (left < 0) {
            left = 0;
        }

        cursor_div.style.left = (center - left - 16) + 'px';
        info_div.style.left = left + 'px';
    }

    function displayInfo(message, element) {
        openInfo();
        message_div.innerHTML = message;
        positionInfo(element);
    }

    function closeInfo() {
        info_div.classList.remove('open');
    }

    // Expr tooltip
    function exprTooltip() {
        let message = '';
        if (is_assumption) {
            message += 'Entrez une hypothèse provisoire.';
        }
        else {
            message += 'Entrez une proposition.';
        }
        if (line.status.expr.includes("malformed")) {
            message += '<br /><span class="error">La proposition mal formée.</span>';
        }
        displayInfo(message, expr_input);
    }
    expr_input.addEventListener('focus', exprTooltip);
    expr_input.addEventListener('blur', closeInfo);

    // Rule tooltip
    function ruleTooltip() {
        let message = 'Choisissez une règle pour justifier cette proposition.';
        if (line.status.rule.length > 0 &&
            !(line.status.rule.length == 1 && line.status.rule[0] === "missing")) {
  
            message += '<br /><span class="error">La règle choisie est inapplicable sur la proposition donnée. ';
            message += 'La règle doit être appliquée sur une proposition de la forme ';
            message += '<code>' + lq.verboseExprToString(line.rule.expr) + '</code>';

            const meta_vars = lq.collectMetaVariables(line.rule.expr);
            if (meta_vars.length > 1) {
                message += ', où <code>?' + meta_vars.join('</code>, <code>?') +
                    '</code> sont des propositions arbitraires.';  
            }
            else if (meta_vars.length > 0) {
                message += ', où <code>?' + meta_vars[0] + '</code> est une proposition arbitraire.';
            }
            else {
                message += '.';
            }

            message += '</span>';
        }

        displayInfo(message, rule_select);
    }
    rule_select.addEventListener('focus', ruleTooltip);
    rule_select.addEventListener('blur', closeInfo);

    // Refs tooltip
    function refTooltip(i) {
        const is_part = i < line.rule.parts.length;
        let meta_vars = [];
        let message = '';
        let specs = null;
        if (line.expr !== null) {
            specs = line.rule.parts_and_subproof_specs(line.expr);
        }
        if (is_part) {
            const part = line.rule.parts[i];
            const spec = specs ? specs[0][i] : null;
            const most_precise = spec ? spec : part;
            message += 'Entrez le numéro d\'une ligne montrant <code>' +
                lq.verboseExprToString(most_precise) + '</code>';

            meta_vars = lq.collectMetaVariables(most_precise);
        }
        else {
            let j = i - line.rule.parts.length;
            const subproof = line.rule.subproofs[j];
            const assumption = subproof[0];
            const conclusion = subproof[1];
            const spec = specs ? specs[1][j] : null;
            const assumption_spec = spec ? spec[0] : null;
            const conclusion_spec = spec ? spec[1] : null;
            const most_precise_assumption = assumption_spec ? assumption_spec : assumption;
            const most_precise_conclusion = conclusion_spec ? conclusion_spec : conclusion;
            message += 'Entrez les numéros d\'une sous-preuve ayant <code>' +
                lq.verboseExprToString(most_precise_assumption) +
                '</code> comme hypothèse provisoire et <code>' +
                lq.verboseExprToString(most_precise_conclusion) +
                '</code> comme conclusion';

            meta_vars = Array.from(new Set([
                ...lq.collectMetaVariables(most_precise_assumption),
                ...lq.collectMetaVariables(most_precise_conclusion)
            ])).sort();
        }

        if (meta_vars.length > 1) {
            message += ', où <code>?' + meta_vars.join('</code>, <code>?') +
                '</code> sont des propositions arbitraires.';  
        }
        else if (meta_vars.length > 0) {
            message += ', où <code>?' + meta_vars[0] + '</code> est une proposition arbitraire.';
        }
        else {
            message += '.';
        }

        if (line.status.refs[i].includes("unreachable")) {
            message += '<br /><span class="error">La référence inatteignable.</span>';
        }

        if (line.status.refs[i].includes("wrong_type")) {
            if (is_part) {
                message += '<br /><span class="error">Indiquez un numéro de ligne, pas une sous-preuve.</span>';
            }
            else {
                message += '<br /><span class="error">Indiquez les numéros d\'une sous-preuve, pas une ligne.</span>';
            }
        }

        if (line.status.refs[i].includes("missing_expr")) {
            message += '<br /><span class="error">La ligne indiquée n\'a pas de proposition.</span>';
        }

        if (line.status.refs[i].includes("missing_assumption")) {
            message += '<br /><span class="error">La sous-preuve indiquée n\'a pas d\'hypothèse provisoire.</span>';
        }

        if (line.status.refs[i].includes("missing_conclusion")) {
            message += '<br /><span class="error">La sous-preuve indiquée n\'a pas de conclusion.</span>';
        }

        if (line.status.refs[i].includes("wrong_expr")) {
            message += '<br /><span class="error">La proposition de la ligne indiquée ne correspond pas.</span>';
        }

        if (line.status.refs[i].includes("wrong_assumption")) {
            message += '<br /><span class="error">L\'hypothèse provisoire de la sous-preuve indiquée ne correspond pas.</span>';
        }

        if (line.status.refs[i].includes("wrong_conclusion")) {
            message += '<br /><span class="error">La conclusion de la sous-preuve indiquée ne correspond pas.</span>';
        }

        let root_error_found =
            line.status.ok ||
            line.status.expr.length > 0 ||
            line.status.rule.length > 0;
        if (!root_error_found) {
            for (let j = 0; j < line.status.refs.length; j++) {
                if (line.status.refs[j].length > 0) {
                    root_error_found = true;
                    break;
                }
            }
        }

        if (!root_error_found) {
            message += '<br /><span class="error">Les propositions arbitraires ne sont pas cohérentes entre les différentes références.</span>';
        }

        displayInfo(message, refs_div.children[i]);
    }

    wrapper.appendChild(div);
    wrapper.appendChild(info_div);

    // Add to container at the right position
    if (position === undefined || position === null || position >= container.children.length) {
        container.appendChild(wrapper);
    }
    else {
        container.insertBefore(wrapper, container.children[position]);
    }
}