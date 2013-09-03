<?php

$imageData = $_POST['imageData'];

# http://stackoverflow.com/a/6735480
$imageData = str_replace(' ','+', $imageData);

$image = base64_decode($imageData);

$k = explode(" ", microtime());
$secondsPart = intval($k[1] * 1000);
$microsecondsPart = intval(round($k[0]*1000));

$timestamp = $secondsPart + $microsecondsPart;

$imageName = "images" . DIRECTORY_SEPARATOR . "lampdesignimages" . DIRECTORY_SEPARATOR . "$timestamp.png";

file_put_contents($imageName, $image);

echo $imageName;
?>

