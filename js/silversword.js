(function() {

    var BASE_PRICE = 100; //dollars
    var PREASSEMBLED_COST = 50; //dollrs

    function resetUIElements() {
        //setting up elements
        $('#slider_lat').slider({
            min: 3,
            max: 8,
            value: 7
        });
        $('#slider_lon').slider({
            min: 6,
            max: 18,
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
            min: 0,
            max: 1,
            step: (1 - 0) / $('#slider_extrudeZ').width(),
            value: 0.3
        });
        $('#slider_aperture').slider({
            min: 0,
            max: .8,
            step: (.8 - 0) / $('#slider_aperture').width(),
            value: .4
        });

        $('.slider').on( "slide", function(evt, ui) {
            window.shouldUpdateUI = true;
        });

        $('#buy_me').click(function(evt) {
            /*
             * # lat
             * # lon
             * coordinate points
             */
            var txtLines = [sphere.NUM_LAT, sphere.NUM_LON];
            sphere.unrollAll().forEach(function (unrolledTrapezoid) {
                unrolledTrapezoid.forEach(function (pt) {
                    txtLines.push(pt.x.toFixed(5));
                    txtLines.push(pt.y.toFixed(5));
                });
            });
            
            var text = txtLines.join("\r\n");
            console.log(text);
            $.post("/submit_order.php",
                {
                    data : text
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

    function initializeCheckbox() {
        $("#pre-assembled").click(function(x) {
            var isChecked = $("#pre-assembled")[0].checked;
            $("#pre-assembled")[0].checked = !isChecked;

            updateView();
        });

        function updateView() {
            var isChecked = $("#pre-assembled")[0].checked;
            if(isChecked) {
                $("#checkmark").show();
            } else {
                $("#checkmark").hide();
            }
            window.shouldUpdateUI = true;
        }

        $("#pre-assembled")[0].checked = false;
        updateView();
    }
    initializeCheckbox();

    function updateUI() {
        var NUM_LON = $('#slider_lon').slider("value");
        var NUM_LAT = $('#slider_lat').slider("value");
        var diameter = $('#slider_diameter').slider("value");
        var extrudeZ = $('#slider_extrudeZ').slider("value");
        var aperture = 0.8 - $('#slider_aperture').slider("value");
        var skew = $('#canvas_skew')[0].skew || new THREE.Vector2(1, 1);
        var profile = $('#canvas_profile')[0].profile || new THREE.SplineCurve([new THREE.Vector2(1, 0), new THREE.Vector2(1, .5), new THREE.Vector2(1, 1)]);

        var preAssembled = $("#pre-assembled")[0].checked;

        recomputeSphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture, skew, profile);


        //taken from https://github.com/mrdoob/three.js/issues/581#issuecomment-14000527
        function getCompoundBoundingBox(object3D) {
            var box = null;
            object3D.traverse(function (obj3D) {
                var geometry = obj3D.geometry;
                if (geometry === undefined) return;
                geometry.computeBoundingBox();
                if (box === null) {
                    box = geometry.boundingBox;
                } else {
                    box.union(geometry.boundingBox);
                }
            });
            return box;
        }

        var totalBB = getCompoundBoundingBox(sphere);
        var totalHeight = totalBB.max.y - totalBB.min.y,
            totalDiameter = totalBB.max.x - totalBB.min.x; //the z coordinate would work here too
        $('#dimensions_indicator').text( totalHeight.toFixed(2) +'" x ' + totalDiameter.toFixed(2) +'"');

        var cost = BASE_PRICE;
        if(preAssembled) cost += PREASSEMBLED_COST;
        
        $('#cost_indicator').text('$' + cost.toFixed(2));

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
        var $container = $('#container');

        // set the scene size
        var WIDTH = $container.width(), HEIGHT = $container.height();

        // set some camera attributes
        var VIEW_ANGLE = 60,
            ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1,
            FAR = 10000;

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

            function makeThickArrowMesh(params) {
                var material = new THREE.MeshPhongMaterial(params);

                var arrowBase = new THREE.CylinderGeometry(.3, .3, 3, 20, 1, true);
                arrowBase.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 1.5, 0 ) );

                var arrowTip = new THREE.CylinderGeometry(0, .7, 1.5, 20, 1, false);
                arrowTip.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 3 + 0.75, 0 ) );

                THREE.GeometryUtils.merge(arrowBase, arrowTip);

                return new THREE.Mesh(arrowBase, material);
            }

            var axis = new THREE.Object3D();

            //same dark red color as the bottom of the "Buy Your Lamp" button
            var topArrow = makeThickArrowMesh({color: 0x9A003C, ambient: 0xFF0063});
            axis.add(topArrow);

            var xyParams = {color: 0xbbbbbb, ambient: 0x808080};
            var xArrow = makeThickArrowMesh(xyParams);
            xArrow.rotation.set( 0, 0, -Math.PI / 2 );
            axis.add(xArrow);

            var zArrow = makeThickArrowMesh(xyParams);
            zArrow.rotation.set( Math.PI / 2, 0, 0 );
            axis.add(zArrow);

            var ball = new THREE.Mesh(new THREE.SphereGeometry(.6), new THREE.MeshLambertMaterial({color: 0xffffff, emissive: 0x808080}));
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
})();
