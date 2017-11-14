(function () {
  let state = {
    width: null,
    height: null,
    worldRadius: 30,
    group: null,
    pathGroup: null
  };

  // initialize
  init();

  let colorScale = d3.scaleQuantile()
    .domain([Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
    .range(['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33']);

  let widthScale = d3.scaleQuantile()
    .domain([Math.pow(2, 10), Math.pow(2, 20), Math.pow(2, 30), Math.pow(2, 40)])
    .range([2, 3, 4, 5]);

  function init() {
    var url = location.href;
    state.location = url.substring(url.indexOf("?") + 1);

    console.log(state.location);

    state.scene = new THREE.Scene();

    state.renderer = new THREE.WebGLRenderer();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(state.renderer.domElement);

    state.group = new THREE.Group();
    state.scene.add(state.group);

    state.pathGroup = new THREE.Group();
    state.group.add(state.pathGroup);


    var geometry = new THREE.SphereGeometry(state.worldRadius - 0.25, 32, 32);

    let material = new THREE.MeshBasicMaterial({
      // var material = new THREE.MeshPhongMaterial({
      color: 0x050505
    });
    var sphere = new THREE.Mesh(geometry, material);

    var wireGeo = new THREE.SphereGeometry(state.worldRadius, 32, 32);
    var geo = new THREE.EdgesGeometry(wireGeo); // or WireframeGeometry( geometry )
    var mat = new THREE.LineBasicMaterial({
      color: 0x2a2a2a,
      linewidth: 1
    });
    var wireframe = new THREE.LineSegments(geo, mat);
    state.group.add(wireframe);

    // different based on inner or outer
    if (state.location === "outer") {
      state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      state.camera.position.z = state.worldRadius * 1.75;
      state.camera.position.y = state.worldRadius / 2;
      state.camera.lookAt(0, 0, 0);

      state.scene.add(sphere);      
    }
    else {
    // }
    // else if (state.location === "inner") {
      state.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
      state.camera.position.z = state.worldRadius * .85;
      // state.camera.position.y = state.worldRadius / 2;
    }

    var light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(state.worldRadius / 4, state.worldRadius, state.worldRadius * 1.75);
    state.scene.add(light);

    state.renderer.render(state.scene, state.camera);

    let lastTime = 0;

    var animate = function (timestep) {
      // requestAnimationFrame(animate);
      // console.log(timestep);

      // freegeoip.net/{format}/{IP_or_hostname}

      d3.json("http://inmon.sc17.org/sflow-rt/activeflows/ALL/world-map/json?maxFlows=20&minValue=0&aggMode=max", function (err, json) {

        if (err) console.warn(err);
        // console.log(json);

        for (var i = state.pathGroup.children.length - 1; i >= 0; i--) {
          state.pathGroup.remove(state.pathGroup.children[i]);
        }

        if (json) {
          for (let flow of json) {
            let srcDest = flow.key.split(",");
            // console.log(countryCodes[srcDest[0]]);

            if (countryCodes[srcDest[0]] && countryCodes[srcDest[1]]);

            createCurve(
              countryCodes[srcDest[0]].slice(0, 2),
              countryCodes[srcDest[1]].slice(0, 2),
              flow.value
            );
          }
        }
      });

      // console.log((timestep - lastTime) /1000);
      
      if (timestep && lastTime) {
        state.group.rotation.y += ((timestep - lastTime) / 2500);
        lastTime = timestep;
      } else {
        state.group.rotation.y +=  0.01;
      }
      // refresh render
      state.renderer.render(state.scene, state.camera);
    };

    let interval = setInterval(animate, 250);

    // animate();

    d3.json("https://unpkg.com/world-atlas/world/110m.json", (err, world) => {
      var countries = topojson.feature(world, world.objects.countries);

      dataLoaded(countries);
      state.renderer.render(state.scene, state.camera);
    });
  }

  // function animate() {
  //   requestAnimationFrame(animate);
  //   state.renderer.render(state.scene, state.camera);
  // }

  function dataLoaded(globe) {
    let linemat = new THREE.LineBasicMaterial({
      color: 0x31a354,
      linewidth: 3
    });

    globe.features.forEach(feature => {
      let pathPoints = [];

      if (feature.geometry.type !== "Polygon") {
        feature.geometry.coordinates.forEach(
          geo => {
            geo.forEach(polygon => {
              pathPoints.push(polygon.map(
                c => latLngToVec3([c[1], c[0]], state.worldRadius)
              ));
            })
          }
        );
      } else {
        pathPoints.push(feature.geometry.coordinates[0].map(
          c => latLngToVec3([c[1], c[0]], state.worldRadius)
        ));
      }

      for (let feat of pathPoints) {
        let path = new THREE.Geometry();
        path.vertices.push(...feat);

        // console.log(path);
        state.group.add(new THREE.Line(path, linemat));
      }
    });

    let geometry = new THREE.SphereGeometry(0.4, 6, 6);

    // let material = new THREE.MeshPhongMaterial({
    let material = new THREE.MeshBasicMaterial({
      color: 0x41b6c4
    });

    let end1 = [39.9042, 116.4074];
    let end2 = [19.8968, -155.5828];

    // let s1 = new THREE.Mesh(geometry, material);
    // let p1 = latLngToVec3(start, state.worldRadius);
    // s1.position.set(p1.x, p1.y, p1.z);
    // state.group.add(s1);

    // createCurve(start, end1);
    // createCurve(start, end2);
  }

  function createCurve(start, end, weight) {
    let geometry = new THREE.SphereGeometry(0.4, 6, 6);

    // let material = new THREE.MeshPhongMaterial({
    let material = new THREE.MeshBasicMaterial({
      color: 0x41b6c4
    });

    let s1 = new THREE.Mesh(geometry, material);
    let p1 = latLngToVec3(start, state.worldRadius);
    s1.position.set(p1.x, p1.y, p1.z);
    state.pathGroup.add(s1);

    let s2 = new THREE.Mesh(geometry, material);
    let p2 = latLngToVec3(end, state.worldRadius);
    s2.position.set(p2.x, p2.y, p2.z);
    state.pathGroup.add(s2);

    let latStart, latEnd;
    let lngStart, lngEnd;

    let leftRight;

    // console.log(end[1] - start[1], end[1] - 360 - start[1])
    // console.log((end[1] + 360) % 360 - (start[1] + 360) % 360, (start[1] + 360) % 360 - (end[1] + 360) % 360);

    if ((end[1] + 360) % 360 - (start[1] + 360) % 360 < (start[1] + 360) % 360 - (end[1] + 360) % 360) {
      leftRight = "right";
    } else {
      leftRight = "left";
    }

    latStart = start[0];
    latEnd = end[0];

    // lngStart = start[1];
    lngStart = start[1];
    lngEnd = end[1];

    let intermed = 10;
    let coords = d3.range(0, intermed + 1).map((i) => {
      let latOff = i * (latEnd - latStart) / (intermed);
      let lngOff = i * (lngEnd - lngStart) / (intermed);

      return latLngToVec3(
        [latStart + latOff, lngStart + lngOff], state.location === "outer" ? 
        Math.abs(i - 5) > 2 ? state.worldRadius + 5 - Math.abs(i - 5) + 2 : state.worldRadius + 5 :
        Math.abs(i - 5) > 2 ? state.worldRadius - 5 + Math.abs(i - 5) - 2 : state.worldRadius - 5);
    });

    let flow = new THREE.CatmullRomCurve3([
      latLngToVec3([latStart, lngStart]),
      ...coords,
      latLngToVec3([latEnd, lngEnd])
    ]);

    flow.tension = 0.75;

    let points = flow.getPoints(20);

    // var curveGeo = new THREE.BufferGeometry().setFromPoints(points);
    // let linemat = new THREE.LineBasicMaterial({
    //   color: new THREE.Color(colorScale(weight)),
    //   linewidth: widthScale(weight)
    // });
    // let line = new THREE.Line(curveGeo, linemat);
    // // console.log(line);

    // state.pathGroup.add(line);

    var tubeGeo = new THREE.TubeBufferGeometry(flow, 20, widthScale(weight)/15, 8, false);
    // var tubeMat = new THREE.MeshPhongMaterial({
    var tubeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorScale(weight))
    });

    var tube = new THREE.Mesh(tubeGeo, tubeMat);

    state.pathGroup.add(tube);
  }

  function latLngToVec3(point, radius = state.worldRadius) {
    let lat = (point[0]) * Math.PI / 180,
      lng = ((state.location === "inner" ? 1 : -1) * point[1]) * Math.PI / 180;

    let x = radius * Math.cos(lat) * Math.cos(lng);
    let z = radius * Math.cos(lat) * Math.sin(lng);
    let y = radius * Math.sin(lat);

    return new THREE.Vector3(x, y, z);
  }
})();