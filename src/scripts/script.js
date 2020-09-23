window.onload = async function() {

  const canvas = document.getElementById('js-canvas');
  const ctx = canvas.getContext('2d');
  const image = document.getElementById("js-pic-output");
  const cropSize = document.getElementById("js-size");
  const heightDropdown = document.getElementById("js-height-dropdown");
  const input = document.getElementById("js-file");
  const downloadCheck = document.getElementById("js-download");
  const bestEffortCheck = document.getElementById("js-best-effort");
  const fileUploadButton = document.getElementById("js-upload-button");
  const dropWrapper = document.getElementById("js-drop-wrapper");
  const placeholderText = document.getElementById("js-placeholder");
  const exampleImages = document.getElementById("js-examples");
  const exampleImagesWrapper = document.getElementById("js-examples-wrapper");
  const recropButton = document.getElementById("js-recrop-button");
  const settingsButton = document.getElementById("js-settings-button");
  const settingsButtonText = document.getElementById("js-settings-button-text");
  const optionsWrapper = document.getElementById("js-options");
  const warningSymbol = document.getElementById("js-warning");
  const heartEyesSymbol = document.getElementById("js-heart-eyes");
  const spinnerSymbol = document.getElementById("js-spinner");
  const overlay = document.getElementById("js-overlay");
  const loadingText = document.getElementById("js-loading");
  const disclaimerText = document.getElementById("js-disclaimer");
  const advancedWrapper = document.getElementById("js-advanced");
  const advancedButton = document.getElementById("js-advanced-button");
  const aiType = document.getElementById("js-ai-dropdown");

  const MODEL_URL = './src/models';

  var globalFile = "./assets/megan.png";
  var counter = 0;
  var allFiles = [globalFile];
  var sameImageCount = 0;

  const constantCanvasHeight = exampleImages.height; //same as the height of the example image
  const constantCanvasWidth = constantCanvasHeight; //canvas is square
  const topAddition = 10; //makes the eyes 10 pixels below the first third line
  const delayTime = 3000; //after each file is done, wait a few seconds
  const delay = ms => new Promise(res => setTimeout(res, ms));

  //run detection on blank image to load models - makes
  //subsequent inputs faster
  image.src = "./assets/blank.jpg"
  await detectFace(image, "begin", "fast");
  overlay.style.display = "none";
  loadingText.style.display = "none";
  disclaimerText.style.display = "";



  settingsButton.onclick = function() {
    if (optionsWrapper.classList.length > 1) {
      optionsWrapper.classList.remove("is-visible");
      settingsButtonText.innerHTML = "change settings"
    } else {
      optionsWrapper.classList.add("is-visible");
      settingsButtonText.innerHTML = "hide settings";
    }
  }

  advancedButton.onclick = function() {
    sameImageCount += 1;
    advancedWrapper.style.display = "none";
    detectFace(image, "normal", "powerful");
  }

  fileUploadButton.onclick = function() {
    input.click();
    if (recropButton.classList[1] == "is-visible") {
      recropButton.classList.remove("is-visible");
    }
  }

  input.onchange = async function() {
    if (recropButton.classList[1] == "is-visible") {
      recropButton.classList.remove("is-visible");
    }
    if (input.files) {
      allFiles = input.files;
      counter = 0;
      await callback();
    }
  }

  dropWrapper.ondragover = function(e) {
    e.preventDefault();
    dropWrapper.style.border = "4px dashed #FFD1D1";
  }


  dropWrapper.ondrop = async function(e) {
    e.preventDefault();
    if (recropButton.classList[1] == "is-visible") {
      recropButton.classList.remove("is-visible");
    }
    allFiles = e.dataTransfer.files;
    counter = 0;
    await callback();
  }

  async function callback() {
    counter++;
    if (counter <= allFiles.length) {
      if (!allFiles[counter - 1].type.match(/image.*/)) {
        placeholderText.innerHTML = "The dropped file is not an image: ", allFiles[counter - 1].type;
        warningSymbol.style.display = "";
        heartEyesSymbol.style.display = "none";
        spinnerSymbol.style.display = "none";
        return;
      }
      globalFile = allFiles[counter - 1];
      await loadImg(allFiles[counter - 1], callback);
    }
  }

  recropButton.onclick = function() {
    loadImg(globalFile, callback);
  }

  async function loadImg(file, callbackFunc) {
    if (!file) {
      placeholderText.innerHTML = "No file selected.";
      warningSymbol.style.display = "";
      heartEyesSymbol.style.display = "none";
      spinnerSymbol.style.display = "none";
      return;
    }
    if (!file.type.match(/image.*/)) {
      placeholderText.innerHTML = "Your file is not an image.";
      warningSymbol.style.display = "";
      heartEyesSymbol.style.display = "none";
      spinnerSymbol.style.display = "none";
      return;
    }
    let aiTypePass;
    if (aiType.value == "default") {
      if (allFiles.length > 1) {
        aiTypePass = "powerful";
      } else {
        aiTypePass = "fast";
      }
    } else {
      aiTypePass = aiType.value;
    }

    image.style.display = "none";
    advancedWrapper.style.display = "none";
    sameImageCount = 0;
    var reader = new FileReader();
    reader.onload = async function(e) {
      canvas.style.display = "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = constantCanvasWidth;
      canvas.height = constantCanvasHeight;
      var img = new Image();
      img.src = e.target.result;
      img.onload = async function() {
        let factor = canvas.height / image.height;
        let startX = 0;
        let startY = 0;
        canvas.width = img.width * (factor);
        canvas.height = img.height * (factor);
        let width = img.width;
        let height = img.height;
        if (exampleImagesWrapper.classList[1] == "is-visible") {
          exampleImagesWrapper.classList.remove("is-visible");
        }
        ctx.drawImage(img, startX, startY, width, height, 0, 0, canvas.width, canvas.height);
      };
      image.src = e.target.result;
      await detectFace(image, "", aiTypePass);
      if (allFiles.length > 1) {
        await delay(delayTime);
      }
      callbackFunc();

    }
    reader.readAsDataURL(file);
  }

  async function detectFace(image, type, aiTypeParam) {
    if (type != "begin") {
      placeholderText.innerHTML = "Please wait...your photo is being cropped!";
      warningSymbol.style.display = "none";
      heartEyesSymbol.style.display = "none";
      spinnerSymbol.style.display = "";
      if (allFiles.length > 1) {
        placeholderText.innerHTML += " (" + counter + "/" + allFiles.length + ")";
      }
    }

    var detections = await getDetections(aiTypeParam);

    if (type == "begin") {
      return;
    }

    if (detections.length > 1) {
      placeholderText.innerHTML = "Sorry! Magic Crop is designed to crop a photo for an individual. Please choose another photo!";
      warningSymbol.style.display = "";
      heartEyesSymbol.style.display = "none";
      spinnerSymbol.style.display = "none";
    } else {
      if (detections[0]) {
        let leftEye = detections[0].landmarks.getLeftEye();
        let rightEye = detections[0].landmarks.getRightEye();
        let centerOfEyesX = (rightEye[0]._x + leftEye[3]._x) / 2;
        let centerOfEyesY = (rightEye[0]._y + leftEye[3]._y) / 2;
        let faceFraction = parseFloat(heightDropdown.value);
        let faceHeight = detections[0].alignedRect._box._height;
        let cropHeight = 1 / (faceFraction) * faceHeight;
        let cropWidth = cropHeight;

        canvas.width = cropSize.value;
        canvas.height = cropSize.value;
        let startX = centerOfEyesX - cropWidth / 2;
        let startY = centerOfEyesY - cropHeight / 3 - topAddition;

        if (startX < 0) {
          startX = 0;
        }
        if (startY < 0) {
          startY = 0;
        }

        if (startX > detections[0].alignedRect._box._x) {
          startX = detections[0].alignedRect._box._x;
        }
        if (startY > detections[0].alignedRect._box._y) {
          startY = detections[0].alignedRect._box._y;
        }

        if (cropHeight > image.height || cropWidth > image.width || cropHeight + startY > image.height || cropWidth + startX > image.width) {
          if (bestEffortCheck.checked) {
            while (cropHeight > image.height || cropWidth > image.width || cropHeight + startY > image.height || cropWidth + startX > image.width) {
              faceFraction += 0.01;
              faceHeight = detections[0].alignedRect._box._height;
              cropHeight = 1 / (faceFraction) * faceHeight;
              cropWidth = cropHeight;
              startX = centerOfEyesX - cropWidth / 2;
              startY = centerOfEyesY - cropHeight / 3 - topAddition;

              if (startX < 0) {
                startX = 0;
              }
              if (startY < 0) {
                startY = 0;
              }

              if (startX > detections[0].alignedRect._box._x) {
                startX = detections[0].alignedRect._box._x;
              }
              if (startY > detections[0].alignedRect._box._y) {
                startY = detections[0].alignedRect._box._y;
              }
            }
            await showCroppedPicture(centerOfEyesX, centerOfEyesY, cropWidth, cropHeight, detections, startX, startY);
            placeholderText.innerHTML = "Best effort crop was used! Face-to-picture ratio used: " + faceFraction.toFixed(2) + ".";
            warningSymbol.style.display = "none";
            heartEyesSymbol.style.display = "";
            spinnerSymbol.style.display = "none";
            if (allFiles.length > 1) {
              placeholderText.innerHTML += " (" + counter + "/" + allFiles.length + ")";
            }
          } else {
            placeholderText.innerHTML = "The face-to-picture ratio of the original picture is greater than ratio selected! Please choose another picture, increase face-to-picture ratio, or select best effort crop.";
            warningSymbol.style.display = "";
            heartEyesSymbol.style.display = "none";
            spinnerSymbol.style.display = "none";
            if (allFiles.length > 1) {
              placeholderText.innerHTML += " (" + counter + "/" + allFiles.length + ")";
            }
            recropButton.classList.add("is-visible");
          }
        } else {
          await showCroppedPicture(centerOfEyesX, centerOfEyesY, cropWidth, cropHeight, detections, startX, startY);
        }
      } else if (detections.length > 1) {
        placeholderText.innerHTML = "multiple faces";
      } else {
        placeholderText.innerHTML = "No face detected.";
        if (sameImageCount == 0)
          advancedWrapper.style.display = "inline-block";
        else
          placeholderText.innerHTML += " Please choose another picture."
        warningSymbol.style.display = "";
        heartEyesSymbol.style.display = "none";
        spinnerSymbol.style.display = "none";
        if (allFiles.length > 1) {
          placeholderText.innerHTML += " (" + counter + "/" + allFiles.length + ")";
        }
      }

    }
  }

  function showCroppedPicture(centerOfEyesX, centerOfEyesY, cropWidth, cropHeight, detections, startX, startY) {
    ctx.drawImage(image, startX, startY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    recropButton.classList.add("is-visible");
    canvas.style.display = "none";
    image.src = canvas.toDataURL(globalFile.type);
    image.style.width = canvas.width;
    image.style.height = canvas.height;
    image.style.display = "";

    if (downloadCheck.checked) {
      download();
    }
    placeholderText.innerHTML = "Your photo is cropped!";
    warningSymbol.style.display = "none";
    heartEyesSymbol.style.display = "";
    spinnerSymbol.style.display = "none";
    if (allFiles.length > 1) {
      placeholderText.innerHTML += " (" + counter + "/" + allFiles.length + ")";
    }
    dropWrapper.style.border = "4px solid #FDF5F5";
  }

  function download() {
    var link = document.createElement('a');
    var name = globalFile.name.substr(0, globalFile.name.lastIndexOf('.'));
    link.download = name + "_cropped";
    link.href = canvas.toDataURL(globalFile.type);
    link.click();
  }

  async function getDetections(aiTypeParam) {
    var detections;
    if (aiTypeParam == "powerful") {
      await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
      await faceapi.loadFaceLandmarkModel(MODEL_URL);

      detections = await faceapi.detectAllFaces(image).withFaceLandmarks();
    } else {
      await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
      await faceapi.loadFaceLandmarkTinyModel(MODEL_URL);

      detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true);
    }

    return detections;
  }
}
