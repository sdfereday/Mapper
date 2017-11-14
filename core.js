//// Have another look at the algorithm and iteration steps (need implementing). Something isn't working right...
/// http://www.csharpprogramming.tips/2013/07/Rouge-like-dungeon-generation.html
/// http://www.roguebasin.com/index.php?title=Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels
/// http://www.gridsagegames.com/blog/2014/06/mapgen-cellular-automata/
/// https://www.raywenderlich.com/66062/procedural-level-generation-games-using-cellular-automaton-part-1
// Will add to component later.
// Uses multi-dimensional arrays, will swap later for speed and flatten
// This entire tool is quite prototype-ish. And it needs to be made more functional, but I'll get to that stuff later on.

// Config - ok as global if never changes?
// Nah. Find a better way.
const mapDetails = {
  w: 18,
  h: 1024,
  emptyValue: 0,
  wallValue: 1,
  generations: 4
};

const applyLogic = (wallCount, v) => {

  if (v === 1) {

    if (wallCount >= 6) {
      return 1;
    }
    if (wallCount <= 2) {
      return 0;
    }

  } else if (wallCount >= 5) {
    return 1;
  }

  return v;

}


const getAdjacentWalls = (x, y, scopeX, scopeY, w, h, cells) => {

  let startX = x - scopeX;
  let startY = y - scopeY;
  let endX = x + scopeX;
  let endY = y + scopeY;

  let iX = startX;
  let iY = startY;

  let wallCounter = 0;

  // Could probably convert this to run using the cellmap function, then just pass the value above to determine
  // the logic.
  for (iY = startY; iY <= endY; iY++) {
    for (iX = startX; iX <= endX; iX++) {

      if (!(iX === x && iY === y)) {

        // This too is a bit stinky.
        // But anyway, treats anything out of bounds as a wall also.
        let neighbour = getCell(iX, iY, cells);
        if (!neighbour || neighbour.value === 1) {
          wallCounter += 1;
        }

      }

    }
  }

  return wallCounter;

}

const createMap = (h, w, assignRandom) => {

  // height and width flipped for quadrant correction
  const map = [];
  const steps = w * h;

  let col = 0;
  let row = 0;

  for(i = 0; i < steps; i++) {

    // New line and reset col increment
    if(i % h === 0) { // Or if it's strange, try using height
      row += 1;
      col = 0;
    } else {
      col += 1;
    }

    map.push({
      x: col,
      y: row - 1,
      value: assignRandom()
    });

  }

  return map;

}

/// Simple out of bounds check since we're dealing with arrays
const outOfBounds = (x, y, w, h) => {
  return x <= 0 || y <= 0 || x >= w - 1 || y >= h - 1;
}

/// Runs a function against each individual cell (get passed info from each)
const mapCells = (cells, fn) => {
  return cells.map(cell => fn(cell.value, cell, cells));
}

// Runs the mapCells function multiple times and flings out the resultant array at the end
const iterateMapCells = (arr, iters, fn) => {

  let t = [].concat(arr);

  for (let i = iters - 1; i >= 0; i--) {
    t = mapCells([].concat(t), fn);
  }

  return t;

}

// Cell utilities
const scoreCell = (above, right, below, left, valueNeeded) => {
    let sum = 0;
    if (above === valueNeeded) sum += 1;
    if (left === valueNeeded) sum += 2;
    if (below === valueNeeded) sum += 4;
    if (right === valueNeeded) sum += 8;
    return sum;
}

const getCell = (x, y, cells) => {
	return cells.find(cell => cell.x === x && cell.y === y);
}

const containsCell = (arr, cell) => {
  return arr.find(c => c.x === cell.x && c.y === cell.y);
}

// General utils
const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

const firstOrDefault = (prop, key, def) => {
  return prop ? prop[key] : def;
}

// Random algorithm
const randAlg = () => {
  return (Math.floor(Math.random() * (101 - 1)) + 1) < 40 ? 1 : 0;
}

