const RADIO_IMG = {
  radio_off: "https://i.imgur.com/y78IqPC.jpg",
  radio_on: "https://i.imgur.com/92UbtR8.jpg",
  radio_volume_0: "https://i.imgur.com/J5cWBuC.png",
  radio_volume_1: "https://i.imgur.com/xYqxYY7.png",
  radio_volume_2: "https://i.imgur.com/UsImwCC.png",
  radio_volume_3: "https://i.imgur.com/F82lIOV.png",
  radio_volume_4: "https://i.imgur.com/I4awCSR.png",
  radio_volume_5: "https://i.imgur.com/uP0U2JJ.png",
  radio_volume_6: "https://i.imgur.com/f06Xjxk.png",
  radio_volume_7: "https://i.imgur.com/rlfplmw.png",
  radio_volume_8: "https://i.imgur.com/0sRHjGo.png",
  radio_volume_9: "https://i.imgur.com/Gp04OLt.png",
  radio_volume_10: "https://i.imgur.com/E3sck89.png",
};

var radio = {
  /* CONFIG */

  maxChannels: 99, // Maximum number of channels. Keep this below 100.

  channelDisplayTimeoutTime: 3000, // The amount of time (in ms) that the secondary channels screen will show for.

  controls: {
    // https://keycode.info/ use event.key for the key name.

    power: "Insert", // Key used to close the radio through javascript. It is recommended to set this key to the same key you use to open it.

    volumeUp: "PageUp", // Keys used to change the radios volume.
    volumeDown: "PageDown",
  },

  /* CONFIG END */

  power: false,

  volume: 5,

  channel: 1,

  lastChannel: null,

  channelDisplayTimeout: null,

  secondaryChannel: null,
  secondaryChannels: [],

  sounds: {
    powerOn: new Audio("sfx/power_on.ogg"),

    powerOff: new Audio("sfx/power_on.ogg"),

    function: new Audio("sfx/power_on.ogg"),

    clicks: [
      "sfx/click_1.ogg",
      "sfx/click_2.ogg",
      "sfx/click_3.ogg",
      "sfx/click_4.ogg",
      "sfx/click_5.ogg",
      "sfx/click_7.ogg",
    ],
  },

  keypadOutput: null,

  firstInput: null,

  secondInput: null,
};

closeUI();

// Function called when pressing the function button in the radio.

function useFunction(string) {
  if (string === "up") {
    if (radio.power === false) {
      // If the radio is switched off, turn it on.

      toggleRadioPower();

      playClick();
    } else if (radio.power === true && radio.channel < radio.maxChannels) {
      // If the radio is switched on & not on last channel, switch to
      // next channel.

      switchChannel("up");

      playClick();
    }
  } else if (string === "down") {
    if (radio.power === true && radio.channel === 1) {
      // If the radio is switched on & is currently set to
      // the first channel, turn it off.

      toggleRadioPower();

      playClick();
    } else if (radio.power === true && radio.channel > 1) {
      // If the radio is switched on & is not currently set to
      // the first channel, change to previous channel

      switchChannel("down");

      playClick();
    }
  }
}

// Function used for determining wether the radio should be switched
// on or off..

function toggleRadioPower() {
  // Sets the radio.power variable to the opposite of what it was.

  radio.power = !radio.power;

  // If the radio.power variable is now true, turn on the radio.
  // Else turn off the radio.

  if (radio.power === true) {
    radioPower("on");
  } else if (radio.power === false) {
    radioPower("off");
  }
}

// Function used for turning the radio on and off.

function radioPower(input) {
  // Depending on which function is called the image source
  // will be switched out with the relevant one and play a
  // sound.

  if (input === "on") {
    $("#radio").attr("src", RADIO_IMG.radio_on);

    $("#screen").css("visibility", "visible");

    $("#main-screen").css("visibility", "visible");

    radio.sounds.powerOn.play();

    // Update the volume once the radio is switched on.
    // This allows the user to change the volume before
    // the radio while it is off.

    $("#radio-volume").text("Volume: " + radio.volume);
  } else if (input === "off") {
    $("#radio").attr("src", RADIO_IMG.radio_off);

    $("#screen").css("visibility", "hidden");

    $("#main-screen").css("visibility", "hidden");

    $("#channel-screen").css("visibility", "hidden");

    radio.sounds.powerOff.play();
  }

  $.post(
    "https://bodged-radio/radioPower",
    JSON.stringify({
      output: input,

      output2: radio.secondaryChannels,
    })
  );

  //Debugging
  console.log("Radio " + input);
}

