var HexGrid = new Class({
  hexGrid : {},

  // Used to compute the indexes of the six neighborirng spaces of a hexagon given
  // its index
  getIndexOfAdjacent : {
    // North
    0 : function(r,c) {return {row: r+1, col: c};},
    // North West
    1 : function(r,c) {return {row: r+Math.abs(c%2), col: c-1};},
    // South West
    2 : function(r,c) {return {row: r-1+Math.abs(c%2), col: c-1};},
    // South
    3 : function(r,c) {return {row: r-1, col: c};},
    // South East
    4 : function(r,c) {return {row: r-1+Math.abs(c%2), col: c+1};},
    // North East
    5 : function(r,c) {return {row: r+Math.abs(c%2), col: c+1};}
  },
  
  addRow : function(rowIndex){
    if(!(rowIndex in this.hexGrid))
      this.hexGrid[rowIndex] = {};
  },
  
  addHex : function(rowIndex,colIndex){
    // Add the row if it doesn't exist
    this.addRow(rowIndex);
    // Then add the hexagon if it doesn't exist
    var row = this.hexGrid[rowIndex];
    // Add an object to this hexagon for storing data
    // We'll add a direction property by default, which will be used for 
    // placing adjacent hexagons
    if(!(colIndex in row)){
      var hex = row[colIndex] = {direction : 0};
      return hex;
    }
    
    // If the hex already exists, return it
    return row[colIndex];
  },
  
  // Returns a pointer to the data object at a given position on the grid
  getHex : function(rowIndex,colIndex){
    var row = this.hexGrid[rowIndex];
    if(row && row[colIndex])
      return row[colIndex];
  },
    
  // Retrieves a piece of data from a hexagon on the grid by key
  getHexData : function(rowIndex,colIndex,dataKey){
    var hex = this.getHex(rowIndex,colIndex);
    if(hex && dataKey in hex)
      return hex[dataKey];
  },
  
  // Adds or sets a property in the data object for a specific hexagon on the grid
  setHexProperty : function(rowIndex,colIndex,dataKey,data){
    var hex = this.getHex(rowIndex,colIndex);
    if(hex)
      hex[dataKey] = data;
  },
    
  setHexData : function(rowIndex,colIndex,data){
    if(this.hexExists(rowIndex,colIndex))
      this.hexGrid[rowIndex][colIndex] = data;
  },
   
  // Checks if a hexagon exists at a position on the grid
  hexExists : function(rowIndex,colIndex){
    var row = this.hexGrid[rowIndex];
    return row && (colIndex in row);
  },
    
  // Adds a hexagon at the given index on the grid. If the space is occupied, then
  // the method will recursively push the hexagon in its spot in the specified direction
  addHexDisplaceI : function(rowIndex,colIndex,direction){
    //If there's a hexagon at this position, then we need to push it 
    var hex = this.getHex(rowIndex,colIndex);
    if(hex){ 
      // We need to push the data of this hexagon to the adjacent hexagon in the specified
      // direction
      var adjCoords = this.getIndexOfAdjacent[direction](rowIndex,colIndex);
      console.log("r: " + rowIndex + " col: " + colIndex);
      console.log(adjCoords);
      
      var affectedHexs = this.addHexDisplaceI(adjCoords.row,adjCoords.col,direction);
      affectedHexs.push({row: rowIndex, col: colIndex});
      
      // Set the data of the ajacent hexagon to the data for the current hexagon
      this.hexGrid[adjCoords.row][adjCoords.col] = hex;
      // Wipe out the data of the current hexagon
      this.hexGrid[rowIndex][colIndex] = {direction : 0};
      
      return affectedHexs;
    }
    else{
      // In this case, there isn't a hexagon at this position, so we can just add one as usual
      this.addHex(rowIndex,colIndex);
      return [{row : rowIndex, col: colIndex}];
    }
  },
  
  // A wrapper function for the hexDisplaceI
  /*addHexDisplace : function(rowIndex,colIndex){
    var hex = this.getHex(rowIndex,colIndex);
    // Check if there's a hexagon in the given spot
    if(hex){
      var adjCoords = this.getIndexOfAdjacent[hex.direction](rowIndex,colIndex);
      this.addHexDisplaceI(adjCoords.row,adjCoords.col,hex.direction);
      
      // Update the direction 
      hex["direction"] = (hex["direction"] + 1) % 6;
    }
  }*/
  
  // A wrapper function around the addHexDisplaceI function
  addHexDisplace : function(rowIndex,colIndex,direction){
    var adjCoords = this.getIndexOfAdjacent[direction](rowIndex,colIndex);
    return this.addHexDisplaceI(adjCoords.row,adjCoords.col,direction);
  }
}); 