// Building
const build = () => {

  // w, h, value (would use const but, this means we can't rebuild, will find a nicer way later)
  // Could actually optimise this even further by just doing it all in one, and, not using two dimensionals. TODO.
  const protoMap = createMap(mapDetails.w, mapDetails.h, randAlg);

  // This is as slow as hell due to the iteration count. We call an iteration over 18k + items
  // 5 times. So that's at lesat 90k iterations on this loop alone. Optimization is key here, so there
  // should be something place that only checks
  const builtMap = iterateMapCells(protoMap, mapDetails.generations, (value, cell, cells) => {

    // return {
    //   x: cell.x,
    //   y: cell.y,
    //   value: applyLogic(
    //     getAdjacentWalls(cell.x, cell.y, 1, 1, mapDetails.h, mapDetails.w, cells),
    //     value
    //   ),
    //   // Questionable... this is almost mutating things. But it's clear enough what's going on.
    //   hasGroup: false
    // }

    return {
      x: cell.x,
      y: cell.y,
      value: applyLogic(
        getAdjacentWalls(cell.x, cell.y, 1, 1, mapDetails.h, mapDetails.w, cells),
        value
      ),
      hasGroup: false
    }

  });

  const detectNeighbours = (cell, idx, group) => {

    // Assumes that you have x and y coords, it's not great but who the hell cares in this instance.
    if(cell.hasGroup)
        return;

    let x = cell.x;
    let y = cell.y;
    let value = cell.value;

    // Hmm... :/
    cell.hasGroup = true;

  	let above = getCell(x, y - 1, builtMap);
    let right = getCell(x + 1, y, builtMap);
    let below = getCell(x, y + 1, builtMap);
    let left = getCell(x - 1, y, builtMap);

    //above, right, below, left, valueNeeded
    let score = scoreCell(
      firstOrDefault(above, 'value', -1),
      firstOrDefault(right, 'value', -1),
      firstOrDefault(below, 'value', -1),
      firstOrDefault(left, 'value', -1),
    0);

    if(score > 0) {

      if(firstOrDefault(above, 'value', -1) === 0) {
      	//detectNeighbours(above, idx, group);
      }

      if(firstOrDefault(right, 'value', -1) === 0) {
      	//detectNeighbours(right, idx, group);
      }

      if(firstOrDefault(below, 'value', -1) === 0) {
      	//detectNeighbours(below, idx, group);
      }

      if(firstOrDefault(left, 'value', -1) === 0) {
      	//detectNeighbours(left, idx, group);
      }

    }

    group.push(cell);

    return group;

  }

  // Use the cell mapper here
  let groupIndex = 0;
  let groups = [];
  // const groupedCells = mapCells(builtMap, ((value, cell) => {

  //     // 1024 is the benchmark test. You've ot 18,432 cells to iterate over... you're going to call
  //     // recursion on all of those. That's not going to be performant at all. So another solution may well be required.
  //     // if(value === 0 && !containsCell(groups, cell)) {

  //     //     let group = detectNeighbours(cell, groupIndex, groups);
  //     //     groupIndex += 1;

  //     //     // return {
  //     //     //   groupIndex,
  //     //     //   group
  //     //     // };

  //     // }

  //     // A suggestion might actually to perform a zig-zag. Although that might fall apart when you try to fill in those
  //     // tiny inlets of one unit only. Might even be better to just test cardinal directions

  //     return null;

  //   })
  // ).filter(x => x);

  console.clear();
  console.log("===================================>");
  console.log("Generated!", builtMap.length);
  console.warn("Boundaries of map were breached. Did you mean to add a border?");
  // Return only groups that are smallest, we assume that these are minor pockets.
  // Use const later
  // let isolated = groupedCells.length > 1 ? [].concat(groupedCells).sort((a, b) => a.length - b.length) : [];

  // if(isolated.length > 0) {
  //   console.log("Detected isolated caverns:");
  //   console.log(isolated);

  //   // Draw a bloody path between each. Find the largest room, then draw a path to the middle of it.
  //   // ... This would make much better use of space and make the map more interesting.

  // }

  // ...
  // By the way, if you wanted to seed stuff, just save the random value of the algorithm. Easy!
  const mapSymbols = ['.', '#', '+'];
  const output = document.getElementById("output");
  output.innerHTML = '';

  mapCells(builtMap, (v, cell) => {
    let cellSpan = document.createElement('span');
    cellSpan.innerText = mapSymbols[v];
    cellSpan.style.left = (cell.x * 16) + 'px';
    cellSpan.style.top = (cell.y * 16) + 'px';
    output.appendChild(cellSpan);
  });

}

document.getElementById('start').addEventListener('click', build);
