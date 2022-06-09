final_drivers_list = document
  .getElementById("helper")
  .getAttribute("final_drivers_list");
final_drivers_list = JSON.parse(final_drivers_list);

function initMap() {
  var pickup = document.getElementById("helper").getAttribute("variable");

  var replaced = pickup.split(" ").join("+");

  var marker_icon = "https://iili.io/hu4shG.th.png";

  const Http = new XMLHttpRequest();
  const url =
    "https://maps.google.com/maps/api/geocode/json?key={GOOGLE_MAPS_API_KEY}&address=" +
    replaced;
  Http.open("GET", url);
  Http.send();

  Http.onreadystatechange = (e) => {
    var place = JSON.parse(Http.responseText).results["0"].geometry.location;

    var options = {
      zoom: 12,
      center: place,
    };

    var map = new google.maps.Map(document.getElementById("map"), options);
    var marker = new google.maps.Marker({
      position: place,
      map: map,
    });

    console.log(final_drivers_list.length)
    for (var i = 0; i < final_drivers_list.length; i++) {
      var marker1 = new google.maps.Marker({
        position: {
          lat: parseFloat(final_drivers_list[i].lat),
          lng: parseFloat(final_drivers_list[i].lng),
        },
        map: map,
        icon: marker_icon,
      });
    }
  };
}

function startTimer(duration, display) {
  var timer = duration,
    minutes,
    seconds;
  setInterval(function () {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = minutes + ":" + seconds;

    if (--timer < 0) {
      window.location.replace("http://goride-0.herokuapp.com/sorry");
    }
  }, 1000);
}

myFunction = function () {
  document.getElementById("loading").style.display = "block";

  // document.getElementById("loading").classList.remove("hidden");
  // document.getElementById("hiddenLoader").className = "newClass";

  var twoMinutes = 60 * 1,
    display = document.querySelector("#time");
  startTimer(twoMinutes, display);
};
