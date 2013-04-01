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
    var height = sphere.extrudeZ * sphere.profileScalar(latIndex + .5);
    _.each(pointsTop, function (vector) {
        return vector.add(this.normal.clone().setLength(height));
    }.bind(this));

    //aperture
    var centerPoint = this.origin.clone().
                            add(this.xAxis.clone().multiplyScalar(.5)).
                            add(this.yAxis.clone().multiplyScalar(.5));

    _.each(pointsTop, function (vector) {
        //lerp towards center by aperture amount
        lerp(vector, centerPoint, sphere.aperture);
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

    this.computeCentroids();
    this.computeBoundingBox();
    this.computeBoundingSphere();

}

TrapezoidGeometry.prototype = Object.create( THREE.Geometry.prototype );
