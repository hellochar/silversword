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

    //trapezoids[x] holds the "right" Trapezoid for latitude index x
    this.trapezoids = [];

    for(var lonIndex = 0; lonIndex < this.NUM_LON; lonIndex+=1) {
        for(var latIndex = 0; latIndex < this.NUM_LAT; latIndex+=1) {
            var geometry = new TrapezoidGeometry(this, lonIndex, latIndex);
            var materialFill = new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                side: THREE.DoubleSide
            });

            var mesh = new THREE.Mesh(geometry, materialFill);
            this.add(mesh);

            if( this.trapezoids[latIndex] === undefined ) {
                this.trapezoids[latIndex] = geometry;
            }
        }
    }

}

Sphere.prototype = Object.create( THREE.Object3D.prototype );

/*
 *
 *  Returns an array of 10 element arrays of Vector2's
 */
Sphere.prototype.unrollAll = function() {
    return this.trapezoids.map(function (trapezoid) {
        return trapezoid.unroll();
    });
}

Sphere.prototype.getAttachmentText = function() {
    /*
     * # lat
     * # lon
     * coordinate points
     */
    var txtLines = [this.NUM_LAT, this.NUM_LON];
    this.unrollAll().forEach(function (unrolledTrapezoid) {
        unrolledTrapezoid.forEach(function (pt) {
            txtLines.push(pt.x.toFixed(5));
            txtLines.push(pt.y.toFixed(5));
        });
    });

    return txtLines.join("\r\n");
}

Sphere.prototype.profileScalar = function(latIndex) {
    var latitude = this.toLatAngle(latIndex);
    var y = THREE.Math.mapLinear(Math.sin(latitude), Math.sin(this.latStart), Math.sin(this.latEnd), 0, 1);
    var xFromY = function(yTarget) {
        var yTolerance = 0.0001; //adjust as you please
        var myBezier = function(t) {
            return this.profile.getPointAt(t);
        }.bind(this);

        //establish bounds
        var lower = 0;
        var upper = 1;
        var percent = (upper + lower) / 2;

        //get initial x
        var y = myBezier(percent).y;

        //loop until completion
        var iterations = 0;
        while(Math.abs(yTarget - y) > yTolerance) {
            iterations += 1;
            if(iterations > 100) {
                var k = 3;
            }
            if(yTarget > y)
                lower = percent;
            else
                upper = percent;

            percent = (upper + lower) / 2;
            y = myBezier(percent).y;
        }
        //we're within tolerance of the desired x value.
        //return the y value.
        return myBezier(percent).x;
    }.bind(this);
    
    return xFromY(y);
}

Sphere.prototype.toLonAngle = function(lonIndex) {
    return THREE.Math.mapLinear(lonIndex, 0, this.NUM_LON, 0, Math.PI*2);
}

Sphere.prototype.toLatAngle = function(latIndex) {
    return THREE.Math.mapLinear(latIndex, 0, this.NUM_LAT, this.latStart, this.latEnd);
}
