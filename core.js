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
  h: 18,
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

const createBlankMap = (h, w, assignValue) => {

  // height and width flipped for quadrant correction
  const map = [];

  for (let column = 0, row = 0; row <= h - 1; row++) {
    map.push([]);
    for (column = 0; column <= w - 1; column++) {
      map[row].push(assignValue);
    }
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

const setCellValue = (cell, v) => {
  // return new cell?
}

// General utils
const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

const firstOrDefault = (prop, key, def) => {
  return prop ? prop[key] : def;
}

// Building
const build = () => {

  // w, h, value (would use const but, this means we can't rebuild, will find a nicer way later)
  // Could actually optimise this even further by just doing it all in one, and, not using two dimensionals. TODO.
  let blankMap = createBlankMap(mapDetails.w, mapDetails.h, mapDetails.emptyValue);
  let protoMap = flatten(blankMap.map((rowItems, row) => {

    return rowItems.map((colValue, col) => {
      // Random algorithm - Can change this to be more... well, interesting.
      return {
        x: row,
        y: col,
        value: (Math.floor(Math.random() * (101 - 1)) + 1) < 40 ? 1 : 0
      }
    });

  }));

  let builtMap = iterateMapCells(protoMap, mapDetails.generations, (value, cell, cells) => {

    return {
      x: cell.x,
      y: cell.y,
      value: applyLogic(
        getAdjacentWalls(cell.x, cell.y, 1, 1, 18, 18, cells),
        value
      ),
      // Questionable... this is almost mutating things. But it's clear enough what's going on.
      hasGroup: false
    }

  });

  /// Flood fill
  let tested = [];
  let groupIndex = 0;

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
      	detectNeighbours(above, idx, group);
      }

      if(firstOrDefault(right, 'value', -1) === 0) {
      	detectNeighbours(right, idx, group);
      }

      if(firstOrDefault(below, 'value', -1) === 0) {
      	detectNeighbours(below, idx, group);
      }

      if(firstOrDefault(left, 'value', -1) === 0) {
      	detectNeighbours(left, idx, group);
      }

    }

    group.push(cell);

    return group;

  }

  // Use the cell mapper here
  const groupedCells = mapCells(builtMap, ((value, cell) => {

      if(value === 0 && !cell.hasGroup) {

          let group = detectNeighbours(cell, groupIndex, []);
          groupIndex += 1;

          return {
            groupIndex,
            group
          };

      }

    })
  ).filter(x => x);

  console.clear();
  console.log("===================================>");
  console.log("Generated!");
  console.warn("Boundaries of map were breached. Did you mean to add a border?");
  // Return only groups that are smallest, we assume that these are minor pockets.
  // Use const later
  let isolated = groupedCells.length > 1 ? [].concat(groupedCells).sort((a, b) => a.length - b.length) : [];

  if(isolated.length > 0) {
    console.log("Detected isolated caverns:");
    console.log(isolated);

    // Draw a bloody path between each. Find the largest room, then draw a path to the middle of it.
    // ... This would make much better use of space and make the map more interesting.

  }

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
