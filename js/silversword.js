function init() {
    // set the scene size
    var WIDTH = 600, HEIGHT = 500;

    // set some camera attributes
    var VIEW_ANGLE = 60,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // get the DOM element to attach to
    // - assume we've got jQuery to hand
    var $container = $('#container');

    // create a WebGL renderer, camera
    // and a scene
    renderer = new THREE.CanvasRenderer();
    camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
            ASPECT,
            NEAR,
            FAR  );
    scene = new THREE.Scene();

    // the camera starts at 0,0,0 so pull it back
    camera.position.z = 30;

    // start the renderer
    renderer.setSize(WIDTH, HEIGHT);

    // attach the render-supplied DOM element
    $container.append(renderer.domElement);


    controls = new THREE.TrackballControls( camera );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [ 65, 83, 68 ];


    stats = new Stats();
    stats.setMode(0);

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    // and the camera
    scene.add(camera);

    // create a point light
    var dirLight = new THREE.DirectionalLight( 0x808080 );

    // set its position
    dirLight.position.set( .5, .5, .5 );

    // add to the scene
    scene.add(dirLight);

    scene.add(new THREE.AmbientLight( 0x808080 ));

    (function() {

        var len = 100;

        var matR = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var matG = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        var matB = new THREE.LineBasicMaterial({ color: 0x0000ff });

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3());
        geometry.vertices.push(new THREE.Vector3(100, 0, 0));
        var line = new THREE.Line(geometry, matR);
        scene.add(line);

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3());
        geometry.vertices.push(new THREE.Vector3(0, 100, 0));
        var line = new THREE.Line(geometry, matG);
        scene.add(line);

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3());
        geometry.vertices.push(new THREE.Vector3(0, 0, 100));
        var line = new THREE.Line(geometry, matB);
        scene.add(line);

    })();

    window.sphere = undefined;
    recomputeSphere();
};

function render() {
    stats.begin();
    requestAnimationFrame(render);

    controls.update();

    renderer.render(scene, camera);
    stats.end();
}

function recomputeSphere() {
    if(sphere != undefined) {
        scene.remove(sphere);
    }
    sphere = new Sphere(12, 4, 10, 5, .5, new THREE.Vector2(1, 1));
    scene.add(sphere);
}

init();
render();
