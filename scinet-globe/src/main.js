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


    var geometry = new THREE.SphereGeometry(state.worldRadius - 0.25, 32, 32);

    let material = new THREE.MeshBasicMaterial({
    // var material = new THREE.MeshPhongMaterial({
      color: 0x050505
    });
    var sphere = new THREE.Mesh(geometry, material);
    state.scene.add(sphere);

    var wireGeo = new THREE.SphereGeometry(state.worldRadius, 32, 32);
    var geo = new THREE.EdgesGeometry(wireGeo); // or WireframeGeometry( geometry )
    var mat = new THREE.LineBasicMaterial({
      color: 0x2a2a2a,
      linewidth: 1
    });
    var wireframe = new THREE.LineSegments(geo, mat);
    state.group.add(wireframe);

    state.camera.position.z = state.worldRadius * 1.75;
    state.camera.position.y = state.worldRadius / 2;
    state.camera.lookAt(0, 0, 0);

    var light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(state.worldRadius/4, state.worldRadius, state.worldRadius * 1.75);
    state.scene.add(light);

    state.renderer.render(state.scene, state.camera);

    var animate = function () {
      requestAnimationFrame(animate);

      state.group.rotation.y += 0.003;

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

    let start = [39.7392, -104.9903];
    let end = [39.9042, 116.4074];

    let s1 = new THREE.Mesh(geometry, material);
    let p1 = latLngToVec3(start, state.worldRadius);
    s1.position.set(p1.x, p1.y, p1.z);
    state.group.add(s1);

    // chicago test
    // 41.8781° N, 87.6298

    let s2 = new THREE.Mesh(geometry, material);
    let p2 = latLngToVec3(end, state.worldRadius);
    s2.position.set(p2.x, p2.y, p2.z);
    state.group.add(s2);

    let path = new THREE.CurvePath();

    let up = new THREE.Curve();


    path.add(up);
    path.add(across);
    path.add(down);

    // createTestSpheres();
  }

  function createTestSpheres() {
    // add a few spheres to scene to test coords
    let geometry = new THREE.SphereGeometry(1, 6, 6);
    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    // let g1 = new THREE.SphereGeometry(1, 6, 6);
    let s1 = new THREE.Mesh(geometry, material);
    let p1 = latLngToVec3([30, -60]);
    s1.position.set(p1.x, p1.y, p1.z);

    // let g2 = new THREE.SphereGeometry(1, 6, 6);
    let s2 = new THREE.Mesh(geometry, material);
    let p2 = latLngToVec3([30, 60]);
    s2.position.set(p2.x, p2.y, p2.z);

    // let g3 = new THREE.SphereGeometry(1, 6, 6);
    let s3 = new THREE.Mesh(geometry, material);
    let p3 = latLngToVec3([30, 180]);
    s3.position.set(p3.x, p3.y, p3.z);

    // let g4 = new THREE.SphereGeometry(1, 6, 6);
    let s4 = new THREE.Mesh(geometry, material);
    let p4 = latLngToVec3([-30, -60]);
    s4.position.set(p4.x, p4.y, p4.z);

    // let g5 = new THREE.SphereGeometry(1, 6, 6);
    let s5 = new THREE.Mesh(geometry, material);
    let p5 = latLngToVec3([-30, 60]);
    s5.position.set(p5.x, p5.y, p5.z);

    // let g6 = new THREE.SphereGeometry(1, 6, 6);
    let s6 = new THREE.Mesh(geometry, material);
    let p6 = latLngToVec3([-30, 180]);
    s6.position.set(p6.x, p6.y, p6.z);

    // console.log(s1, s2, s3, s4, s5, s6);

    state.group.add(s1);
    state.group.add(s2);
    state.group.add(s3);
    state.group.add(s4);
    state.group.add(s5);
    state.group.add(s6);
  }

  function latLngToVec3(point, radius = state.worldRadius) {
    let lat = (point[0]) * Math.PI / 180,
      lng = (-1 * point[1]) * Math.PI / 180;

    let x = radius * Math.cos(lat) * Math.cos(lng);
    let z = radius * Math.cos(lat) * Math.sin(lng);
    let y = radius * Math.sin(lat);

    return new THREE.Vector3(x, y, z);
  }
})();