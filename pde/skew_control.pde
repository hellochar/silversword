float minBound = -2,
      maxBound = 2;

/* =============    OFF CANVAS DRAGGING       =========== */
function updateMousePosition(e) {
    var position = $('#canvas_skew').offset();
    pmouseX = mouseX;
    pmouseY = mouseY;
    mouseX = e.pageX - position.left;
    mouseY = e.pageY - position.top;
}

function offCanvasMoveListener(e) {
    if(e.which && mousePressed) {
        updateMousePosition(e);
        updateSkew();
    }
}

function offCanvasUpListener(e) {
    if(mousePressed) {
        updateMousePosition(e);
        updateSkew();
        mousePressed = false;
        mouseReleased();
    }
}

function constrainMousePosition() {
    var constrainRadius = 8;
    mouseX = constrain(mouseX, constrainRadius, width - constrainRadius);
    mouseY = constrain(mouseY, constrainRadius, height - constrainRadius);
}

void mousePressed() {
    $('*:not(canvas)').on('mousemove', offCanvasMoveListener).on('mouseup', offCanvasUpListener);
}

void mouseReleased() {
    $('*:not(canvas)').off('mousemove', offCanvasMoveListener).off('mouseup', offCanvasUpListener);
}

/* ======================================================== */

void setup() {
    size(234, 234);
    mouseX = width/2;
    mouseY = height/2;
    updateSkew();
}


void draw() {
    if(mousePressed) {
        updateSkew();
    }

    background(48);
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
    constrainMousePosition();
    float skewX = map(mouseX, 0, width,  minBound, maxBound);
    float skewY = map(mouseY, 0, height, maxBound, minBound);

    $('#canvas_skew')[0].skew = new THREE.Vector2(skewX, skewY);
    
    window.shouldUpdateUI = true;
}
