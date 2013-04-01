void setup(){
  size(500, 500, P3D);
}

void draw(){
  ambientLight(255, 0, 0);
  directionalLight(255, 255, 255, 0, 0, -1);

  beginShape();

  vertex(0, 0, 0);
  vertex(100, 0, 0);
  vertex(100, 100, 0);
  vertex(0, 100, 0);

  endShape();
}

