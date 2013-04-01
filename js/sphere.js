function Sphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture, skew) {
    THREE.Object3D.call(this);

    this.OPENING_DIAMETER = 5;

    this.NUM_LON = NUM_LON;
    this.NUM_LAT = NUM_LAT;
    this.diameter = diameter;
    this.extrudeZ = extrudeZ;
    this.aperture = aperture;

    this.skew = skew;

    this.latStart = -Math.acos(this.OPENING_DIAMETER/this.diameter);
    this.latEnd = -this.latStart;

    for(var lonIndex = 0; lonIndex < this.NUM_LON; lonIndex+=1) {
        for(var latIndex = 0; latIndex < this.NUM_LAT; latIndex+=1) {
            var geometry = new TrapezoidGeometry(this, lonIndex, latIndex);
            var materialFill = new THREE.MeshLambertMaterial({
                color: 0xFF0000,
                side: THREE.DoubleSide
            });
            // var materialStroke = new THREE.MeshLambert
            this.add(new THREE.Mesh(geometry, materialFill));
        }
    }
}

Sphere.prototype = Object.create( THREE.Object3D.prototype );

Sphere.prototype.toLonAngle = function(lonIndex) {
    return THREE.Math.mapLinear(lonIndex, 0, this.NUM_LON, 0, Math.PI*2);
}

Sphere.prototype.toLatAngle = function(latIndex) {
    return THREE.Math.mapLinear(latIndex, 0, this.NUM_LAT, this.latStart, this.latEnd);
}
