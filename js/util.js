Vector.prototype.lerp = function(towards, amt) {
    var offset = towards.subtract(this);
    return this.add(offset.multiply(amt));
}
