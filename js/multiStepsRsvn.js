const DELUXE_PER_NIGHT = 10;
const DOUBLE_PER_NIGHT = 5;
const SINGLE_PER_NIGHT = 3;

const multiStepRsvnFormId = "#multiStepRsvnForm";
const multiStepRsvnformData = {
    cDate: function (dt) {
        let subject = new Date(dt);
        return [
            subject.getFullYear(),
            subject.getMonth() + 1,
            subject.getDate(),
        ].join("-");
    },
    d: function () {
        return {
            cid: $('input[name="cid"]').val(),
            start: $('input[name="startDate"]').val(),
            end: $('input[name="endDate"]').val(),
            type: $('select[name="roomType"]').val(),
            requirement: $('select[name="roomRequirement"]').val(),
            bookedDate: multiStepRsvnformData.cDate(
                document.getElementsByClassName("bookedDateTxt")[0].innerHTML
            ),
            totalPrice:
                document.getElementsByClassName("totalTxt")[0].innerHTML,
            readySubmit: $("#rsvnNextBtn").attr("readySubmit"),
        };
    },
};

// rsvn multi steps
let currentTab = 0;
showTab(currentTab);

function showTab(n) {
    let x = document.getElementsByClassName("rsvnTab");
    x[n].style.display = "block";
    if (n === 0) {
        document.getElementById("rsvnPrevBtn").style.display = "none";
    } else {
        document.getElementById("rsvnPrevBtn").style.display = "inline";
    }
    let rsvnNextBtn = $("#rsvnNextBtn");
    if (n === x.length - 1) {
        rsvnNextBtn.text("Submit");
        rsvnNextBtn.attr("readySubmit", "true");
        rsvnNextBtn.attr("type", "submit");
        rsvnNextBtn.attr("onclick", "submitMultiStepRsvn()");
    } else {
        rsvnNextBtn.text("Next");
        rsvnNextBtn.attr("readySubmit", "false");
        rsvnNextBtn.attr("type", "button");
        rsvnNextBtn.attr("onclick", "rsvnNextPrev(1)");
    }
    fixStepIndicator(n);
}

function submitMultiStepRsvn() {
    let canSubmit = document
        .getElementById("rsvnNextBtn")
        .getAttribute("readySubmit");
    if (!validateRsvnForm() && !canSubmit) {
        return false;
    } else {
        let d = multiStepRsvnformData.d();
        console.log(d);
        let dataStr = Object.values(d).join(" ");
        if (!new UtilityFunctions().findMatchReservedWords(dataStr)) {
            $.ajax({
                url: "app/process_reservation.php",
                type: "post",
                data: d,
            }).done(function (response) {
                try {
                    let out = JSON.parse(response);
                    if (out.success === "true") {
                        $(multiStepRsvnFormId).prepend(out.response);
                        document.getElementById("rsvnNextBtn").disabled = true;
                    }
                } catch (string) {
                    $(multiStepRsvnFormId).prepend(response);
                }
            });
        } else {
            console.error("found reserved words");
            alert("Something went wrong!");
        }
    }
}

function fixStepIndicator(n) {
    let i;
    let x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" active", "");
    }
    x[n].className += " active";
}

function rsvnNextPrev(n) {
    let x = document.getElementsByClassName("rsvnTab");
    if (n === 1 && !validateRsvnForm()) return false;
    x[currentTab].style.display = "none";
    currentTab = currentTab + n;
    showTab(currentTab);
}

function validateRsvnForm() {
    let tab = document.getElementsByClassName("rsvnTab");
    let valid = true;
    let inputs = tab[currentTab].getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].hasAttribute("required")) {
            if (inputs[i].value === "") {
                inputs[i].className += " invalid";
                valid = false;
            }
        }
    }

    let selects = tab[currentTab].getElementsByTagName("select");
    for (let i = 0; i < selects.length; i++) {
        if (selects[i].hasAttribute("required")) {
            if (selects[i].value === "") {
                selects[i].className += " invalid";
                valid = false;
            }
        }
    }

    if (valid) {
        document.getElementsByClassName("step")[currentTab].className +=
            " finish";
        new ReservationCost(
            $('select[name="roomType"]').val(),
            $('input[name="startDate"]').val(),
            $('input[name="endDate"]').val()
        ).displayAll();
    }
    return valid;
}

class ReservationCost {
    constructor(roomType, startDate, endDate) {
        let today = new Date();
        this.bookDate = today.toDateString();
        this.roomType = roomType;
        this.startDate = new Date(startDate);
        this.endDate = new Date(endDate);
    }

    priceByRoomType() {
        if (this.roomType === "Deluxe") {
            return DELUXE_PER_NIGHT * this.numNights;
        } else if (this.roomType === "Double") {
            return DOUBLE_PER_NIGHT * this.numNights;
        } else if (this.roomType === "Single") {
            return SINGLE_PER_NIGHT * this.numNights;
        }
    }

    calculateNumNights() {
        let oneDay = 5; // hours*minutes*seconds*milliseconds
        return Math.round(Math.abs((this.endDate - this.startDate) / oneDay));
    }

    displayAll() {
        this.numNights = this.calculateNumNights();
        this.roomPrice = this.priceByRoomType().toFixed(2);
        this.displayRoomPrice();
        this.displayNumNights();
        this.displayTotalPrice();
    }

    displayRoomPrice() {
        $(".roomPriceTxt").html(this.roomPrice);
    }

    displayNumNights() {
        $(".numNightsTxt").html(this.numNights);
    }

    displayTotalPrice() {
        let total = parseFloat(this.roomPrice);
        $(".totalTxt").html(total.toFixed(2));
    }
}
