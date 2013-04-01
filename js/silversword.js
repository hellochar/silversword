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

    renderer = new THREE.CanvasRenderer({
    });
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
    controls.noPan = true;

    controls.staticMoving = false;
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

    var dirLight = new THREE.DirectionalLight( 0x606060 );
    dirLight.position.set( 0, .5, .5 ); 
    scene.add(dirLight);

    var dirLight = new THREE.DirectionalLight( 0x606060 );
    dirLight.position.set( .8, .2, -.5 ); 
    scene.add(dirLight);

    scene.add(new THREE.AmbientLight( 0x404040 ));

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
    //DEFAULT SPHERE
    sphere = new Sphere(
                21,     //num lon
                10,      //num lat
                10,     //diameter
                8,      //extrudeZ
                .5,     //aperture
                new THREE.Vector2(1, 5), //skew
                new THREE.SplineCurve([new THREE.Vector2(0, 1), new THREE.Vector2(.5, 2), new THREE.Vector2(1, 1)]) //profile
            );


    scene.add(sphere);
}

init();
render();
