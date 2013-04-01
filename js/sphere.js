function Sphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture, skew, profile) {
    THREE.Object3D.call(this);

    this.OPENING_DIAMETER = 5;

    this.NUM_LON = NUM_LON;
    this.NUM_LAT = NUM_LAT;
    this.diameter = diameter;
    this.extrudeZ = extrudeZ;
    this.aperture = aperture;
    this.skew = skew;
    this.profile = profile;

    this.latStart = -Math.acos(this.OPENING_DIAMETER/this.diameter);
    this.latEnd = -this.latStart;

    for(var lonIndex = 0; lonIndex < this.NUM_LON; lonIndex+=1) {
        for(var latIndex = 0; latIndex < this.NUM_LAT; latIndex+=1) {
            var geometry = new TrapezoidGeometry(this, lonIndex, latIndex);
            var materialFill = new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                side: THREE.DoubleSide
            });
            // var materialStroke = new THREE.MeshLambert
            var mesh = new THREE.Mesh(geometry, materialFill);
            mesh.overdraw = true;
            this.add(mesh);
        }
    }
}
Sphere.prototype = Object.create( THREE.Object3D.prototype );

Sphere.prototype.profileScalar = function(latIndex) {
    var latitude = this.toLatAngle(latIndex);
    var x = THREE.Math.mapLinear(Math.sin(latitude), Math.sin(this.latStart), Math.sin(this.latEnd), 0, 1);
    var yFromX = function(xTarget) {
        var xTolerance = 0.0001; //adjust as you please
        var myBezier = function(t) {
            return this.profile.getPointAt(t);
        }.bind(this);

        //establish bounds
        var lower = 0;
        var upper = 1;
        var percent = (upper + lower) / 2;

        //get initial x
        var x = myBezier(percent).x;

        //loop until completion
        while(Math.abs(xTarget - x) > xTolerance) {
            if(xTarget > x) 
                lower = percent;
            else 
                upper = percent;

            percent = (upper + lower) / 2;
            x = myBezier(percent).x;
        }
        //we're within tolerance of the desired x value.
        //return the y value.
        return myBezier(percent).y;
    }.bind(this);
    
    return yFromX(x);
}

Sphere.prototype.toLonAngle = function(lonIndex) {
    return THREE.Math.mapLinear(lonIndex, 0, this.NUM_LON, 0, Math.PI*2);
}

Sphere.prototype.toLatAngle = function(latIndex) {
    return THREE.Math.mapLinear(latIndex, 0, this.NUM_LAT, this.latStart, this.latEnd);
}
