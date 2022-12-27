function htmlRule(name, conclusion, premises) {
    const treeDiv = document.createElement('div');
    treeDiv.classList.add("tree");
  
    const hypothesesDiv = document.createElement('div');
    hypothesesDiv.classList.add("hypotheses");
    treeDiv.appendChild(hypothesesDiv);
  
    premises.forEach(function(premise) {
        if (typeof premise === 'string') {
            const newDiv = document.createElement('div');
            newDiv.innerText = premise;
            premise = newDiv;
        }
        premise.classList.add("hypothesis");
        hypothesesDiv.appendChild(premise);
    });
  
    const middleDiv = document.createElement('div');
    middleDiv.classList.add("middle");
    treeDiv.appendChild(middleDiv);
  
    const nameDiv = document.createElement('div');
    nameDiv.classList.add("name");
    nameDiv.innerText = name;
    middleDiv.appendChild(nameDiv);
  
    const barDiv = document.createElement('div');
    barDiv.classList.add("bar");
    middleDiv.appendChild(barDiv);
  
    const conclusionDiv = document.createElement('div');
    conclusionDiv.classList.add("conclusion");
  
    const leftPad = document.createElement('span');
    leftPad.appendChild(document.createTextNode('['));
    leftPad.classList.add('pad');
    const rightPad = document.createElement('span');
    rightPad.appendChild(document.createTextNode(']'));
    rightPad.classList.add('pad');
  
    const conclusionInnerDiv = document.createElement('div');
  
    conclusionInnerDiv.appendChild(leftPad);
    conclusionInnerDiv.appendChild(document.createTextNode(conclusion));
    conclusionInnerDiv.appendChild(rightPad);
  
    conclusionDiv.appendChild(conclusionInnerDiv);
    treeDiv.appendChild(conclusionDiv);
  
    return treeDiv;
}

function htmlDeriving(conclusion, hypothesis) {
    const container = document.createElement('div');
    container.classList.add('deriving');

    const conclusionDiv = document.createElement('div');
    conclusionDiv.innerText = conclusion;

    const dotsDiv = document.createElement('div');
    dotsDiv.innerText = '⋮';

    const hypothesisDiv = document.createElement('div');
    hypothesisDiv.innerText = "[" + hypothesis + "]";

    container.appendChild(hypothesisDiv);
    container.appendChild(dotsDiv);
    container.appendChild(conclusionDiv);

    return container;
}