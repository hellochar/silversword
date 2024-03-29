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

function projectScalar(a, b) {
    return a.dot(b) / b.length();
}

function to3D(v2) {
    return new THREE.Vector3(v2.x, v2.y, 0);
}

// Given Vector2's A and B, return the amount required to rotate around the +Z axis to make A parallel to B
// no unit vectors needed
function angleFrom(a, b) {
    //taken from http://d-rob.org/blog/2011/06/angle-vector-to-another/
    return Math.atan2( a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y );
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

    /* Looking at a trapezoid head on, the pointsBase array looks like:
                           3                       2
                               +----------------+
                               +                +
                         y    ++                ++
                        axis  +                  +
                             ++                  ++
                             +                    +
                 ^          ++                    ++
                 |          +                      +
                 |         ++                      ++
                 |         +------------------------+
                 |                  x axis
                 |        0                          1
      + latitude |        origin
      (constant  |
      longitude) |
                 |
                 |
                 |
                 +----------------->
                    + longitude (constant latitude)
    */
    var pointsBase = this.pointsBase = [];
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex)));
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex)));
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex+1)));
    pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex+1)));

    this.origin = pointsBase[0].clone();

    var xAxis = new THREE.Vector3().subVectors(pointsBase[1], this.origin);
    var yAxis = new THREE.Vector3().subVectors(pointsBase[3], this.origin);
    this.normal = new THREE.Vector3().crossVectors(xAxis, yAxis).negate().normalize();

    //make xAxis the length of the longer horizontal edge of the trapezoid
    var longerLength = Math.max(pointsBase[0].distanceTo(pointsBase[1]),
                                pointsBase[3].distanceTo(pointsBase[2]));
    xAxis.setLength( longerLength );

    //perpendicularize the yAxis
    var yProjectedOnX = xAxis.clone().setLength( yAxis.dot( xAxis.clone().normalize() ) );
    yAxis.sub( yProjectedOnX );


    var pointsTop = this.pointsTop = _.map(pointsBase, function (v3) { return v3.clone(); });

    //extrude up
    var height = sphere.diameter * sphere.extrudeZ * sphere.profileScalar(latIndex + .5); // add 0.5 to average out the location where you're sampling
    _.each(pointsTop, function (vector) {
        vector.add(this.normal.clone().setLength(height));
    }.bind(this));

    //aperture
    var apertureCenter = _.reduce(pointsTop, function (memo, vec) { return memo.add(vec); }, new THREE.Vector3()).multiplyScalar(1/4);
    _.each(pointsTop, function (vector) {
        //lerp towards center by aperture amount
        lerp(vector, apertureCenter, sphere.aperture);
    });

    //skew
    _.each(pointsTop, function (vector) {
        vector.
            add(xAxis.clone().multiplyScalar( - sphere.skew.x)).
            add(yAxis.clone().multiplyScalar(sphere.skew.y));
    }.bind(this));


    //set up the Geometry variables
    this.vertices = this.vertices.concat(pointsBase);
    this.vertices = this.vertices.concat(pointsTop);

    for(var i = 0; i < 4; i += 1) {
        var face = new THREE.Face4(i, i+4, (i+1)%4+4, (i+1)%4);
        face.normal = this.vertices[face.b].clone().sub(this.vertices[face.a]).cross(
                      this.vertices[face.d].clone().sub(this.vertices[face.a])).normalize();
        //face.vertexNormals.push(1,2,3,4);
        this.faces.push( face );
    }

    this.computeCentroids();

}

TrapezoidGeometry.prototype = Object.create( THREE.Geometry.prototype );

// Transform a Face4 into its 2D version
TrapezoidGeometry.prototype.faceTo2D = function(face) { //should be a Face4
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
        var p = point.clone().sub(a);
        var xValue = projectScalar(p, x3),
            yValue = projectScalar(p, y3);
        return new THREE.Vector2(xValue, yValue);
    }

    var pointsLocal = [face.a, face.b, face.c, face.d].map(function (idx) {
        return this.vertices[idx];
    }.bind(this)).map(pointToLocal2D);

    return pointsLocal;
}

//return face2D transformed to line up the edge with the end of reference
TrapezoidGeometry.prototype.faceToTrapezoid = function(face2D, reference) {
    var oldDC = reference[2].clone().sub(reference[3]);
    var newAB = face2D[1].clone().sub(face2D[0]);


    var origin = to3D(reference[3]);
    var rotationMatrix = new THREE.Matrix4().makeRotationZ( angleFrom(newAB, oldDC) );

    return face2D.map(function (pt) {
        var txPt3 = to3D(pt);
        txPt3.applyMatrix4( rotationMatrix );
        txPt3.add( origin );

        return new THREE.Vector2(txPt3.x, txPt3.y);
    });
}


/*
 *  Returns a 10 element Array of Vector2D's.
 *
 */
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

    // all 4 faces in 2D, in the order RBLT
    var faces2D = [this.faces[3], this.faces[0], this.faces[1], this.faces[2]].map(this.faceTo2D.bind(this));

    var face0 = faces2D[0];
    var face1 = this.faceToTrapezoid(faces2D[1], face0);
    var face2 = this.faceToTrapezoid(faces2D[2], face1);
    var face3 = this.faceToTrapezoid(faces2D[3], face2);

    //fullUnrolled is pyramidal
    var fullUnrolled =
           [
               face0[0], face0[1],
               face1[0], face1[1],
               face2[0], face2[1],
               face3[0], face3[1],
               face3[3], face3[2]      //We have to add the last points in the reverse order since that's how they're stored
           ];


    var fanlikeUnrolled = (function () {
        // Flip it in the y-coordinate
        // Rotate such that vector 2->10 is parallel to +x
        // Move point 2 to have y=0, point 1 to have x=0
        // Keep the indexing scheme

        var flipped = fullUnrolled.map(function (pt) {
            return new THREE.Vector2( pt.x, -pt.y );
        });

        var rotAngle = angleFrom(flipped[9].clone().sub(flipped[1]), new THREE.Vector2(1, 0));
        var rotationMatrix = new THREE.Matrix4().makeRotationZ( rotAngle );
        var rotated = flipped.map(function (pt) {
            var pt3 = to3D(pt).applyMatrix4(rotationMatrix);

            return new THREE.Vector2(pt3.x, pt3.y);
        });

        var translation = new THREE.Vector2( -rotated[0].x, -rotated[1].y );
        var translated = rotated.map(function (pt) {
            return new THREE.Vector2(pt.x + translation.x, pt.y + translation.y);
        });

        return translated;
    })();

    return fanlikeUnrolled;
}

THREE.Vector2.prototype.toString = function() { return "" + this.x.toFixed(5) + ',' + this.y.toFixed(5); };
function ppPoints(trap) {
    return trap.map(function (pt) { return pt.toString(); }).join("\n");
}

function ppPointsArr(traps) {
    return traps.map(ppPoints).join("\n\n");
}

function len01(trap) { return trap[0].clone().sub(trap[1]).length(); }
function len23(trap) { return trap[2].clone().sub(trap[3]).length(); }
