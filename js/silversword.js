(function($) {

    var BASE_PRICE, PREASSEMBLED_COST; // in dollars

    var shouldUpdateUI = false;

    window.requestUpdateUI = function() {
        shouldUpdateUI = true;
    }

    paramStateToJSON = function() {
        return {
            longitudes: $('#slider_lon').slider("value"),
            latitudes: $('#slider_lat').slider("value"),
            diameter: $('#slider_diameter').slider("value"),
            extrudeZ: $('#slider_extrudeZ').slider("value"),
            aperture: $('#slider_aperture').slider("value"),
            skew: $('#canvas_skew')[0].skew,
            profile: $('#canvas_profile')[0].profile
        };
    }

    THREE.SplineCurve.prototype.toJSON = function() { return this.points; }
    paramStateToFlatJSON = function() {
        var nested = paramStateToJSON();

        return JSON.parse(JSON.stringify(nested));
    }

    // Mutates state of sliders and processing sketches
    tryLoadParamStateFromFlatJSON = function(json) {
        var sliders = {
            longitudes: $('#slider_lon'),
            latitudes: $('#slider_lat'),
            diameter: $('#slider_diameter'),
            extrudeZ: $('#slider_extrudeZ'),
            aperture: $('#slider_aperture'),
            skew: function(skew) {
                Processing.getInstanceById("canvas_skew").setSkew(skew.x, skew.y);
            },
            profile: function(profile) {
                if( !Processing.getInstanceById("canvas_profile").setProfileModel ) {
                    debugger
                }
                Processing.getInstanceById("canvas_profile").setProfileModel(profile);
            }
        };

        // _.keys(json) has three options:
        //      has less than all of the keys in slider (fail)
        //      has exactly all of the keys in slider (ok)
        //      has more than all of the keys in slider (ok)
        //
        // how to detect if it has less than all the keys in slider
        //      if the intersection of json and sliders has as many elements as sliders,
        //      we're good
        if(_.intersection( _.keys(json), _.keys(sliders) ).length < _.keys(sliders).length ) {
            return;
        }

        for(var key in sliders) {
            if($.type(sliders[key]) == "function") {
                sliders[key](json[key]);
            } else {
                sliders[key].slider("value", json[key]);
            }
        }
    }

    stateToURL = function() {
        var json = paramStateToFlatJSON();
        var location = window.location;

        //there may be params other than the SS ones. We want to keep those other ones intact, but
        //overwrite the SS params if they're already set.
        //
        //1) get all params, turn into Object
        //2) set the keys for specifically the json keys
        //3) convert Object back into query string

        allParams = $.url().param();
        _.extend(allParams, json);
        return location.protocol + "//" + location.host + location.pathname + "?" + $.param(allParams);
    }

    tryLoadStateFromURL = function() {
        var jsonStringValues = $.url().param();
        json = JSON.parse(JSON.stringify(jsonStringValues), function(key, value) {
            if( !isNaN(parseFloat(value)) ) {
                return parseFloat(value);
            }
            return value;
        });
        tryLoadParamStateFromFlatJSON(json);
    }

    function resetUIElements(allSliderParameters) {
        for(var sliderName in allSliderParameters) {
            var $slider = $({
                latitude: '#slider_lat',
                longitude: '#slider_lon',
                diameter: '#slider_diameter',
                coneHeight: '#slider_extrudeZ',
                aperture: '#slider_aperture'
            }[sliderName]);

            var userParameters = allSliderParameters[sliderName];

            var parameters = {
                min: userParameters.min, //required
                max: userParameters.max, //required
                value: userParameters['default'],
                step: userParameters['step'],
                isRTL: userParameters['isRTL']
            }

            _.defaults(parameters, {
                value: (parameters.min + parameters.max) / 2,
                step: (parameters.max - parameters.min) / $slider.width()
            });

            $slider.slider(parameters);
        }

        $('.slider').bind( "slide", function(evt, ui) {
            requestUpdateUI();
        });

        $('#add_to_cart').click(function(evt) {
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

            // Add a black background when sending to email
            renderer.setClearColorHex(0x000000, 1);
            renderer.render(scene, camera);
            var imageData = renderer.domElement.toDataURL().replace(/^data:image\/(png|jpg);base64,/, "");
            renderer.setClearColorHex(0x000000, 0);
            $.post("/submit_order.php",
                {
                    data : text,
                    ss_url : stateToURL(),
                    imageData : imageData
                },
                function (data, status, jqXHR) {
                    if(status != "success") {
                        alert("something went wrong: " + data);
                    }
                    else {
                        alert(data);
                    }
                });
        });

        $("#share_popup").dialog({
            autoOpen: false,
            modal: true,
            draggable: false,
            resizable: false,
            width: 600
        });

        $("#share").click(function(evt) {
            var url = stateToURL();
            $("#share_popup").dialog( "open" );
            $("#share_popup .share_link").attr("href", url).text(url).blur();
        });
        $("#share_popup_close").click(function(evt) {
            $("#share_popup").dialog("close");
        });
    }

    function initializeCheckbox(defaultChecked) {
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
            requestUpdateUI();
        }

        $("#pre-assembled")[0].checked = !!defaultChecked;
        updateView();
    }

    function updateUI() {
        var NUM_LON = $('#slider_lon').slider("value");
        var NUM_LAT = $('#slider_lat').slider("value");
        var diameter = $('#slider_diameter').slider("value");
        var extrudeZ = $('#slider_extrudeZ').slider("value");
        var aperture = $('#slider_aperture').slider("value");
        var skew = $('#canvas_skew')[0].skew;
        var profile = $('#canvas_profile')[0].profile;

        var preAssembled = $("#pre-assembled")[0].checked;

        recomputeSphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture, skew, profile);


        if(window.sphere) {
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
        }

        var cost = BASE_PRICE;
        if(preAssembled) cost += PREASSEMBLED_COST;
        
        $('#cost_indicator').text('$' + cost.toFixed(2));

        shouldUpdateUI = false;
    }

    function recomputeSphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture, skew, profile) {
        if(sphere != undefined) {
            scene.remove(sphere);
        }
        if(_.any(arguments, function(arg) { return arg === undefined; })) {
            // exit early if some of the arguments aren't ready yet (AKA skew/profile still downloading)
            return;
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

        renderer = Detector.webgl ? new THREE.WebGLRenderer({preserveDrawingBuffer : true }) : new THREE.CanvasRenderer();
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

            //same dark red color as the bottom of the "Add to Cart" button
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
        requestUpdateUI();

    };

    function render() {
        stats.begin();
        requestAnimationFrame(render);

        controls.update();
        camera.updateMatrix();
        camera.updateMatrixWorld(true);

        if(shouldUpdateUI) {
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

    (function() {
        var skew_loaded = false,
            profile_loaded = false,
            parameters = false;

        // poor man's promises

        $(window).bind("skew_control_loaded", function() {
            skew_loaded = true;
            tryInitialize();
        });

        $(window).bind("profile_control_loaded", function() {
            profile_loaded = true;
            tryInitialize();
        });

        $.get('parameters.txt', function(paramsAsString) {
            parameters = jsyaml.load(paramsAsString);
            window.SS_PARAMETERS = parameters;
            Processing.loadSketchFromSources($("#canvas_skew")[0], ["pde/skew_control.pde"]);
            tryInitialize();
        });

        function tryInitialize() {
            if( skew_loaded === true && profile_loaded === true &&
                !!(parameters) === true) {
                initializeCheckbox(parameters.preassemble);
                BASE_PRICE = parameters.BASE_PRICE || 149.99; //default costs in case they're not specified
                PREASSEMBLED_COST = parameters.PREASSEMBLED_COST || 50.00;

                resetUIElements(parameters);

                if(! _.isEmpty($.url().param()) ) {
                    try {
                        tryLoadStateFromURL();
                    } catch(err) {
                        //TODO modal dialog for bad configuration
                        throw err;
                    }
                }
                init();
                render();
            }
        }
    })();

})(jQuery);
