function displayExprTree(container, expr, interpretation) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (typeof expr === 'string') {
        expr = logicQuestions.parse(expr);
    }

    const tree = d3.tree().nodeSize([75, 60]);
    const root = d3.hierarchy(expr, children);

    root.descendants().forEach(function(d, i) {
        d.id = i;
        if (interpretation) {
            d.data.value = logicQuestions.evaluate(d.data, interpretation);
        }
        d._evaled = false;
    });

    tree(root);

    const svg = d3.select(container)
        .append('svg')
        .attr('class', 'expr-tree');
    
    const g = svg.append('g');

    function update() {
        const link = g.selectAll('line')
            .data(root.links(), function(d) { return d.target.id; })
            .join('line')
            .attr('x1', function(d) {return d.source.x;})
            .attr('y1', function(d) {return d.source.y;})
            .attr('x2', function(d) {return d.target.x;})
            .attr('y2', function(d) {return d.target.y;});
        
        const circle = g.selectAll('circle')
            .data(root.descendants(), function(d) { return d.id; })
            .join('circle')
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })
            .attr('r', 25);
        
        const text = g.selectAll('text.label')
            .data(root.descendants(), function(d) { return d.id; });
        
        const textEnter = text.enter().append('text').classed('label', true);

        const textUpdate = text.merge(textEnter)
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .text(function(d) {
                    if (d._evaled) {
                        return d.data.value ? '1' : '0';
                    }
                    return label(d.data);
                });
        
        text.exit().transition().duration(400).remove()
            .attr('x', function(d) { return d.parent.x; })
            .attr('y', function(d) { return d.parent.y; });
    
        if (interpretation) {
            textUpdate.style('cursor', 'pointer')
                .on('click', function(e, d) {
                    let childrenEvaluated = true;
                    if (d.children) {
                        for (const child of d.children) {
                            if (!child._evaled) {
                                childrenEvaluated = false;
                                break;
                            }
                        }
                    }
                    if (childrenEvaluated) {
                        if (d.children) {
                            d.children = null;
                            update();
                            setTimeout(function() {
                                d._evaled = true;
                                update();
                            }, 500);
                        }
                        else {
                            d._evaled = true;
                            update();
                        }
                    }
                    else {
                        console.log("not evaled", d);
                    }
                });
        }
    }

    update();

    const bbox = g.node().getBBox();
    g.attr('transform', 'translate(' + (-bbox.x) + ', ' + (-bbox.y) + ')');
    svg.attr('width', bbox.width);
    svg.attr('height', bbox.height);
}

function height(expr) {
    let result = 0;
    for (const child of children(expr)) {
        result = Math.max(result, height(child) + 1);
    }
    return result;
}

function width(expr) {
    let result = 0;
    for (const child of children(expr)) {
        result += width(child);
    }
    return Math.max(result, 1);
}

function label(expr) {
    if (expr.kind === 'Variable') {
        if (expr.name.length > 4) {
            return expr.name.slice(0, 3) + '…';
        }
        return expr.name;
    }
    if (expr.kind === 'Constant') {
        return expr.value ? 'vrai' : 'faux';
    }

    const ops = {
        'And': 'et',
        'Or': 'ou',
        'Not': 'non',
        'Implies': 'implique',
        'Iff': 'ssi',
        'Xor': 'ou-x',
        'Nand': 'non-et',
        'Nor': 'non-ou',
    };

    return ops[expr.kind];
}

function children(expr) {
    const result = [];
    if ('left' in expr) {
        result.push(expr.left);
    }
    if ('right' in expr) {
        result.push(expr.right);
    }
    if ('inner' in expr) {
        result.push(expr.inner);
    }
    return result;
}