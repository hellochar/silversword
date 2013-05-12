function fromSpherical(radius, lon, lat) {
    return new THREE.Vector3(
            radius * Math.cos(lon) * Math.cos(lat),
            radius * Math.sin(lat),
            radius * Math.sin(lon) * Math.cos(lat)
            );
}

function lerp(vector, end, amount) {
    return vector.set(
        THREE.Math.mapLinear(amount, 0, 1, vector.x, end.x),
        THREE.Math.mapLinear(amount, 0, 1, vector.y, end.y),
        THREE.Math.mapLinear(amount, 0, 1, vector.z, end.z)
    );
}

function TrapezoidGeometry(sphere, lonIndex, latIndex) {
    THREE.Geometry.call(this);

    this.sphere = sphere;
    this.lonIndex = lonIndex;
    this.latIndex = latIndex;

    //convenience
    function toLonAngle(lonIndex) {
        return sphere.toLonAngle(lonIndex);
    }
    function toLatAngle(latIndex) {
        return sphere.toLatAngle(latIndex);
    }
    var diameter = sphere.diameter;

    var pointsBase = this.pointsBase = [];
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex)));
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex)));
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex+1)));
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex+1)));

    var pointsTop = this.pointsTop = _.map(pointsBase, function (v3) { return v3.clone(); });
    this.origin = pointsBase[0].clone();

    this.xAxis = new THREE.Vector3().subVectors(pointsBase[1], this.origin);
    this.yAxis = new THREE.Vector3().subVectors(pointsBase[3], this.origin);

    this.normal = new THREE.Vector3().crossVectors(this.xAxis, this.yAxis).negate();


    //extrude up
    var height = sphere.diameter * sphere.extrudeZ * sphere.profileScalar(latIndex + .5); // add 0.5 to average out the location where you're sampling
    _.each(pointsTop, function (vector) {
        vector.add(this.normal.clone().setLength(height));
    }.bind(this));

    //aperture
    var apertureCenter = pointsTop[0].clone().
                            add(this.xAxis.clone().multiplyScalar(.5)).
                            add(this.yAxis.clone().multiplyScalar(.5));

    _.each(pointsTop, function (vector) {
        //lerp towards center by aperture amount
        lerp(vector, apertureCenter, sphere.aperture);
    });

    //skew
    _.each(pointsTop, function (vector) {
        vector.
            add(this.xAxis.clone().multiplyScalar( - sphere.skew.x)).
            add(this.yAxis.clone().multiplyScalar(sphere.skew.y));
    }.bind(this));


    //set up the Geometry variables
    this.vertices = this.vertices.concat(pointsBase);
    this.vertices = this.vertices.concat(pointsTop);

    for(var i = 0; i < 4; i += 1) {
        var face = new THREE.Face4(i, i+4, (i+1)%4+4, (i+1)%4);
        //TODO add normals
        face.normal = this.vertices[face.b].clone().sub(this.vertices[face.a]).cross(
                      this.vertices[face.d].clone().sub(this.vertices[face.a])).normalize();
        //face.vertexNormals.push(1,2,3,4);
        this.faces.push( face );
    }

}

TrapezoidGeometry.prototype = Object.create( THREE.Geometry.prototype );

TrapezoidGeometry.prototype.unroll = function() {
    // for each face F:
    //      create a 2D coordinate system S_F
    //      express the face in the 2D system
    //      optionally: transform that 2D system relative to the previous face
    //
    // 2d coordinate system: +x_3 is D_3 - A_3
    // +z is orthogonal to +z; we compute it as +x cross (+x cross (B - A))
    // +y is orthogonal to both; we compute it as +y = +x cross -z
    //
    // now to project any point on the face into its 2D coordinate system:
    // A_2 = <project A onto +x; get its length from A, project A onto +y; get its length from A>
    //
    // now we've got (A,B,C,D)_2, in 2D
    //
    // how do you transform one coordinate system to another?
    //
    // e.g. D on face 1 is the A on face 2
    // so find the D_2 in S_1
    //      then set the +y in S_2 to be D_2 -> C_2, and the +x in S_2 to be orthogonal
    //
    //
    // so each face F has:
    //      a local 3D coordinate system; origin is at F.a
    //      a local 2D coordinate system; origin is at (0, 0)
    //      a way to transform global 3D to local 3D (this is done implicitly in conjunction with the next step)
    //      a way to transform local 3D to local 2D
    //      a way to transform local 2D to trapezoid-wide 2D
    //
    //
    // trapezoid-wide 2D plane is just the local 2D plane of the first face

    // Transform a Face4 into its 2D version
    var faceInLocal2D = function(face) { //should be a Face4
        var a = this.vertices[face.a],
            b = this.vertices[face.b],
            c = this.vertices[face.c],
            d = this.vertices[face.d];

        //define local 3D coordinate system
        var x3 = d.clone().sub(a).normalize();
        var z3 = x3.clone().cross( b.clone().sub(a) ).normalize();
        var y3 = z3.clone().cross( x3 );

        // Return a specific point in the Face4 into its 2D location
        function pointToLocal2D(point) {
            function projectScalar(a, b) {
                return a.dot(b) / b.length();
            }

            var p = point.clone().sub(a);
            var xValue = projectScalar(p, x3),
                yValue = projectScalar(p, y3);
            return new THREE.Vector2(xValue, yValue);
        }

        var pointsLocal = [face.a, face.b, face.c, face.d].map(function (idx) {
                              return this.vertices[idx];
                          }.bind(this)).map(pointToLocal2D);

        return pointsLocal;
    }.bind(this);

    // all 4 faces in 2D version
    var local2DFaces = this.faces.map(faceInLocal2D);

    //return face2DPoints transformed to line up the edge with the end of previousPoints
    function localPoints2DToTrapezoid(face2DPoints, previousPoints) {
        function to3D(v2) {
            return new THREE.Vector3(v2.x, v2.y, 0);
        }

        var oldDC = previousPoints[2].clone().sub(previousPoints[3]);
        var origin = previousPoints[3];

        var newAB = face2DPoints[1].clone().sub(face2DPoints[0]);
        var rotAngle = to3D(oldDC).angleTo(to3D(newAB));

        var transform = new THREE.Matrix4().makeFromPositionEulerScale( to3D(origin), new THREE.Vector3(0, 0, rotAngle), "XYZ", new THREE.Vector3(1,1,1) );

        return face2DPoints.map(function (pt) {
            var txPt3 = to3D(pt);
            txPt3.applyMatrix4(transform);

            return new THREE.Vector2(txPt3.x, txPt3.y);
        });
    }

    var face0 = local2DFaces[0];
    var face1 = localPoints2DToTrapezoid(local2DFaces[1], face0);
    var face2 = localPoints2DToTrapezoid(local2DFaces[2], face1);
    var face3 = localPoints2DToTrapezoid(local2DFaces[3], face2);

    return [
               face0[0], face0[1],
               face1[0], face1[1],
               face2[0], face2[1],
               face3[0], face3[1],
               face3[3], face3[2]      //We have to add the last points in this order
           ];
}
