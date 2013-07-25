
function getSecondaryLinks(nodes, links) {
  var secondaryLinks = {};
  // compute secondary links
  for (primaryNode in nodes) {
    secondaryLinks[primaryNode] = {};
    var primaryLinks = links[primaryNode];
    // Secondary nodes refer to all of the nodes that the primary node is linked to
    for (secondaryNode in primaryLinks) {
      // Now get all the nodes that the secondary node is linked to
      for (n in links[secondaryNode]) {
        // Then update secondaryLinks to include all of these nodes
        // If the primary node is already directly linked to one of these nodes,
        // then we'll just exclude it
        if (!links[primaryNode][n] === true)
          secondaryLinks[primaryNode][n] = links[secondaryNode][n];
      }
    }

    // Finally, get rid of the primary node. It shouldn't be linked to itself
    delete secondaryLinks[primaryNode][primaryNode];
  }
  
  return secondaryLinks;
}


