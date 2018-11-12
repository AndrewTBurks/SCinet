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

      // console.log(state.width, state.height);
      state.width = 1150;

      let aspectRatio = state.width / state.height;
      console.log(aspectRatio, 7680 / 4320);

      let margin = 50;
      let width = state.width;
      let height = state.height;

      let xScale = d3.scaleLinear()
        .domain([0, state.width])
        .range([0, 7680]);

      let yScale = d3.scaleLinear()
        .domain([0, state.height])
        .range([0, 4320]);

      let svg = state.svg
        .style("width", "100%")
        .style("height", "100%")
        .attr("viewBox", [-100, -100, 7780, 4420].join(" "));

      // let boothTip = d3.tip().attr('class', 'd3-tip').direction('s').html(d => "Booth ID:" + d.id);
      // svg.call(boothTip);

      let boothTip = undefined;

      // let countryTip = d3.tip().attr('class', 'd3-tip').html(d => `${d.abbr2}: ${d.name}`);
      // svg.call(countryTip);

      let boothIDs = Object.keys(state.booths);

      state.boothG = svg.append("g");

      state.boothG.selectAll(".booth")
        .data(Object.values(state.booths))
        .enter().append("g")
        .each(function (d) {
          let g = d3.select(this);
          let x = xScale(d.x),
            y = yScale(height - d.y - d.height);

          let scaledHeight = yScale(d.height);

          g.append("rect")
            .attr("id", (d) => d.id)
            .attr("class", "booth color")
            .attr("width", d => xScale(d.width))
            .attr("height", d => yScale(d.height))
            .attr("x", d => x)
            .attr("y", d => y)
            .on("click", d => console.log(d))

          g.append("text")
            .attr("x", x + 10)
            .attr("y", y + scaledHeight - 10)
            .style("font-color", "black")
            .style("font-size", "20px")
            .text(d.id);
        })
      // .on("mouseover", function (d) {
      //   d3.select(this).raise();
      //   state.hoveredBooth = d.id;

      //   d3.select(this).each(boothTip.show);
      // })
      // .on("mouseout", function (d) {
      //   state.hoveredBooth = null;

      //   d3.select(this).each(boothTip.hide);
      // });

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


      setInterval(recolorNodes, 1000);


      function recolorNodes() {

        let updatedData = {};

        for (let id of boothIDs) {
          // console.log(id);
        }

        d3.json(
          "https://inmon.sc18.org/sflow-rt/activeflows/ALL/sc18-booths/json?&minValue=0&aggMode=max",
          function (err, flows) {
            console.log(flows);

            for (let booth of Object.keys(state.booths)) {
              // updatedData[booth] = Math.pow(
              //   Math.random() * Math.pow(2, 10),
              //   4
              // );

              updatedData[booth] = 0;
            }

            for (let flow of flows) {
              // console.log(flow);
              updatedData[flow.key] = flow.value;
            }


            svg.selectAll(".booth").each(function (d) {
              let booth = d3.select(this);

              booth.selectAll("rect").style("fill", () => {
                return (booth.classed("selected") || booth.classed("color")) && updatedData[d.id] !== 0 ?
                  colorScale(updatedData[d.id]) : "#333";
              })
            });
          });
        }
  }

})();