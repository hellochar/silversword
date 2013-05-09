<?php
require 'class.phpmailer.php';

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

function send_email_order($order_number, $data) {
	//Create a new PHPMailer instance
	$mail = new PHPMailer();

	//Set who the message is to be sent to
	$mail->AddAddress("orders@silverswordlighting.com");

	$mail->IsHTML(false);

	$mail->Subject = "#$order_number";
	$mail->Body = "Hello Adam!

Attached is info for order #$order_number. Other info can go here in the body.
";

    $data = $order_number . "\n" . $data;
	file_put_contents("data.txt", $data);

	$mail->AddAttachment("data.txt");

	//Send the message, check for errors
	if(!$mail->Send()) {
		echo "Order #$order_number Mailer Error: " . $mail->ErrorInfo;
	} else {
		echo "Order #$order_number sent!";
	}

	unlink("data.txt");
}

$order_number = increment_order_number();
$data = $_POST['data']; 

send_email_order($order_number, $data);
?>
