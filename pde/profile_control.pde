//all points are in screen coordinates
function Point(x, y, frozenY) {
    this.x = x;
    this.y = y;
    this.frozenY = frozenY;

    this.trySetPosition = function(x, y) {
        if(!this.frozenY) this.y = y;
        this.x = x;
    }
    this.toVector2 = function() {
        float xMapped = pow(2, map(this.x, 0, width, -1, 1)),
              yMapped = map(this.y, 0, height, 1, 0);
        return new THREE.Vector2(xMapped, yMapped);
    }
}

float log2(float x) {
    return log(x) / log(2);
}

function fromVector2(v2) {

    float x = map(log2(v2.x), -1, 1, 0, width);
    float y = map(v2.y, 1, 0, 0, height);
    return new Point(x, y, false);
}

function updateProfile() {
    var points = this.points;
    var points = [points[0].toVector2(), points[1].toVector2(), points[2].toVector2()];
    var profile = new THREE.SplineCurve(points);
    // $('#canvas_profile')[0].profile = profile;
    $('#canvas_profile')[0].profile = profile;

    window.shouldUpdateUI = true;
}




void setup() {
    size(150, 300);

    this.draggedOption = [];

    this.points = [];
    this.points.push(new Point(width/2, height, true));
    this.points.push(new Point(width/2, height/2, false));
    this.points.push(new Point(width/2, 0, true));
    updateProfile.call(this);
}


void mousePressed() {
    //get closest point
    this.draggedOption = _.filter(this.points, function (pt) {
        return dist(pt.x, pt.y, mouseX, mouseY) < 25;
    }).slice(0, 1);
}

void mouseReleased() {
    this.draggedOption = [];
}

void mouseDragged() {
    _.each(this.draggedOption, function (pt) {
        pt.trySetPosition(mouseX, mouseY);
        updateProfile.call(this);
    }.bind(this));
}

void draw() {
    background(0);

    //draw line down center
    stroke(64);
    float DASH_LEN = 13,
          SPACE_LEN = 7;
    for(int y = 0; y < height; y += DASH_LEN+SPACE_LEN) {
        line(width/2, y, width/2, y+DASH_LEN);
    }

    //draw profile
    var profile = $('#canvas_profile')[0].profile;

    stroke(255);
    strokeWeight(2);
    noFill();

    beginShape();
    for(float t = 0; t <= 1; t += .02) {
        var scrnPoint = fromVector2(profile.getPointAt(t));
        // console.log(scrnPoint);
        vertex(scrnPoint.x, scrnPoint.y);
    }
    endShape();

    //draw points
    _.each(this.points, function (pt) {
        fill(255);
        noStroke();
        ellipse(pt.x, pt.y, 25, 25);
    });

    _.each(this.draggedOption, function (pt) {
        noFill();
        stroke(255);
        ellipse(pt.x, pt.y, 30, 30);
    });
}
