<?php
$host = 'smtp.gmail.com';
$ip = gethostbyname($host);

if ($ip === $host) {
    echo "DNS resolution failed for $host\n";
} else {
    echo "DNS resolution successful: $host -> $ip\n";
}

$socket = @fsockopen('ssl://smtp.gmail.com', 465, $errno, $errstr, 5);
if (!$socket) {
    echo "Socket connection failed: $errstr ($errno)\n";
} else {
    echo "Socket connection successful\n";
    fclose($socket);
}
