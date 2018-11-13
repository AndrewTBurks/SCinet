(function () {
    let state = {
      booths: null,
      width: null,
      height: null,
      svg: d3.select("#root")
    };

    let historicData = {};

    let colorScale = d3.scaleQuantile()
      .domain([0, Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
      .range(['#999', '#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33']);

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

          historicData[booth.id] = {
            id: booth.id,
            data: []
          };
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
        // .attr("width", 7680)
        // .attr("height", 4320)
        .attr("viewBox", [-100, -100, 7780, 4420].join(" "));

      let topLeft = svg.append("g");
      
      topLeft.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 2700)
        .attr("height", 2500)
        .style("stroke", "orange");


      let bottomRight = svg.append("g")
        .attr("transform", "translate(5000, 2500)");
      
      bottomRight
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 2500)
        .attr("height", 2000)
        .style("stroke", "orange");

      // let boothTip = d3.tip().attr('class', 'd3-tip').direction('s').html(d => "Booth ID:" + d.id);
      // svg.call(boothTip);

      let boothTip = undefined;

      // let countryTip = d3.tip().attr('class', 'd3-tip').html(d => `${d.abbr2}: ${d.name}`);
      // svg.call(countryTip);

      let boothIDs = Object.keys(state.booths);

      state.boothG = svg.append("g");

      state.boothG
        .selectAll(".booth")
        .data(Object.values(state.booths))
        .enter()
      .append("g")
        .attr("class", "booth")
        .each(function(d) {
          let g = d3.select(this);
        
          let x = xScale(d.x),
            y = yScale(height - d.y - d.height);
        
          g.attr("transform", `translate(${x}, ${y})`);

          let scaledHeight = yScale(d.height);

          g.append("rect")
            .attr("id", d => d.id)
            .attr("class", "color")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", d => xScale(d.width))
            .attr("height", d => yScale(d.height))
            // .attr("x", d => x)
            // .attr("y", d => y)
            .on("click", d => console.log(historicData[d.id], d));

          g.append("path")
            .attr("class", "utilTrend")
            // .style("stroke", "black")
            .style("stroke-width", 2);

          g.append("text")
            .attr("x", 10)
            .attr("y", scaledHeight - 10)
            .style("fill", "black")
            .style("stroke", "none")
            .style("font-size", "22px")
            .text(d.id);
        });
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


      recolorNodes();
      setInterval(recolorNodes, 1000);


      function recolorNodes() {

        let updatedData = {};

        for (let id of boothIDs) {
          // console.log(id);
        }

        d3.json(
          "https://inmon.sc18.org/sflow-rt/activeflows/ALL/sc18-booth-country/json?&minValue=0&aggMode=max",
          function (err, flows) {
            let timestamp = Date.now();

            for (let booth of Object.keys(state.booths)) {
              // updatedData[booth] = Math.pow(
              //   Math.random() * Math.pow(2, 10),
              //   4
              // );

              historicData[booth].data.push({
                timestamp,
                total: 0,
                country: {}
              });
            }

            for (let flow of flows) {
              // console.log(flow);
              // updatedData[flow.key] = flow.value;
              let [id, country] = flow.key.split(",");

              // console.log(id, country, flow.value);

              if (historicData[id]) {
                let dataEntry = historicData[id].data[historicData[id].data.length - 1];
                // console.log(historicData[id]); 

                if (!dataEntry.country[country]) dataEntry.country[country] = 0;

                dataEntry.country[country] += flow.value;
                dataEntry.total += flow.value;
              }

            }

            // update booths
            svg.selectAll(".booth").each(function (d) {
              let booth = d3.select(this);

              let timeScale = d3.scaleTime()
                .domain(d3.extent(historicData[d.id].data, datum => datum.timestamp).map(t => new Date(t)))
                .range([0, d.width]);

              // console.log(d3.extent(historicData[d.id], datum => datum.timestamp));

              let valueScale = d3
                .scaleLog()
                // .scaleLinear()
                // .base(2)
                // .domain([0, Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
                // .range(d3.range(5).map(i => (d.height * (4-i)) / 4));
                .domain([0.00001, Math.pow(2, 40)])
                .range([d.height, 0]).nice().clamp(true);

              let area = d3.area()
                .x(d => xScale(timeScale(d.timestamp)))
                .y0(yScale(valueScale(0.00001)))
                .y1(d => yScale(valueScale(d.total)));

              historicData[d.id].data = historicData[d.id].data.slice(-60);

              let latestData = historicData[d.id].data[historicData[d.id].data.length - 1];
              let color = colorScale(latestData.total);

              if (latestData.total !== 0) {
                booth.raise();
              }
              
              
              booth.selectAll("rect").style("stroke", () => {

                // return "#333";

                return latestData.total !== 0 ?
                color : "#333";
              });
              

              if (historicData[d.id].data.length >= 2) {

                booth
                  .selectAll(".utilTrend")
                  .datum(historicData[d.id].data)
                  .attr("fill", color)
                  // .attr("fill", "black")
                  .attr("d", area);
              }

            });


            // calculate aggregate country data
            let countryAggregate = {};
            let timestamps = [];

            for (let id of Object.keys(historicData)) {
              let boothData = historicData[id];

              for (let t in boothData.data) {
                let boothEntry = boothData.data[t];
                timestamps[t] = boothEntry.timestamp;

                for (let country of Object.keys(boothEntry.country)) {
                  if (!countryAggregate[country]) {
                    countryAggregate[country] = [];
                  }

                  if (!countryAggregate[country][t]) {
                    countryAggregate[country][t] = 0;
                  }

                    countryAggregate[country][t] += boothEntry.country[country];
                }
              }
            }

            console.log(countryAggregate);

            timestamps = timestamps.map(t => new Date(t));
            // console.log(timestamps);

            // let countryData = [];

            // for (let country of Object.keys(countryAggregate)) {
            //   for (let time in countryAggregate[country]) {
            //     countryData.push({
            //       country,
            //       timestamp: timestamps[time],
            //       value: countryAggregate[country][time]
            //     });
            //   }
            // }

            let countryOrder = Object.keys(countryAggregate).sort(function(a,b) { return d3.sum(countryAggregate[b]) - d3.sum(countryAggregate[a]); });
            console.log(countryOrder);

            let stackData = {};
            
            for (let country of countryOrder) {
              stackData[country] = [];
            }

            let maxValue = 0;

            for (let time in timestamps) {
              let currentValue = 0;

              for (let country of countryOrder) {
                let nextValue = currentValue + countryAggregate[country][time];

                stackData[country][time] = {
                  time: timestamps[time],
                  values: [currentValue, nextValue]
                };

                currentValue = nextValue;
              }

              maxValue = Math.max(currentValue, maxValue);
            }
            
            console.log(stackData);

            if (timestamps.length >= 2) {
              // draw country stacked area chart
              let countryHeight = d3.scaleLinear()
                // .base(2)
                // .domain([0, Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
                // .range(d3.range(5).map(i => (d.height * (4-i)) / 4));
                .domain([0.0000001, maxValue])
                .range([2500, 0]).nice().clamp(true);

              let countryTime = d3.scaleTime()
                .domain(d3.extent(timestamps))
                .range([0, 2700]);

              let countryColor = d3.scaleOrdinal()
                  .domain(countryOrder)
                  .range(d3.schemeCategory10);

              let countryArea = d3.area()
                .x((d, i) => countryTime(timestamps[i]))
                .y0(d => countryHeight(d.values[0]))
                .y1(d => countryHeight(d.values[1]));

              svg.selectAll(".countryArea").remove();

              let stackArea = svg.selectAll(".countryArea")
                .data(Object.keys(stackData))
                .enter()
              .append("path")
                .attr("class", "countryArea")
                .attr("d", d => countryArea(stackData[d]))
                .attr("fill", countryColor)
                .attr("opacity", 0.75)
                .on("click", console.log);

              console.log(stackArea);
            }
          });
        }
  }

})();