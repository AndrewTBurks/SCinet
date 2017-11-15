(function () {
  let state = {
    booths: null,
    width: null,
    height: null,
    svg: d3.select("#root")
  };


  let colorScale = d3.scaleQuantile()
    .domain([Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
    .range(['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33']);

  let widthScale = d3.scaleQuantile()
    .domain([Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
    .range([2, 4, 6, 8]);

  let opacScale = d3.scaleQuantile()
    .domain([Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
    .range([0.1, 0.23, 0.36, 0.5]);

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
    let width = state.boothWidth;
    let height = state.height;

    let svg = state.svg
      .style("width", "100%")
      .style("height", "100%")
      .attr("viewBox", [0, 0, state.width + 2 * margin, state.height * 2 + 2 * margin].join(" "));

    let boothIDs = Object.keys(state.booths);

    svg.selectAll(".booth")
      .data(Object.values(state.booths))
      .enter().append("rect")
      .attr("id", (d) => d.id)
      .attr("class", "booth color")
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("x", d => d.x + margin)
      .attr("y", d => state.height - d.y - d.height + margin)
    // .on("click", function (d) {
    //   if (d3.select(this).classed("selected")) {
    //     d3.select(this).classed("selected", null);
    //     d3.selectAll(".booth").classed("color", true);
    //     remakeLinksAround();
    //   } else {
    //     d3.selectAll(".booth").classed("color", null);
    //     d3.selectAll(".booth.selected").classed("selected", null);
    //     d3.select(this).classed("selected", true);
    //     remakeLinksAround(d);
    //   }
    // });

    let backbones = [{
      id: "b1",
      x: state.width / 10,
      y: 0 - margin,
      width: 20,
      height: 20
    }, {
      id: "b2",
      x: 3 * state.width / 10,
      y: 0 - margin,
      width: 20,
      height: 20
    }, {
      id: "b3",
      x: 5 * state.width / 10,
      y: 0 - margin,
      width: 20,
      height: 20
    }, {
      id: "b4",
      x: 7 * state.width / 10,
      y: 0 - margin,
      width: 20,
      height: 20
    }, {
      id: "b5",
      x: 9 * state.width / 10,
      y: 0 - margin,
      width: 20,
      height: 20
    }];

    svg.selectAll(".backbone")
      .data([backbones[2]]) // put back rest when I  have backbone info
      // .data(backbones)
      .enter().append("circle")
      .attr("class", "backbone")
      .attr("cx", d => d.x + d.width / 2 + margin)
      .attr("cy", d => state.height - d.y - d.height / 2 + margin)
      .attr("r", 10);

    // svg.selectAll(".backboneG")
    //   .data([backbones[2]]) // put back rest when I  have backbone info
    //   .enter().append("g")
    //   .attr("class", "backboneG")
    //   .attr("id", d => d.id)
    //   .each(function (d) {
    //     d.group = d3.select(this);
    //     return d;
    //   });

    setInterval(function () {
      // svg.selectAll(".boothConnection").remove();
      // svg.selectAll(".countryConnection").remove();
      remakeLinksAround(backbones);
    }, 500);


    function recolorNodes() {

      let updatedData = {};
      // get data
      // d3.json()

      for (let booth of Object.keys(state.booths)) {
        updatedData[booth] = Math.pow(Math.random() * Math.pow(2, 10), 4);
      }

      svg.selectAll(".booth")
        .style("fill", function (d) {
          let booth = d3.select(this)
          return booth.classed("selected") || booth.classed("color") ? colorScale(updatedData[d.id]) : "#333";
        });
    }

    function remakeLinksAround(nodes) {
      // http://inmon.sc17.org/sflow-rt/activeflows/ALL/flow_trend_3/json?maxFlows=20&minValue=0&aggMode=max
      // group:ipsource:boothid,country:ipdestination

      if (nodes) {
        let max = Math.pow(2, 10);
        let linkCount = 50;

        // let links = d3.range(linkCount * nodes.length).map(() => {
        //   return {
        //     source: nodes[Math.floor(Math.random() * nodes.length)],
        //     target: state.booths[boothIDs[Math.floor(Math.random() * boothIDs.length)]],
        //     weight: Math.pow(Math.random() * max, 4)
        //   };
        // });

        d3.json("http://inmon.sc17.org/sflow-rt/activeflows/ALL/flow_trend_1/json?minValue=0&aggMode=max", function (err, flows) {
          // console.log(flows);
          let boothLinks = [];
          let countryLinks = [];

          let countries = [];

          for (flow of flows) {
            let sourceDest = flow.key.split("_SEP_");

            if (state.booths[sourceDest[0]]) {
              boothLinks.push({
                source: nodes[2], // will split out into backbones once we have data
                target: state.booths[sourceDest[0]],
                weight: flow.value
              });
            }

            let fakeCountry = {
              id: "c",
              x: Math.random() * state.width,
              y: 0 + margin - state.height / 4 - (Math.random() * state.height / 2),
              width: 20,
              height: 20
            };

            countries.push(fakeCountry);

            countryLinks.push({
              source: nodes[2], // will split out into backbones once we have data
              target: fakeCountry,
              weight: flow.value
            });

          }


          // draw booth links
          for (let edge of boothLinks) {
            calculateEdgeAngles(edge);
          }

          for (let backbone of nodes) {
            let edgesOut = boothLinks.filter(l => l.source === backbone);
            findBundleControlPoints(backbone, [], edgesOut);

          }

          for (let id of Object.keys(state.booths)) {
            let edgesIn = boothLinks.filter(l => l.target === state.booths[id]);
            findBundleControlPoints(state.booths[id], edgesIn, []);
          }

          let boothBind =
            svg.selectAll(".boothConnection")
            .data(boothLinks);

          boothBind.exit().remove();

          svg.selectAll(".boothConnection")
            .attr("d", linkToBezier)
            .style("stroke", d => colorScale(d.weight))
            .style("stroke-width", (d) => widthScale(d.weight))
            .style("stroke-opacity", (d) => opacScale(d.weight));

          boothBind.enter().append("path")
            .attr("class", "boothConnection")
            .attr("d", linkToBezier)
            .style("stroke", d => colorScale(d.weight))
            .style("stroke-width", (d) => widthScale(d.weight))
            .style("stroke-opacity", (d) => opacScale(d.weight));


          // draw "country" links
          for (let edge of countryLinks) {
            calculateEdgeAngles(edge);
          }

          for (let backbone of nodes) {
            let edgesOut = countryLinks.filter(l => l.source === backbone);
            findBundleControlPoints(backbone, [], edgesOut);

          }

          for (let c of countries) {
            let edgesIn = countryLinks.filter(l => l.target === c);
            findBundleControlPoints(c, edgesIn, []);
          }

          let countryBind =
            svg.selectAll(".countryConnection")
            .data(countryLinks);

          countryBind.exit().remove();

          svg.selectAll(".countryConnection")
            .attr("d", linkToBezier)
            .style("stroke", d => colorScale(d.weight))
            .style("stroke-width", (d) => widthScale(d.weight))
            .style("stroke-opacity", (d) => opacScale(d.weight));

          boothBind.enter().append("path")
            .attr("class", "countryConnection")
            .attr("d", linkToBezier)
            .style("stroke", d => colorScale(d.weight))
            .style("stroke-width", (d) => widthScale(d.weight))
            .style("stroke-opacity", (d) => opacScale(d.weight));
        });



      }
    }

    function findNaiveControlPoint(node, edges) {
      let xOffset = 0;
      let yOffset = 0;
      let totalWeight = 0;

      let weightMult = 1;

      if (edges.length) {
        for (let edge of edges) {
          xOffset += ((edge.target.x + edge.target.width / 2) - (node.x + node.width / 2)) * edge.weight / 2;
          yOffset += ((edge.target.y + edge.target.height / 2) - (node.y + node.height / 2)) * edge.weight / 2;
          totalWeight += edge.weight;
        }

        return {
          x: (xOffset * weightMult / totalWeight) + node.x,
          y: (yOffset * weightMult / totalWeight) + node.y
        };

      } else {
        return {
          x: node.x,
          y: node.y
        };
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
      let distanceTolerance = 50;

      let edges = _.concat(edgesOut.map(e => {
        return {
          edge: e,
          coord: {
            x: e.target.x,
            y: e.target.y
          },
          angle: e.targetAngle,
          direction: "out"
        };
      }), edgesIn.map(e => {
        return {
          edge: e,
          coord: {
            x: e.source.x,
            y: e.source.y
          },
          angle: e.sourceAngle,
          direction: "in"
        };
      }));

      // console.log(edges);

      let clusters = [
        []
      ];

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
          ||
          edge.angle - firstAngleInCluster > maxBundleAngle
        ) {
          clusters.push(new Array());
          firstAngleInCluster = edge.angle;
        }

        clusters[clusters.length - 1].push(edge);
        lastAngle = edge.angle;
      }

      // now cluster by dsitance from node
      let distanceClusters = [
        []
      ];

      // split clusters by length
      for (let cluster of clusters) {
        let distanceOrder = _.sortBy(cluster, e => e.length);

        let lastDistance = -100;
        let firstDistanceInCluster = -100;
        for (let edge of distanceOrder) {

          if (edge.length - lastDistance > distanceTolerance // not within tolerance from last edge
            ||
            edge.length - firstDistanceInCluster > maxBundleDistance
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
      let lengthMult = 3 / 4;
      let angleMult = d3.scaleLinear()
        .domain([0, 45 / 2])
        .range([1, 1]);
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