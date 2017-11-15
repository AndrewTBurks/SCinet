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
    .range([0.2, 0.4, 0.6, 0.8]);

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
      .attr("viewBox", [0, 0, state.width + 4 * margin, state.height * 2 + 4 * margin].join(" "));

    let boothTip = d3.tip().attr('class', 'd3-tip').direction('s').html(d => "Booth ID:" + d.id);
    svg.call(boothTip);

    let countryTip = d3.tip().attr('class', 'd3-tip').html(d => `${d.abbr2}: ${d.name}`);
    svg.call(countryTip);

    let boothIDs = Object.keys(state.booths);

    state.boothG = svg.append("g");

    state.boothG.selectAll(".booth")
      .data(Object.values(state.booths))
      .enter().append("rect")
      .attr("id", (d) => d.id)
      .attr("class", "booth color")
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("x", d => d.x + margin)
      .attr("y", d => state.height - d.y - d.height + margin)
      .on("mouseover", function (d) {
        d3.select(this).raise();
        state.hoveredBooth = d.id;

        d3.select(this).each(boothTip.show);
      })
      .on("mouseout", function (d) {
        state.hoveredBooth = null;

        d3.select(this).each(boothTip.hide);
      });

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

    let worldProj = d3.geoEquirectangular()
      .translate([state.width / 2 + margin, 3 * state.height / 2 + 3 * margin])
      .scale(175)
    // .fitExtent([[margin, state.height + 2 * margin], [state.width - margin, state.height - margin]])
    let path = d3.geoPath().projection(worldProj);

    d3.json("https://unpkg.com/world-atlas/world/110m.json", (err, world) => {
      var countries = topojson.feature(world, world.objects.countries);

      state.countries = {};

      Object.keys(countryCodes).forEach(c => {
        let xy = worldProj(countryCodes[c].slice(0, 2).reverse());

        state.countries[c] = {
          id: c,
          x: xy[0] - margin,
          y: state.height - xy[1] + margin,
          width: 0,
          height: 0
        };
      });

      state.countryG = svg.append("g");

      state.countryG.selectAll(".country")
        .data(countries.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .datum((d) => {
          if (countryCodesFull[d.id]) {
            d.abbr2 = countryCodesFull[d.id]["alpha-2"];
            d.name = countryCodesFull[d.id].name;
          }
          return d;
        })
        .on("mouseover", function (d) {
          d3.select(this).raise();
          state.hoveredCountry = d.abbr2;

          d3.select(this).each(countryTip.show);
        })
        .on("mouseout", function (d) {
          state.hoveredCountry = null;

          d3.select(this).each(countryTip.hide);
        })
        .on("click", function(d) {
          console.log(d);
        });

      setInterval(function () {
        // remakeLinksAround(Object.values(backbones));
        remakeLinksAround();
      }, 500);
    });

    function recolorNodes() {

      let updatedData = {};

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

      // if (nodes) {
        let max = Math.pow(2, 10);
        let linkCount = 50;

        // let links = d3.range(linkCount * nodes.length).map(() => {
        //   return {
        //     source: nodes[Math.floor(Math.random() * nodes.length)],
        //     target: state.booths[boothIDs[Math.floor(Math.random() * boothIDs.length)]],
        //     weight: Math.pow(Math.random() * max, 4)
        //   };
        // });

        d3.json("http://inmon.sc17.org/sflow-rt/activeflows/ALL/sc17-booth-country/json?minValue=0.001&aggMode=max", function (err, flows) {
        // console.log(flows.length);
          let boothLinks = [];
          let countryLinks = [];

          let boothIDs = Object.keys(state.booths);
          let countryIDs = Object.keys(state.countries);

          let bcLinks = [];

          for (flow of flows) {
            let sourceDest = flow.key.split(",");
            // let sourceDest = flow.key.split("_SEP_");

            if (state.booths[sourceDest[0]] && state.countries[sourceDest[1]]) {
              bcLinks.push({
                source: state.countries[sourceDest[1]],
                target: state.booths[sourceDest[0]],
                weight: +flow.value
              });
            }

          }

          // draw booth links
          for (let edge of bcLinks) {
            calculateEdgeAngles(edge);
          }

          for (let c of Object.keys(state.countries)) {
            let country = state.countries[c];
            let edgesIn = bcLinks.filter(l => l.source === country);
            console.log(edgesIn.length);
            findBundleControlPoints(country, edgesIn, []);
          }

          for (let id of Object.keys(state.booths)) {
            let edgesOut = bcLinks.filter(l => l.target === state.booths[id]);
            console.log(edgesOut.length);
            findBundleControlPoints(state.booths[id], [], edgesOut);
          }

          let boothBind = svg.selectAll(".boothConnection")
            .data(bcLinks);

          boothBind.exit().remove();

          svg.selectAll(".boothConnection")
            .attr("d", linkToBezier)
            .attr("class", (d) => "boothConnection b" + d.target.id + " c" + d.source.id)
            .transition()
            .style("stroke", d => colorScale(d.weight))
            .style("stroke-width", (d) => widthScale(d.weight))
            .style("stroke-opacity", (d) => opacScale(d.weight));

          boothBind.enter().append("path")
            .attr("class", (d) => "boothConnection b" + d.target.id + " c" + d.source.id)
            .attr("d", linkToBezier)
            .style("stroke", d => colorScale(d.weight))
            .style("stroke-width", (d) => widthScale(d.weight))
            .style("stroke-opacity", (d) => opacScale(d.weight));

          svg.selectAll(".boothConnection").style("display", function() {
            if (!state.hoveredBooth && !state.hoveredCountry) return "initial";

            return d3.select(this).classed("b" + state.hoveredBooth)  || d3.select(this).classed("c" + state.hoveredCountry) ? "initial" : "none"
          });          
        });
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

      let maxBundleDistance = 300;
      let distanceTolerance = 100;

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