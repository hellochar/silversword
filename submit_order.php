<?php
require 'class.phpmailer.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

function increment_order_number() {
	$number = file_get_contents("ORDER_NUMBER.txt");
	if($number === FALSE) {
		$number = 0;
	} else {
		$number = intval($number);
	}

    $number = $number + 1;

	file_put_contents("ORDER_NUMBER.txt", $number);

    return $number;
}

function send_email_order($order_number, $data, $ss_url, $image) {
    $imageName = "Order{$order_number}.png";
    $attachmentName = "Order {$order_number}.txt";

	//Create a new PHPMailer instance
	$mail = new PHPMailer();

	//Set who the message is to be sent to
	$mail->AddAddress("orders@silverswordlighting.com");

	$mail->IsHTML(true);

	$mail->Subject = "Order #$order_number";
	$mail->Body = "<h3>Hello Adam!</h3>

        <p>Attached is info for order #$order_number.</p>
        <p>View it at <a href=\"$ss_url\">$ss_url</a>.</p>

        <img src=\"cid:my-image\" alt=\"$imageName\" >
";

    $data = $order_number . "\r\n" . $data;
	file_put_contents($attachmentName, $data);

	$mail->AddAttachment($attachmentName);

    file_put_contents($imageName, $image);
    $mail->AddEmbeddedImage($imageName, "my-image", $imageName);

	//Send the message, check for errors
	if(!$mail->Send()) {
		echo "Order #$order_number Mailer Error: " . $mail->ErrorInfo . "\n:" . print_r(error_get_last(), true) . "!!!";
	} else {
		echo "Order #$order_number sent!";
	}

	unlink($attachmentName);
    unlink($imageName);
}

$order_number = increment_order_number();
$data = $_POST['data'];
$ss_url = $_POST['ss_url'];
$imageData = $_POST['imageData'];

# http://stackoverflow.com/a/6735480
$imageData = str_replace(' ','+', $imageData);

send_email_order($order_number, $data, $ss_url, base64_decode($imageData));
?>