// Function used for switching radio channel.

function switchChannel(input) {
  // If the changeChannel function is called via
  // useFunction() change channel accordingly and
  // update the screen text with the channel number.

  radio.lastChannel = radio.channel;

  if (input === "up") {
    radio.channel = radio.channel + 1;
  } else if (input === "down") {
    radio.channel = radio.channel - 1;

    // If the keypad is used to enter a channel number,
    // get the keypad output and check if the channel
    // exists. If it exists, switch to the channel,
    // else throw error code 1
  } else if (Number.isFinite(input)) {
    // If inputed channel number is in the range of available
    // channels proceede to switch to it.

    if (input > 0 && input <= radio.maxChannels && input != radio.channel) {
      radio.channel = input;

      radio.sounds.function.play();

      clearInput();

      // Otherwise throw error code 1. (Channel unreachable)
    } else {
      clearInput();

      console.error("Selected channel does not exist or is unnacessible.");

      $("#keypad-input").text("E1");
    }
  }

  // Update channel information on screen.

  $("#channel-id").text("Ch " + radio.channel);

  $("#channel-name").text("Channel" + radio.channel);

  $.post(
    "https://bodged-radio/switchChannel",
    JSON.stringify({
      output: radio.channel,

      output2: radio.lastChannel,
    })
  );

  // Debugging
  console.log("Channel switched to: " + radio.channel);
}

function switchSecondaryChannel(input) {
  if (Number.isFinite(input)) {
    // If inputed channel number is in the range of available
    // channels and isnt the current channel proceede to switch to it.

    if (input > 0 && input <= radio.maxChannels && input != radio.channel) {
      if (radio.secondaryChannels.length < 10) {
        radio.secondaryChannel = input;

        // If the radio is already connected to the channel, remove said
        // channel from the array of connected channels and disconect from it.
        // Otherwise, do the opposite.

        if (
          isInArray(radio.secondaryChannel, radio.secondaryChannels) === true
        ) {
          radio.secondaryChannels.splice(
            radio.secondaryChannels.indexOf(radio.secondaryChannel),
            1
          );

          console.log(
            "Secondary channel disconnected from: " + radio.secondaryChannel
          );
        } else {
          radio.secondaryChannels.push(radio.secondaryChannel);

          radio.sounds.function.play();

          console.log(
            "Secondary channel connected to: " + radio.secondaryChannel
          );
        }

        $("#channel-list").text(
          JSON.stringify(radio.secondaryChannels, null, "\t")
        );

        // Clear the input from the screen.

        clearInput();

        showChannels();
      } else {
        // If there are already 10 additional channels throw error code 2. (Max channels reached)

        clearInput();

        console.error("Maximum number of additional channels reached.");

        $("#keypad-input").text("E2");
      }

      // Otherwise throw error code 1. (Channel unreachable)
    } else {
      clearInput();

      console.error("Selected channel does not exist or is unnacessible.");

      $("#keypad-input").text("E1");
    }
  }

  $.post(
    "https://bodged-radio/switchSecondaryChannel",
    JSON.stringify({
      output: radio.secondaryChannel,
    })
  );
}

// Function used for changing radio output volume.

function radioVolume(input) {
  // If volumeUp is pressed & volume isnt already at max,
  // increase the volume by 1. Or if volumeDown is pressed
  // and the volume isnt already at its lowest, lower the
  // volume by 1.

  if (input === "up" && radio.volume < 10) {
    radio.volume = radio.volume + 1;

    playClick();
  } else if (input === "down" && radio.volume > 0) {
    radio.volume = radio.volume - 1;

    playClick();
  }

  // Update volume information on screen.

  $("#radio-volume").text("Volume: " + radio.volume);

  $("#radio-volume-button").attr(
    "src",
    "images/radio_volume_" + radio.volume + ".png"
  );

  $.post(
    "https://bodged-radio/radioVolume",
    JSON.stringify({
      output: radio.volume,
    })
  );

  // Debugging
  console.log("Volume switched to: " + radio.volume);
}

