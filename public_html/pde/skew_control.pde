float maxX, maxY;

/* =============    OFF CANVAS DRAGGING       =========== */
function updateMousePosition(e) {
    var position = jQuery('#canvas_skew').offset();
    pmouseX = mouseX;
    pmouseY = mouseY;
    mouseX = e.pageX - position.left;
    mouseY = e.pageY - position.top;
}

function offCanvasMoveListener(e) {
    if(e.which && mousePressed) {
        updateMousePosition(e);
        setSkewToMouse();
    }
}

function offCanvasUpListener(e) {
    if(mousePressed) {
        updateMousePosition(e);
        setSkewToMouse();
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
    jQuery('*:not(canvas)').bind('mousemove', offCanvasMoveListener).bind('mouseup', offCanvasUpListener);
}

void mouseReleased() {
    jQuery('*:not(canvas)').unbind('mousemove', offCanvasMoveListener).unbind('mouseup', offCanvasUpListener);
}

/* ======================================================== */

void setup() {
    maxX = window.SS_PARAMETERS.skew.xMax
    maxY = window.SS_PARAMETERS.skew.yMax

    size(234, 234);
    mouseX = width/2;
    mouseY = height/2;
    if( ! jQuery('#canvas_skew')[0].skew ) {
        setSkew(0, 0);
    }
}


void draw() {
    if(mousePressed) {
        setSkewToMouse();
    }

    background(48);
    float rangeX = 2*maxX,
          rangeY = 2*maxY,
          scalarX = width / rangeX,
          scalarY = height / rangeY,
          maxScalar = max(scalarX, scalarY);
    scale( scalarX, scalarY );
    translate( rangeX / 2, rangeY / 2 );

    strokeWeight(1 / maxScalar );

    for(float r = -maxX; r < maxX; r++) {
        stroke(128);
        line(r, -maxY, r, maxY);
    }
    for(float r = -maxY; r < maxY; r++) {
        stroke(128);
        line(-maxX, r, maxX, r);
    }

    strokeWeight(1 / maxScalar );
    stroke(255);
    line(-maxX, 0, maxX, 0);
    line(0, -maxY, 0, maxY);

    noStroke();
    fill(255);

    var skew = jQuery('#canvas_skew')[0].skew;
    ellipse(skew.x, -skew.y, 16 / scalarX, 16 / scalarY);
}

void setSkewToMouse() {
    constrainMousePosition();
    float skewX = map(mouseX, 0, width,  -maxX, maxX);
    float skewY = map(mouseY, 0, height, maxY, -maxY);

    setSkew(skewX, skewY);
}

void setSkew(skewX, skewY) {
    jQuery('#canvas_skew')[0].skew = new THREE.Vector2(constrain(skewX, -maxX, maxX), constrain(skewY, -maxY, maxY));

    window.Silversword.requestUpdateUI();
}

setTimeout(function() {
    jQuery(window).trigger("skew_control_loaded");
}, 0)

void fixLastFunctionNotExportedBug() {}
