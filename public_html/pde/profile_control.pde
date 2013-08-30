//all points are in screen coordinates
function Point(x, y, frozenY) {
    this.trySetPosition = function(x, y) {
        if(!this.frozenY) this.y = constrain(y, 0, height);
        this.x = constrain(x, 0, width);
    }
    //convert to multiplier coordinates
    this.toVector2 = function() {
        float xMapped = pow(2, map(this.x, 0, width, -1, 1)),
              yMapped = map(this.y, 0, height, 1, 0);
        return new THREE.Vector2(xMapped, yMapped);
    }

    this.hitsMe = function(x, y) {
        return dist(this.x, this.y, mouseX, mouseY) < this.radius;
    }




    this.trySetPosition(x, y);
    this.frozenY = frozenY;

    this.radius = 22;

}

float log2(float x) {
    return log(x) / log(2);
}

// Given multiplier coordinates, convert to screen coordinates
function fromVector2(v2) {
    float x = map(log2(v2.x), -1, 1, 0, width);
    float y = map(v2.y, 1, 0, 0, height);
    return new Point(x, y, false);
}

function updateProfile() {
    var pointsV2 = [points[0].toVector2(), points[1].toVector2(), points[2].toVector2()];
    var profile = new THREE.SplineCurve(pointsV2);
    jQuery('#canvas_profile')[0].profile = profile;

    window.Silversword.requestUpdateUI();
}



/* =============    OFF CANVAS DRAGGING       =========== */
function updateMousePosition(e) {
    var position = jQuery('#canvas_profile').offset();
    pmouseX = mouseX;
    pmouseY = mouseY;
    mouseX = e.pageX - position.left;
    mouseY = e.pageY - position.top;
}

function offCanvasMoveListener(e) {
    updateMousePosition(e);
    mouseDragged();
}

function offCanvasUpListener(e) {
    updateMousePosition(e);
    mousePressed = false;
    mouseReleased();
}

/* ======================================================== */

var draggedOption = [];
var points = [];

void setup() {
    size(93, 234);

    points.push(new Point(width/2, height, true));
    points.push(new Point(width/2, height/2, false));
    points.push(new Point(width/2, 0, true));
    updateProfile();
}

void getDraggedOption() {
    //get closest point
    var draggedOption = _.filter(points, function (pt) {
        return pt.hitsMe(mouseX, mouseY);
    }).slice(0, 1);

    return draggedOption;
}


float pressedX,
      pressedY,
      pressedPointX,
      pressedPointY;
void mousePressed() {
    pressedX = mouseX;
    pressedY = mouseY;
    draggedOption = getDraggedOption();

    _.each(draggedOption, function (pt) {
        pressedPointX = pt.x;
        pressedPointY = pt.y;
    });

    jQuery('html').bind('mousemove', offCanvasMoveListener).bind('mouseup', offCanvasUpListener);
}

void mouseReleased() {
    draggedOption = [];

    jQuery('html').unbind('mousemove', offCanvasMoveListener).unbind('mouseup', offCanvasUpListener);
}

void mouseDragged() {
    _.each(draggedOption, function (pt) {
        pt.trySetPosition(pressedPointX + mouseX - pressedX, pressedPointY + mouseY - pressedY);
        updateProfile();
    });
}

void draw() {
    background(48);

    //draw line down center
    stroke(64);
    float DASH_LEN = 13,
          SPACE_LEN = 7;
    for(int y = 0; y < height; y += DASH_LEN+SPACE_LEN) {
        line(width/2, y, width/2, y+DASH_LEN);
    }

    //draw profile
    var profile = jQuery('#canvas_profile')[0].profile;

    stroke(255);
    strokeWeight(2);
    noFill();

    beginShape();
    for(float t = 0; t <= 1; t += .02) {
        var scrnPoint = fromVector2(profile.getPointAt(t));
        vertex(scrnPoint.x, scrnPoint.y);
    }
    endShape();

    //draw points
    _.each(points, function (pt) {
        fill(255);
        noStroke();
        ellipse(pt.x, pt.y, 16, 16);
    });

    _.each(draggedOption, function (pt) {
        noFill();
        stroke(255);
        ellipse(pt.x, pt.y, pt.radius * 2, pt.radius * 2);
    });

}

//pointsArray is an array of 3 values of multiplier coordinates
void setProfileModel(pointsArray) {

    _.each(pointsArray, function (multiplierPoint, idx) {
        screenPoint = fromVector2(multiplierPoint);
        points[idx].trySetPosition(screenPoint.x, screenPoint.y);
    });

    updateProfile();
}

setTimeout(function() {
    jQuery(window).trigger("profile_control_loaded");
}, 0)

void fixLastFunctionNotExportedBug() {}
