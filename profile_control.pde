void setup() {
    size(150, 300);
    points = [];
    points.push(new Point(width/2, height, true));
    points.push(new Point(width/2, height/2, false));
    points.push(new Point(width/2, 0, true));
    updateProfile();
}

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

void mouseDragged() {
    //get closest point
    var draggedOption = _.filter(points, function (pt) {
        return dist(pt.x, pt.y, mouseX, mouseY) < 25;
    }).slice(0, 1);

    _.each(draggedOption, function (pt) {
        pt.trySetPosition(mouseX, mouseY);
    });
    updateProfile();
}

/* void draw() { */
/*     background(0); */
/*  */
/*     //draw line down center */
/*     stroke(64); */
/*     float DASH_LEN = 13, */
/*           SPACE_LEN = 7; */
/*     for(int y = 0; y < height; y += DASH_LEN+SPACE_LEN) { */
/*         line(width/2, y, width/2, y+DASH_LEN); */
/*     } */
/*  */
/*     //draw profile */
/*     var profile = $('#canvas_profile')[0].profile; */
/*  */
/*     stroke(255); */
/*     strokeWeight(2); */
/*     noFill();  */
/*  */
/*     beginShape(); */
/*     for(float t = 0; t <= 1; t += .1) { */
/*         vertex(profile.getPointAt(t).x, profile.getPointAt(t).y); */
/*     } */
/*     endShape(); */
/*  */
/*     //draw points */
/*     _.each(points, function (pt) { */
/*         fill(255); */
/*         noStroke(); */
/*         ellipse(pt.x, pt.y, 25, 25); */
/*     }); */
/* } */

void updateProfile() {
    /* var profile = new THREE.SplineCurve([points[0].toVector2(), points[1].toVector2(), points[2].toVector2()]); */
    /* var profile = new THREE.SplineCurve([points[0], points[1], points[2]]); */
    console.log(points);

    var points = [points[0].toVector2(), points[1].toVector2(), points[2].toVector2()];
    var profile = new THREE.SplineCurve(points);
    console.log(profile);
    $('#canvas_profile')[0].profile = profile;
    
    window.shouldUpdateUI = true;
}
