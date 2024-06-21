
function next_steps(elems, step) {
    const result = [];
    elems = elems.slice();
    const node1 = elems.shift();
    const node2 = elems.shift();
    const new_node = {
        step,
        children: [node1, node2],
        id: node1.id + node2.id,
        weight: node1.weight + node2.weight,
        height: Math.max(node1.height, node2.height) + 1,
        size: node1.size + node2.size
    };
    elems.unshift(new_node);
    result.push(elems.slice());
    elems.sort(function(a, b) {
        return a.weight - b.weight;
    });
    result.push(elems);
    return result;
}

function all_steps(elems) {
    const steps = [elems.slice()];
    elems.sort(function(a, b) {
        return a.weight - b.weight;
    });
    steps.push(elems);
    let step = 2;
    while (elems.length > 1) {
        let res = next_steps(elems, step);
        steps.push(res[0]);
        elems = res[1];
        steps.push(elems);
        step += 2;
    }
    return steps;
}

function get_counts(text) {
    counts = {};
    for (const c of text) {
        if (c in counts) {
            counts[c] += 1;
        } else {
            counts[c] = 1;
        }
    }
    return get_counts_from_object(counts);
}

function get_counts_from_specs(line) {
    counts = {};
    for (const part of line.split(',')) {
        let [value, weight] = part.split(':');
        if (weight === undefined) {
            weight = '1';
        }
        value = value.trim();
        if (!(value in counts)) {
            counts[value] = 0;
        }
        counts[value] += parseInt(weight.trim());
    }
    return get_counts_from_object(counts);
}

function get_counts_from_object(counts) {
    const elems = [];
    for (const c in counts) {
        elems.push({
            value: c,
            id: c,
            weight: counts[c],
            height: 0,
            size: 1,
            step: 0,
        });
    }
    return elems;
}

function build_tree(elems) {
    const root = {
        children: elems,
    };
    return root;
}

function build_nodes(elems) {
    const nodes = [];
    function traverse(elem, left, top, parent) {
        const children = elem.children ? [] : null;
        const node = { data: elem, left, top, children, parent };
        if (elem.children) {
            elem.children.forEach(function(child){
                const child_node = traverse(child, left, top + 1);
                children.push(child_node);
                left += child.size;
            });
        }
        nodes.push(node);
        return node;
    }
    let left = 1;
    elems.forEach(function(elem){
        traverse(elem, left, 1);
        left += elem.size;
    });
    return nodes;
}

function build_links(nodes) {
    const links = [];
    function handle(node) {
        if (node.children) {
            let index = 0;
            node.children.forEach(function(child_node){
                links.push({ source: node, target: child_node, index });
                index += 1;
            });
        }
    }
    nodes.forEach(function(node){
        handle(node);
    });
    return links;
}

function get_x(d) {
    return d.left * 80 + (d.data.size - 1) * 40;
}

function get_y(d) {
    return d.top * 80 - 40;
}

function display_elems(container, elems, step) {

    const nodes = build_nodes(elems);

    const node = container.select('g.nodes').selectAll('g.node')
        .data(nodes, function(d) { return d.data.id; })
        .join(
            function(enter) {
                return enter.append('g')
                    .classed('node', true)
                    .attr('data-id', function(d) { return d.data.id; })
                    .attr('transform', function(d) {
                        return 'translate(' + get_x(d) + ', ' + get_y(d) + ')';
                    })
                    .style('fill', function(d) {
                        return d.data.step === step ? 'red' : 'green';
                    })
                    .call(g => g.append('circle').attr('r', 20))
                    .call(g => g.append('text').text(function(d) {
                        return d.data.weight || ''; })
                        .attr('text-anchor', 'middle')
                        .attr('alignment-baseline', 'middle')
                        .style('fill', 'white')
                        .attr('dy', '0.1em'))
                    .call(g => g.append('text').text(function(d) {
                        return d.data.value || ''; })
                        .attr('text-anchor', 'middle')
                        .attr('alignment-baseline', 'middle')
                        .attr('dy', '2em')
                        .style('fill', 'black'))
                    .style('opacity', 0)
                    .transition()
                    .delay(step == 0 ? 0 : 1000)
                    .duration(step == 0 ? 100 : 500)
                    .style('opacity', 1);
            },
            function(update) {
                return update
                    .transition()
                    .duration(1000)
                    .style('opacity', 1)
                    .attr('transform', function(d) {
                        return 'translate(' + get_x(d) + ', ' + get_y(d) + ')';
                    })
                    .style('fill', function(d) {
                        return d.data.step === step ? 'red' : 'green';
                    });
            },
            function(exit) {
                return exit.remove();
            }
        );

    const links = build_links(nodes);

    const link = container.select('g.links').selectAll('line.link')
        .data(links, function(d) { 
            const id = d.source.data.id + '-' + d.target.data.id;
            return id;
        })
        .join(
            function(enter) {
                return enter.append('line')
                    .classed('link', true)
                    .attr('x1', function(d) { return get_x(d.source); })
                    .attr('y1', function(d) { return get_y(d.source); })
                    .attr('x2', function(d) { return get_x(d.target); })
                    .attr('y2', function(d) { return get_y(d.target); })
                    .style('opacity', 0)
                    .transition()
                    .delay(1000)
                    .duration(500)
                    .style('opacity', 1);
            },
            function(update) {
                return update
                    .transition()
                    .duration(1000)
                    .style('opacity', 1)
                    .attr('x1', function(d) { return get_x(d.source); })
                    .attr('y1', function(d) { return get_y(d.source); })
                    .attr('x2', function(d) { return get_x(d.target); })
                    .attr('y2', function(d) { return get_y(d.target); })
            },
            function(exit) {
                return exit.remove();
            }
        );

    const bits = container.select('g.bits').selectAll('g.bit')
        .data(links, function(d) { return d.source.data.id + '-' + d.target.data.id; })
        .join(
            function(enter) {
                return enter.append('g')
                    .classed('bit', true)
                    .attr('transform', function(d) {
                        const x = (get_x(d.source) + get_x(d.target)) / 2;
                        const y = (get_y(d.source) + get_y(d.target)) / 2;
                        return 'translate(' + x + ', ' + y + ')';
                    })
                    .call(g => g.append('circle').attr('r', 10))
                    .call(g => g.append('text').text(function(d) {
                        return d.index; })
                        .attr('text-anchor', 'middle')
                        .attr('alignment-baseline', 'middle')
                        .style('fill', 'white')
                        .style('font-size', '10px')
                        .attr('dy', '0.1em'))
                    .style('opacity', 0)
                    .transition()
                    .delay(1000)
                    .duration(500)
                    .style('opacity', 1);
            },
            function(update) {
                return update
                    .transition()
                    .duration(1000)
                    .style('opacity', 1)
                    .attr('transform', function(d) {
                        const x = (get_x(d.source) + get_x(d.target)) / 2;
                        const y = (get_y(d.source) + get_y(d.target)) / 2;
                        return 'translate(' + x + ', ' + y + ')';
                    });
            },
            function(exit) {
                return exit.remove();
            }
        );
}