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
        d._children = d.children;
    });

    tree(root);

    container.innerHTML = '';

    const svg = d3.select(container)
        .append('svg')
        .attr('class', 'expr-tree');

    const g = svg.append('g');

    let link = g.selectAll('line.link')
        .data(root.links(), function(d) { return d.target.id; })
        .join('line')
        .classed('link', true)
        .attr('x1', function(d) {return d.source.x;})
        .attr('y1', function(d) {return d.source.y;})
        .attr('x2', function(d) {return d.target.x;})
        .attr('y2', function(d) {return d.target.y;});

    let nodes = g.selectAll('circle.node')
        .data(root.descendants(), function(d) { return d.id; })
        .join('circle')
        .classed('node', true)
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 25);
    
    let text = g.selectAll('text.label')
        .data(root.descendants(), function(d) { return d.id; })
        .join('text')
        .classed('label', true)
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; })
        .text(function(d) {
            return label(d.data);
        });

    const bbox = g.node().getBBox();
    g.attr('transform', 'translate(' + (-bbox.x) + ', ' + (-bbox.y) + ')');
    svg.attr('width', bbox.width);
    svg.attr('height', bbox.height);
    
    if (interpretation) {

        const evalButton = document.createElement('button');
        evalButton.innerHTML = '<i class="fa fa-play"></i> Tout calculer';

        function go(d, elems) {
            if (d.children) {
                for (let i = 0; i < d.children.length; i++) {
                    go(d.children[i], elems);
                }
            }
            if (!d._evaled) {
                elems.push(d);
            }
        }

        let evaledAll = false;
        evalButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (evaledAll) {
                return;
            }
            evaledAll = true;
            const elems = [];
            go(root, elems);
            for (let i = 0; i < elems.length; i++) {
                const d = elems[i];
                setTimeout(function() {
                    d._evaled = true;
                    d.children = null;
                    update(d);
                }, 200 + i * 700);
            }
        });
        
        const resetButton = document.createElement('button');
        resetButton.innerHTML = '<i class="fa fa-arrows-rotate"></i> Réinitialiser';
        resetButton.addEventListener('click', function(e) {
            e.preventDefault();
            displayExprTree(container, expr, interpretation);
        });

        container.prepend(resetButton);
        container.prepend(evalButton);

        function childrenEvaluated(d) {
            if (!d.children) {
                return true;
            }
            for (let i = 0; i < d.children.length; i++) {
                if (!d.children[i]._evaled) {
                    return false;
                }
            }
            return true;
        }

        function updateActiveTexts() {
            text.classed('active', function(d) {
                    return childrenEvaluated(d);
                })
                .classed('inactive', function(d) {
                    return !childrenEvaluated(d);
                });
        }

        function update(source) {
            link = g.selectAll('line.link')
                .data(root.links(), function(d) { return d.target.id; });
            
            link.exit().transition().duration(400)
                .attr('x2', function(d) {return d.source.x;})
                .attr('y2', function(d) {return d.source.y;})
                .remove();

            nodes = g.selectAll('circle.node')
                .data(root.descendants(), function(d) { return d.id; });
            
            nodes.exit().remove();
            
            text = g.selectAll('text.label')
                .data(root.descendants(), function(d) { return d.id; });
            
            text.exit().remove();

            const evaledData = root.descendants().filter(function(d) { return d._evaled; });

            const gEval = g.selectAll('g.eval')
                .data(evaledData, function(d) { return d.id; });
            
            const gEvalEnter = gEval.enter()
                .append('g')
                .classed('eval', true)
                .attr('transform', function(d) { return 'translate(' + source.x + ',' + source.y + ')'; })
            
            gEvalEnter.transition()
                .duration(400)
                .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
            
            const evalCircles = gEvalEnter
                .append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 0)
                .transition()
                .delay(function(d) { return d._children ? 400 : 10; })
                .duration(0)
                .attr('r', 25)
                .attr('fill', 'white');
            
            const evalText = gEvalEnter
                .append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('opacity', 0)
                .text(function(d) { return d.data.value ? '1' : '0'; })
                .style('cursor', 'not-allowed')
                .transition()
                .delay(function(d) { return d._children ? 400 : 10; })
                .duration(0)
                .attr('opacity', 1);

            const gEvalExit = gEval.exit()
                .transition()
                .duration(400)
                .attr('transform', function(d) { return 'translate(' + source.x + ',' + source.y + ')'; })
                .remove();

            updateActiveTexts();
        }

        updateActiveTexts();

        text.on('click', function(e, d) {
            if (evaledAll) {
                return;
            }
            if (childrenEvaluated(d)) {
                d._evaled = true;
                d.children = null;
                update(d);
            }
        });
    }
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