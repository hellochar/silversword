function resetUIElements() {
    //setting up elements
    $('#slider_lat').slider({
        min: 3,
        max: 30,
        value: 7
    });
    $('#slider_lon').slider({
        min: 6,
        max: 30,
        step: 3,
        value: 15
    });
    $('#slider_diameter').slider({
        min: 6,
        max: 30,
        step: (30 - 6) / $('#slider_diameter').width(),
        value: 10
    });
    $('#slider_extrudeZ').slider({
        min: 1,
        max: 10,
        step: (10 - 1) / $('#slider_extrudeZ').width(),
        value: 4
    });
    $('#slider_aperture').slider({
        min: 0,
        max: .9,
        step: (.9 - 0) / $('#slider_aperture').width(),
        value: .5
    });

    $('.slider').on( "slide", function(evt, ui) {
        window.shouldUpdateUI = true;
    });

    $('#buy_me').click(function(evt) {
        var data = "";
        data += "4\n";
        data += "8\n";
        $.post("/submit_order.php",
            {
                data : data
            },
            function (data, status, jqXHR) {
                console.log(arguments);
                if(status != "success") {
                    alert("something went wrong: " + data);
                }
                else {
                    alert(data);
                }
            });
    });
}
resetUIElements();

function updateUI() {
    var NUM_LON = $('#slider_lon').slider("value");
    var NUM_LAT = $('#slider_lat').slider("value");
    var diameter = $('#slider_diameter').slider("value");
    var extrudeZ = $('#slider_extrudeZ').slider("value");
    var aperture = $('#slider_aperture').slider("value");
    var skew = $('#canvas_skew')[0].skew || new THREE.Vector2(1, 1);
    var profile = $('#canvas_profile')[0].profile || new THREE.SplineCurve([new THREE.Vector2(1, 0), new THREE.Vector2(1, .5), new THREE.Vector2(1, 1)]);

    recomputeSphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture, skew, profile);

    window.shouldUpdateUI = false;
}

function recomputeSphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture, skew, profile) {
    if(sphere != undefined) {
        scene.remove(sphere);
    }

    //DEFAULT SPHERE
    sphere = new Sphere(
            NUM_LON,
            NUM_LAT,
            diameter,
            extrudeZ,
            aperture,
            skew,
            profile
            );


    scene.add(sphere);
}

function init() {
    // set the scene size
    var WIDTH = 624, HEIGHT = 430;

    // set some camera attributes
    var VIEW_ANGLE = 60,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // get the DOM element to attach to
    // - assume we've got jQuery to hand
    var $container = $('#container');

    renderer = Detector.webgl ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
            ASPECT,
            NEAR,
            FAR  );
    scene = new THREE.Scene();
    // axisScene = new THREE.Scene();

    // the camera starts at 0,0,0 so pull it back
    camera.position.set( 10, 10, 20 );

    // start the renderer
    renderer.setSize(WIDTH, HEIGHT);

    // attach the render-supplied DOM element
    $container.append(renderer.domElement);


    controls = new THREE.TrackballControls( camera, renderer.domElement );
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
    stats.domElement.style.position = 'relative';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    // $container.append( stats.domElement );

    // and the camera
    scene.add(camera);

    function addLightsTo(scene) {
        var dirLight = new THREE.DirectionalLight( 0x555555 );
        dirLight.position.set( 0, -.5, -.5 );
        scene.add(dirLight);

        var dirLight = new THREE.DirectionalLight( 0x666666 );
        dirLight.position.set( 0, .5, -.5 );
        scene.add(dirLight);

        var dirLight = new THREE.DirectionalLight( 0x555555 );
        dirLight.position.set( -.8, -.2, .1 );
        scene.add(dirLight);

        var dirLight = new THREE.DirectionalLight( 0x888888 );
        dirLight.position.set( .1, .2, .9 );
        scene.add(dirLight);

        scene.add(new THREE.AmbientLight( 0x555555 ));
    }

    addLightsTo(scene);
    // addLightsTo(axisScene);

    var axis = (function () {

        function makeThickArrowMesh(color) {
            var material = new THREE.MeshLambertMaterial({color: color});

            var arrowBase = new THREE.CylinderGeometry(.4, .4, 3, 10, 1, true);
            arrowBase.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 1.5, 0 ) );

            var arrowTip = new THREE.CylinderGeometry(0, .8, 1.5, 10, 1, false);
            arrowTip.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 3 + 0.75, 0 ) );

            THREE.GeometryUtils.merge(arrowBase, arrowTip);

            return new THREE.Mesh(arrowBase, material);
        }

        var axis = new THREE.Object3D();

        var topArrow = makeThickArrowMesh(0xff0000);
        axis.add(topArrow);

        var xArrow = makeThickArrowMesh(0xffffff);
        xArrow.rotation.set( 0, 0, -Math.PI / 2 );
        axis.add(xArrow);

        var zArrow = makeThickArrowMesh(0xffffff);
        zArrow.rotation.set( Math.PI / 2, 0, 0 );
        axis.add(zArrow);

        var ball = new THREE.Mesh(new THREE.SphereGeometry(.6), new THREE.MeshLambertMaterial({color: 0xffffff}));
        axis.add(ball);

        var scale = 0.01;
        axis.scale.set( scale, scale, scale );

        return axis;
    })();

    window.axis = axis;
    scene.add(axis);
    // axisScene.add(axis);

    window.sphere = undefined;
    window.shouldUpdateUI = true;

};

function render() {
    stats.begin();
    requestAnimationFrame(render);

    controls.update();
    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    if(window.shouldUpdateUI) {
        updateUI();
    }
    updateAxisPosition();

    renderer.render(scene, camera);
    stats.end();
}

function updateAxisPosition() {

    var screenX = 55,
        screenY = 55;
    var vector = new THREE.Vector3( THREE.Math.mapLinear(screenX, 0, renderer.domElement.width, -1, 1),
                                    THREE.Math.mapLinear(screenY, 0, renderer.domElement.height, 1, -1),
                                    0.5 );
    var projector = new THREE.Projector();
    projector.unprojectVector( vector, camera );

    var dir = vector.sub( camera.position ).setLength( .5 );


    axis.position.copy( camera.position );
    axis.position.add( dir );

}

init();
render();
