float minBound = -2,
      maxBound = 2;

void setup() {
    size(200, 200);
    mouseX = 150;
    mouseY = 50;
    updateSkew();
}

void draw() {
    if(mousePressed) {
        updateSkew();
    }

    background(32);
    var scalar = width / (maxBound - minBound);
    scale( scalar );
    translate( (maxBound - minBound) / 2, (maxBound - minBound) / 2 );

    strokeWeight(.25 / scalar );

    for(float r = minBound; r < maxBound; r += .125) {
        stroke(128);
        line(minBound, r, maxBound, r);
        line(r, minBound, r, maxBound);
    }

    strokeWeight(1 / scalar );
    stroke(255);
    line(minBound, 0, maxBound, 0);
    line(0, minBound, 0, maxBound);

    noStroke();
    fill(255);

    var skew = $('#canvas_skew')[0].skew;
    ellipse(skew.x, -skew.y, .25, .25);
}

void updateSkew() {
    float skewX = map(mouseX, 0, width,  minBound, maxBound);
    float skewY = map(mouseY, 0, height, maxBound, minBound);

    $('#canvas_skew')[0].skew = new THREE.Vector2(skewX, skewY);
    
    window.shouldUpdateUI = true;
}
