(function () {
  let state = {
    width: null,
    height: null,
    worldRadius: 30
  };

  // initialize
  init();

  function init() {
    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    state.renderer = new THREE.WebGLRenderer();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(state.renderer.domElement);

    state.group = new THREE.Group();
    state.scene.add(state.group);

    
    var geometry = new THREE.SphereGeometry(state.worldRadius, 32, 32);
    var material = new THREE.MeshBasicMaterial({ color: 0x000088 });
    var sphere = new THREE.Mesh(geometry, material);
    // state.scene.add(sphere);

    var geo = new THREE.EdgesGeometry(geometry); // or WireframeGeometry( geometry )
    var mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 1
    });
    var wireframe = new THREE.LineSegments(geo, mat);
    state.group.add(wireframe);

    state.camera.position.z = state.worldRadius * 1.75;
    state.camera.position.y = state.worldRadius/2;
    state.camera.lookAt(0,0,0);
    
    state.renderer.render(state.scene, state.camera);

    var animate = function () {
      requestAnimationFrame(animate);

      state.group.rotation.y += 0.001;

      state.renderer.render(state.scene, state.camera);
    };

    animate();

    d3.json("https://unpkg.com/world-atlas/world/110m.json", (err, world) => {

      var countries = topojson.feature(world, world.objects.countries);
     
      dataLoaded(countries);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    state.renderer.render(state.scene, state.camera);
  }

  function dataLoaded(globe) {
    console.log(globe);

    let linemat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: 2
      });

    // [globe.features[0]].forEach(feature => {
    //   let points = feature.geometry.coordinates[0].map(latLngToVec3);
    //   // console.log(points);
    //   let path = new THREE.Geometry();
    //   path.vertices.push(...points);

    //   // console.log(path);
    //   state.group.add(new THREE.Line(path, linemat));
    //   // state.scene.add(new Path)
    // });

    globe.features.forEach(feature => {
      let points = feature.geometry.coordinates[0].map(latLngToVec3);
      // console.log(points);
      let path = new THREE.Geometry();
      path.vertices.push(...points);

      // console.log(path);
      state.group.add(new THREE.Line(path, linemat));
      // state.scene.add(new Path)
    });
  }

  function latLngToVec3(point) {
    let lat = (90 - point[0]) * Math.PI / 180,
      lng = point[1] * Math.PI / 180;

    let x = state.worldRadius * Math.cos(lat) * Math.cos(lng);
    let z = state.worldRadius * Math.cos(lat) * Math.sin(lng);
    let y = state.worldRadius * Math.sin(lat);

    return new THREE.Vector3(x, y, z);
  }
})();

