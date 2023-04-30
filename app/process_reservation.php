<?php

ob_start();
session_start();

require_once 'DB.php';
require_once 'Util.php';
require_once 'dao/BookingReservationDAO.php';
require_once 'models/Booking.php';
require_once 'models/Reservation.php';
require_once 'models/Pricing.php';
require_once 'models/StatusEnum.php';
require_once 'handlers/BookingReservationHandler.php';

if (isset($_SESSION["authenticated"]) && $_SESSION["authenticated"][1] == "false") {
    if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["readySubmit"])) {
        $startDate = $endDate = null;
        $errors = [];

        if (empty($_POST["start"])) {
            $errors[] = "Please select a start date.";
        }
        if (empty($_POST["end"])) {
            $errors[] = "Please select an end date.";
        }
        if (!DateTime::createFromFormat('Y-m-d', $_POST["start"])) {
            $errors[] = "Invalid start date.";
        }
        if (!DateTime::createFromFormat('Y-m-d', $_POST["end"])) {
            $errors[] = "Invalid end date.";
        }
        if (empty($_POST["type"])) {
            $errors[] = "Please select a room type.";
        }

        try {
            $startDate = new DateTime($_POST["start"]);
            $endDate = new DateTime($_POST["end"]);
            if ($endDate <= $startDate) {
                $errors[] = "End date cannot be less or equal to start date.";
            }
        } catch (Exception $e) {
            $errors[] = "Invalid date type!";
        }

        if (!empty($errors)) {
            echo Util::displayAlertV1(implode("<br>", $errors), "info");
        } else {
            $reservation = new Reservation();
            $reservation->setCid(Util::sanitize_xss($_POST["cid"]));
            $reservation->setStatus(\models\StatusEnum::PENDING_STR);
            $reservation->setNotes(null);
            $reservation->setStart(Util::sanitize_xss($_POST["start"]));
            $reservation->setEnd(Util::sanitize_xss($_POST["end"]));
            $reservation->setType(Util::sanitize_xss($_POST["type"]));
            $reservation->setRequirement(Util::sanitize_xss($_POST["requirement"]));
            $reservation->setRequests(Util::sanitize_xss($_POST["requests"]));
            $unique = uniqid();
            $reservation->setHash($unique);

            $pricing = new Pricing();
            $pricing->setBookedDate(Util::sanitize_xss($_POST['bookedDate']));
            $pricing->setTotalPrice(null);

            $bookingReservationHandler = new BookingReservationHandler($reservation, $pricing);
            $temp = $bookingReservationHandler->create();
            $out = array(
                "success" => "true",
                "response" => Util::displayAlertV2($bookingReservationHandler->getExecutionFeedback(), $temp)
            );
            echo json_encode($out, JSON_PRETTY_PRINT);
        }
    }
} else {
    echo "failed";
}