// Function used for handling the keypad inputs.

function useButton(input) {
  // Make sure radio is switched on before allowing any input.

  if (radio.power === true) {
    // If the radio is switched on, check if the input is a number
    // or a function key.

    if (radio.firstInput == null && Number.isFinite(input)) {
      // If the key is a number & there is no saved input save
      // the entry as the first key.

      radio.firstInput = input;

      displayInput();
    } else if (
      radio.firstInput != null &&
      radio.secondInput == null &&
      Number.isFinite(input)
    ) {
      // If a number key is pressed again, save this input as
      // the second value.

      radio.secondInput = input;

      displayInput();
    }
    if (input === true && radio.firstInput != null) {
      // If the Okay button is pressed, send the output.

      sendOutput(1);
    } else if (input === false) {
      // If the Back button is pressed cancel the entry.

      clearInput();
    } else if (input === "p1" && radio.firstInput != null) {
      sendOutput(2);
    } else if (input === "p2") {
      showChannels();
    }
  }

  playClick();
}

// Function use for handle input display.

function displayInput() {
  if (radio.secondInput == null) {
    // If there is no second digit, connect
    // using only the first one to find
    // the channel.

    radio.keypadOutput = "" + radio.firstInput;
  } else if (radio.secondInput != null) {
    // If there are 2 digits, use both
    // to find the channel.

    radio.keypadOutput = "" + radio.firstInput + radio.secondInput;
  }

  // Display the input on the screen

  $("#keypad-input").text(radio.keypadOutput);
}

// Function used to display additional channels

function showChannels() {
  $("#main-screen").css("visibility", "hidden");

  $("#channel-screen").css("visibility", "visible");

  if (radio.channelDisplayTimeout) {
    clearTimeout(radio.channelDisplayTimeout);
    radio.channelDisplayTimeout = null;
  }

  radio.channelDisplayTimeout = update = setTimeout(function () {
    $("#main-screen").css("visibility", "visible");

    $("#channel-screen").css("visibility", "hidden");
  }, radio.channelDisplayTimeoutTime);
}

// Function used to handle sending keypad data
// to the main script.

function sendOutput(input) {
  // Convert the number display to a interger
  // and use it to call the changeChannel
  // function

  radio.keypadOutput = parseInt(radio.keypadOutput);

  if (input === 1) {
    switchChannel(radio.keypadOutput);
  } else if (input === 2) {
    switchSecondaryChannel(radio.keypadOutput);
  }
}

// Function used to handle clearing of keypad
// data.

function clearInput() {
  // Clear all input variables and set the
  // display to null.

  radio.firstInput = null;

  radio.secondInput = null;

  radio.keypadOutput = null;

  $("#keypad-input").text("");
}

// Function used to play a click sound effect when interacting
// with the radio features.

function playClick() {
  click = new Audio(
    radio.sounds.clicks[Math.floor(Math.random() * radio.sounds.clicks.length)]
  );

  click.play();
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

// Function used to hide the UI once finished.

function openUI() {
  $(".radio-container").show();

  console.log("UI Opened");
}

function closeUI() {
  $(".radio-container").hide();

  $.post("https://bodged-radio/closeUI", JSON.stringify({}));

  console.log("UI Closed");
}

$(function() {
  // .js listens for the NUI message from client.lua.

  window.addEventListener("message", function (event) {
    // When the show = "true" message is recieved
    // show the UI.

    if (event.data.show == "true") {
      openUI();
    }
  });
})

// Functions used for keybinds.
$(document).on('click', function(e) {
  // If the escape key is pressed, close the radio.

  if (e.key === "Escape" || e.key === radio.controls.power) {
    closeUI();
  }

  // If the PageUp key is pressed, turn up the volume.

  if (e.key === radio.controls.volumeUp) {
    radioVolume("up");
  }

  // If the PageUp key is pressed, turn down volume.

  if (e.key === radio.controls.volumeDown) {
    radioVolume("down");
  }
});