Vector fromSpherical(float radius, float lon, float lat) {
    return $V([radius * cos(lon) * cos(lat), radius * sin(lon) * cos(lat), radius * sin(lat)]);
}
window.fromSpherical = fromSpherical;

//=============================================
//              MODEL
//=============================================

class Trapezoid {
    int lonIndex, latIndex;

    Vector[] pointsBase, pointsTop;

    Sphere sphere;

    Vector origin, normal, x, y; //Z

    Trapezoid(Sphere sphere, int lonIndex, int latIndex) {
        this.lonIndex = lonIndex;
        this.latIndex = latIndex;

        this.sphere = sphere;

        float diameter = sphere.diameter;
        float extrudeZ = sphere.extrudeZ;

        toLonAngle = sphere.toLonAngle;
        toLatAngle = sphere.toLatAngle;

        pointsBase = [];
        pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex)));
        pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex)));
        pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex+1)));
        pointsBase.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex+1)));

        origin = pointsBase[0];

        x = pointsBase[1].subtract(origin);
        y = pointsBase[3].subtract(origin);

        normal = x.cross(y);

        pointsTop = [];
        pointsTop.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex)));
        pointsTop.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex)));
        pointsTop.push(fromSpherical(diameter/2, toLonAngle(lonIndex+1), toLatAngle(latIndex+1)));
        pointsTop.push(fromSpherical(diameter/2, toLonAngle(lonIndex), toLatAngle(latIndex+1)));

        //extrude up
        pointsTop = pointsTop.map(function (vector) {
            return vector.add(normal.toUnitVector().multiply(extrudeZ));
        });

        //aperture
        Vector centerPoint = origin.add(x.multiply(.5)).add(y.multiply(.5));
        pointsTop = pointsTop.map(function (vector) {
            //lerp towards center by aperture amount
            return vector.lerp(centerPoint, sphere.aperture);
        });


    }

    void vertex3(Vector vector) {
        vertex(vector.elements[0], vector.elements[1], vector.elements[2]);
    }

    void draw() {
        for(int i = 0; i < 4; i++) {
            vertex3(pointsBase[i]);
            vertex3(pointsTop[i]);
            vertex3(pointsTop[(i+1)%4]);
            vertex3(pointsBase[(i+1)%4]);
        }

    }
}

class Sphere {

    Trapezoid[] trapezoids;
    float latStart, latEnd;


    public final float OPENING_DIAMETER = 5;


    int NUM_LON; //divisible by 3
    int NUM_LAT;

    float diameter;

    float extrudeZ;

    float aperture; //[0..1]

    // Vec2 skew = [0, 0]; //vec2 in some range

    // Bezier profileModifier = bezierCurve; //3 points

    Sphere(NUM_LON, NUM_LAT, diameter, extrudeZ, aperture/*, skew, profileModifier*/) {
        this.NUM_LON = NUM_LON;
        this.NUM_LAT = NUM_LAT;
        this.diameter = diameter;
        this.extrudeZ = extrudeZ;
        this.aperture = aperture;

        this.latStart = -acos(OPENING_DIAMETER/this.diameter);
        this.latEnd = -latStart;

        this.trapezoids = [];
        for(int lonIndex = 0; lonIndex < NUM_LON; lonIndex++) {
            for(int latIndex = 0; latIndex < NUM_LAT; latIndex++) {
                this.trapezoids.push(new Trapezoid(this, lonIndex, latIndex));
            }
        }
    }

    void draw() {
        beginShape(QUADS);
        trapezoids.forEach(function (trapezoid) {
            trapezoid.draw();
        });
        endShape();
    }

    float toLonAngle(int lonIndex) {
        return map(lonIndex, 0, NUM_LON, 0, TWO_PI);
    }

    float toLatAngle(int latIndex) {
        return map(latIndex, 0, NUM_LAT, latStart, latEnd);
    }


}


Sphere sphere;

float r = 0;
void setup() {
    size(600, 600, P3D);
    sphere = new Sphere(12, 4, 10, 5, .5);
    window.sphere = sphere;
    smooth();
}
void draw() {
    background(0);

    //get total diameter

    float totalDiameter = sphere.diameter + sphere.extrudeZ * 2;

    /* translate(width/2, height/2, 0); */
    camera(width/2, height/2, width/2, 0, 0, 0, 0, 0, -1);
    window.p = this;
    scale(width / (totalDiameter * 1.5));
    rotateZ(r += 0.01);

    strokeWeight(1);

    stroke(255, 0, 0);
    line(0, 0, 0, 100, 0, 0);
    stroke(0, 255, 0);
    line(0, 0, 0, 0, 100, 0);
    stroke(0, 0, 255);
    line(0, 0, 0, 0, 0, 100);

    /* ambientLight(128); */
    /* directionalLight(128, 128, 128, 0, 1, 0); */
    lights();

    fill(255, 255, 255);
    stroke(255, 255, 255);
    sphere.draw();

    $('#fps').text(frameRate);
}

