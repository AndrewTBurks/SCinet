(function () {
  let state = {
    booths: null,
    width: null,
    height: null,
    svg: d3.select("#root")
  };

  // initialize
  init();

  function init() {
    d3.csv("./data/booths.csv", (err, data) => {
      if (err) throw err;

      let cleanData = data.map(booth => {
        let dims = booth["Dims "].replace(/'/g, "").split("x");

        return {
          id: +booth["Booth "],
          width: +dims[0],
          height: +dims[1],
          area: +booth["Size "],
          x: +booth["X Coords"].replace(/'/g, ""),
          y: +booth["Y Coords"].replace(/'/g, "")
        };
      });

      let boothObj = {};

      for (let booth of cleanData) {
        boothObj[booth.id] = booth;
      }

      state.booths = boothObj;
      dataLoaded();
    });
  }

  function dataLoaded() {
    state.width = d3.max(Object.values(state.booths), (booth) => booth.width + booth.x);
    state.height = d3.max(Object.values(state.booths), (booth) => booth.height + booth.y);

    let margin = 50;
    let width = state.width;
    let height = state.height;

    // let line = d3.line()
    //   .curve(d3.curveBundle.beta(1))
    //   // .x(d => d.x)
    //   // .x(d => d.y)
    //   .x((d) => d.x)
    //   .y((d) => state.height - d.y);

    const line = d3.radialLine()
      .radius(function (d) {
        return d.y;
      })
      .angle(function (d) {
        return d.x / 180 * Math.PI;
      })
      .curve(d3.curveBundle.beta(0.95));

    let svg = state.svg
      .attr("width", 800)
      .attr("height", 800)
      .attr("viewBox", [0, 0, state.width + 2 * margin, state.height + 2 * margin].join(" "));

    let boothIDs = Object.keys(state.booths);
    let source = state.booths[boothIDs[Math.floor(Math.random() * boothIDs.length)]]
    let sources = d3.range(10).map(() => {
      return state.booths[boothIDs[Math.floor(Math.random() * boothIDs.length)]];
    });

    let links = d3.range(500).map(() => {
      return {
        source: sources[Math.floor(Math.random() * 1)],
        target: state.booths[boothIDs[Math.floor(Math.random() * boothIDs.length)]],
        weight: Math.random() * 100
      };
    });

    for (let edge of links) {
      calculateEdgeAngles(edge);
    }

    for (let id of Object.keys(state.booths)) {
      let node = state.booths[id];
      let edgesIn = links.filter(l => l.target === node);
      let edgesOut = links.filter(l => l.source === node);

      
      findBundleControlPoints(node, edgesIn, edgesOut);

    }

    svg.selectAll(".booth")
      .data(Object.values(state.booths))
      .enter().append("rect")
      .attr("class", "booth")
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("x", d => d.x + margin)
      .attr("y", d => state.height - d.y - d.height + margin);

    svg.selectAll(".connection")
      .data(links)
      .enter().append("path")
      .attr("class", "connection")
      .attr("d", linkToBezier)
      .style("stroke-width", (d) => d.weight / 100 * 2.5 + 0.5)
      .style("stroke-opacity", (d) => 0.5);
    
    function findNaiveControlPoint(node, edges) {
      let xOffset = 0;
      let yOffset = 0;
      let totalWeight = 0;

      let weightMult = 1;

      if (edges.length) {
        for (let edge of edges) {
          xOffset += ((edge.target.x + edge.target.width / 2) - (node.x + node.width / 2)) * edge.weight/2;
          yOffset += ((edge.target.y + edge.target.height / 2) - (node.y + node.height / 2)) * edge.weight/2;
          totalWeight += edge.weight;          
        }

        return {
          x: (xOffset * weightMult / totalWeight) + node.x,
          y: (yOffset * weightMult / totalWeight) + node.y
        };

      } else {
        return {x: node.x, y: node.y};
      }

    }

    function findBundleControlPoints(node, edgesIn, edgesOut) {
      let edgeClusters = clusterEdges(node, edgesIn, edgesOut);

      for (cluster of edgeClusters) {
        if (cluster.length >= 1) {
          getEdgeClusterControlPoint(node, cluster);
        }
      }
    }

    function clusterEdges(node, edgesIn, edgesOut) {
      let maxBundleAngle = 45;
      let degreeTolerance = 15;
      
      let maxBundleDistance = 100;
      let distanceTolerance = 15;

      let edges = _.concat(edgesOut.map(e => {
        return {
          edge: e,
          coord: {x: e.target.x, y: e.target.y},
          angle: e.targetAngle,
          direction: "out"
        };
      }), edgesIn.map(e => {
        return {
          edge: e,
          coord: {x: e.source.x, y: e.source.y},
          angle: e.sourceAngle,
          direction: "in" 
        };
      }));

      // console.log(edges);
      
      let clusters = [[]];

      // order links by angle from node
      let inOrder = _.sortBy(edges, e => e.angle);

      let lastAngle = -100;
      let firstAngleInCluster = -100;
      for (let edge of inOrder) {
        // calculate distance from node and save 
        edge.length = Math.sqrt(
          Math.pow(edge.coord.x - node.x, 2) + Math.pow(edge.coord.y - node.y, 2)
        );

        if (edge.angle - lastAngle > degreeTolerance // not within tolerance from last edge
          || edge.angle - firstAngleInCluster > maxBundleAngle
        ) {
          clusters.push(new Array());
          firstAngleInCluster = edge.angle;
        }
        
        clusters[clusters.length-1].push(edge);
        lastAngle = edge.angle;
      }

      // now cluster by dsitance from node
      let distanceClusters = [[]];

      // split clusters by length
      for (let cluster of clusters) {
        let distanceOrder =_.sortBy(cluster, e => e.length);

        let lastDistance = -100;
        let firstDistanceInCluster = -100;
        for (let edge of distanceOrder) {

          if (edge.length - lastDistance > distanceTolerance // not within tolerance from last edge
            || edge.length - firstDistanceInCluster > maxBundleDistance
          ) {
            distanceClusters.push(new Array());
            firstDistanceInCluster = edge.length;
          }

          distanceClusters[distanceClusters.length - 1].push(edge);
          lastDistance = edge.distance;
        }
      }

      // return clusters;
      return distanceClusters;
    }

    function getEdgeClusterControlPoint(node, edgeCluster) {
      // console.log(node, edgeCluster);

      // get min distance
      // let minDistance = d3.min(edgeCluster, e => );
      
      
      let avgAngle = _.sumBy(edgeCluster, e => e.angle) / edgeCluster.length;
      let lengthMult = 3/4;
      let angleMult = d3.scaleLinear()
        .domain([0, 45/2])
        .range([1, 0.75]);
      // let angleMult = ()=> 1;

      // console.log(edgeCluster);
      // console.log(avgAngle);

      let length = d3.min(edgeCluster, e => e.length) * lengthMult;

      let cos = Math.cos(avgAngle * Math.PI / 180);
      let sin = Math.sin(avgAngle * Math.PI / 180);

      for (let e of edgeCluster) {
        // let length = Math.sqrt(
        //   Math.pow(e.coord.x - node.x, 2) + Math.pow(e.coord.y - node.y, 2)
        // ) * lengthMult;

        if (e.direction === "in") {
          e.edge.cIn = {
            x: node.x - (length * cos * angleMult(Math.abs(e.angle - avgAngle))),
            y: node.y - (length * sin * angleMult(Math.abs(e.angle - avgAngle)))
          };

        } else {
          e.edge.cOut = {
            x: node.x - (length * cos * angleMult(Math.abs(e.angle - avgAngle))),
            y: node.y - (length * sin * angleMult(Math.abs(e.angle - avgAngle)))
          };
        }
      }
    }

    function calculateEdgeAngles(edge) {
      let sourceRadian = Math.atan2(edge.target.y - edge.source.y, edge.target.x - edge.source.x);

      
      edge.sourceAngle = sourceRadian * 180 / Math.PI;
      edge.targetAngle = edge.sourceAngle > 0 ? edge.sourceAngle - 180 : edge.sourceAngle + 180;
      // console.log(edge.sourceAngle, edge.targetAngle);
    }
    
    function lineToBezier(link) {
      // "M100, 250 C178, 205 316, 200 400, 250"]
      let source = link.source;
      let target = link.target;
      
      return `M${source.x + source.width / 2 +margin}, ${state.height - source.y - source.height / 2 + margin} 
        C${source.controlOut.x + margin}, ${state.height - source.controlOut.y + margin} 
        ${target.controlIn.x + margin}, ${state.height - target.controlIn.y + margin} 
        ${target.x + target.width / 2 + margin}, ${state.height - target.y - target.height / 2+ margin} `;
    }

    function linkToBezier(link) {
      // "M100, 250 C178, 205 316, 200 400, 250"]
      let source = link.source;
      let target = link.target;
      let cIn = link.cIn;
      let cOut = link.cOut;

      return `M${source.x + source.width / 2 + margin}, ${state.height - source.y - source.height / 2 + margin}\
        C${cOut.x + margin}, ${state.height - cOut.y + margin}\
        ${cIn.x + margin}, ${state.height - cIn.y + margin}\
        ${target.x + target.width / 2 + margin}, ${state.height - target.y - target.height / 2+ margin} `;
    }
  }
})();

