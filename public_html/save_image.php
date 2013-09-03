<?php

$imageData = $_POST['imageData'];

# http://stackoverflow.com/a/6735480
$imageData = str_replace(' ','+', $imageData);

$image = base64_decode($imageData);

function msTimeStamp() {
    return round(microtime(true) * 1000);
}

$timestamp = msTimeStamp();
$imageName = "images" . DIRECTORY_SEPARATOR . "lampdesignimages" . DIRECTORY_SEPARATOR . "$timestamp.png";

file_put_contents($imageName, $image);

echo $imageName;
?>

