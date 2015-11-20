function secondsToTime(secs)
{
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}
function fadeTheme(){
	if (document.getElementById("theme").volume > 0.9){return;} // no going over 1
	document.getElementById("theme").volume += 0.1;
	setTimeout(function(){
		document.getElementById("theme").volume -= 0.1;
	}, 22000)
}

function mute(){
	if ($("#mute").hasClass("fa-volume-up")){
		document.getElementById("theme").pause();
		$("#mute").addClass("fa-volume-off");
		$("#mute").removeClass("fa-volume-up");
	} else {
		$("#mute").removeClass("fa-volume-off");
		$("#mute").addClass("fa-volume-up");
		document.getElementById("theme").play();
	}
}
$(document).ready(function() {
    Tipped.create('#info', function(element) {
     return {
        title: "[Hakkers].exe",
        content: "Version: 0.69<br>Monkey: J.L <br> Overseer: P.H <br>Music by: <a href='http://www.soundcloud.com/tupsuu' target='_blank'>soundcloud.com/tupsuu</a>"
      };
    }, {
      skin: 'light'
    });
    Tipped.create('#bankconnInfo', function(element) {
     return {
        title: "[Bank connection].exe",
        content: "- Enables buying licenses.<br>- Licenses are used to transfer credits in between players.<br>- Using the license code anyone can transfer credits to you.<br>- Licenses are one-time use only."
      };
    }, {
      skin: 'light'
    });
    Tipped.create('#currtransferInfo', function(element) {
     return {
        title: "[Currency transfer].exe",
        content: "- Transfer credits to anyone who has bought a license.<br>- Use the license code to determine who to transfer credits to."
      };
    }, {
      skin: 'light'
    });
    Tipped.create('#lotteryInfo', function(element) {
     return {
        title: "[Lottery].exe",
        content: "- Pitch in to get a chance to win the jackpot.<br>- Every 5 minutes the jackpot is given to one lucky player.<br>- Minimum ticket price is 10% of the jackpot.<br>- You can pitch in as many times as you want.<br>- Jackpot multiplier is increased for every attendee.<br>- Initial jackpot increases with every round."
      };
    }, {
      skin: 'light'
    });
    Tipped.create('#scoretrackerInfo', function(element) {
     return {
        title: "[Scoretracker].exe",
        content: "- Displays the current score for every player.<br>- Displays license codes."
      };
    }, {
      skin: 'light'
    });
    Tipped.create('#loansharkInfo', function(element) {
     return {
        title: "[Loanshark].exe",
        content: "- Loan a big sum of money from the notorious Loanshark.<br>- Debt is collected back automatically in 30 seconds.<br>- You can choose to pay back before the timer runs out."
      };
    }, {
      skin: 'light'
    });
    Tipped.create('#statisticsInfo', function(element) {
     return {
        title: "[Statistics].exe",
        content: "- Displays relevant information about your statistics.<br>- Clicks, multipliers, highest score, total score."
      };
    }, {
      skin: 'light'
    });
    Tipped.create('#renamerInfo', function(element) {
     return {
        title: "[Renamer].exe",
        content: "- Changes your display name.<br>- One-time use, can be bought again.<br>- Max 11 characters. No HTML-tags."
      };
    }, {
      skin: 'light'
    });
})