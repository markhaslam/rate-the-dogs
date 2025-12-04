//import { default as sayHello } from './deleteme.js';

//sayHello();

const boneList = document.querySelectorAll(".bone");
const dogImage = document.querySelector(".container > img");
const rateButton = document.querySelector(".rate-button");
rateButton.disabled = true;
let isBoneMouseEventAdded = true;
let rating = "";
let selectedBone;

const highlightHoveredBones = (event) => {
  if (event.target.matches(".bone")) {
    selectedBone = event.target;
    const boneNumber = Number(selectedBone.getAttribute("data-bone"));

    for (let i = 0; i < boneNumber; i++) {
      boneList[i].classList.add("hovering");
    }
  }
};

const unhighlightHoveredBones = (event) => {
  if (event.target.matches(".bone")) {
    selectedBone = event.target;
    const boneNumber = Number(selectedBone.getAttribute("data-bone"));

    if (!rating) {
      for (let i = 0; i < boneNumber; i++) {
        boneList[i].classList.remove("hovering");
      }
    } else {
      for (let i = rating; i < boneList.length; i++) {
        boneList[i].classList.remove("selected");
      }
      for (let i = 0; i < boneList.length; i++) {
        boneList[i].classList.remove("hovering");
      }
    }
  }
};

const removeRating = () => {
  for (const bone of boneList) {
    bone.classList.remove("selected");
  }
};

const rate = (event) => {
  // if (event.target.classList.contains('bone')) {
  if (event.target.matches(".bone")) {
    selectedBone = event.target;
    // selectedBone.classList.add("selected");
    // selectedBone.classList.remove("hovering");

    const boneNumber = Number(selectedBone.getAttribute("data-bone"));
    rating = boneNumber;
    rateButton.disabled = false;
    // document.querySelector('#rating').textContent = rating;

    for (let i = 0; i < boneNumber; i++) {
      boneList[i].classList.add("selected");
      boneList[i].classList.remove("hovering");
    }

    for (let i = boneNumber; i < boneList.length; i++) {
      boneList[i].classList.remove("selected");
      boneList[i].classList.remove("hovering");
    }
  }
};

// const getRandomImage = async () => {
//   let response = await fetch('https://dog.ceo/breeds/image/random');
//   let data = await response.json();
//   return data;
// };
let downloadedImages = [];

const getRandomImage = async () => {
  let exclusions = downloadedImages.map((image) => image.id);
  //let exclusions = [1, 6, 234, 2334, 7];
  let response = await fetch(
    `http://localhost:3000/images/random?exclude=${exclusions.toString()}`,
    // `http://api.ratethedogs.haslam.io/images/random`,
    {
      credentials: "include",
    }
  );
  let data = await response.json();
  return data;
};

const getRandomImageFile = async () => {
  const image = await getRandomImage();
  const response = await fetch(
    `http://localhost:3000/images/file/${image.id}`,
    { credentials: "include" }
  );
  const data = await response.blob();
  const objectURL = URL.createObjectURL(data);
  image.file = objectURL;
  downloadedImages.push(image);
};

(async () => {
  for (let i = 0; i < 10; i++) {
    await getRandomImageFile();
  }
})();

const postRating = async (data = {}) => {
  try {
    const fetchOptions = {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    };
    const response = await fetch(
      "http://localhost:3000/images/ratings",
      fetchOptions
    );
  } catch (error) {
    console.error(error);
  }
};

const changeImage = async () => {
  const { url } = await getRandomImage();
  console.log(url);
  dogImage.src = url;
  removeRating();
};

let currentImage;
// let img = document.querySelector('img');
let changeImageFromDownloaded = () => {
  const ratingData = {
    image_id: currentImage.id,
    rating: rating,
  };
  postRating(ratingData);
  currentImage = downloadedImages.shift();
  dogImage.src = currentImage.file;
  removeRating();
  console.log(downloadedImages.length);
  if (downloadedImages.length < 5) {
    getRandomImageFile();
  }

  rateButton.disabled = true;
};

const getFirstRandomImageFile = async () => {
  const image = await getRandomImage();
  const response = await fetch(
    `http://localhost:3000/images/file/${image.id}`,
    { credentials: "include" }
  );
  const data = await response.blob();
  const objectURL = URL.createObjectURL(data);
  image.file = objectURL;
  downloadedImages.push(image);
  currentImage = image;
};

//changeImageFromDownloaded();

getFirstRandomImageFile().then(() => {
  changeImageFromDownloaded();
});

const downloadImage = async () => {
  const { message } = await getRandomImage();
  const response = await fetch(message);
  const data = await response.blob();
  const objectURL = URL.createObjectURL(data);
  downloadedImages.push(objectURL);
};

// (async () => {
//   const { message } = await getRandomImage();
//   dogImage.src = message;
// })();
// changeImage();
// document.body.addEventListener('DOMContentLoaded', changeImage), false;
document.body.addEventListener("mouseover", highlightHoveredBones, false);
document.body.addEventListener("mouseout", unhighlightHoveredBones, false);
document.body.addEventListener("click", rate, false);
//rateButton.addEventListener('click', changeImage, false);
rateButton.addEventListener("click", changeImageFromDownloaded, false);

// first working attempt that added event listeners to each bone

// for (bone of boneList) {
//   bone.addEventListener('mouseenter', event => {
//     selectedBone = event.target;
//     console.log(selectedBone.matches('.bone'))
//     selectedBone.classList.add('selected');
//     const boneNumber = Number(selectedBone.getAttribute('data-bone'));

//     for (let i = 0; i < boneNumber; i++) {
//       boneList[i].classList.add('selected');
//     }
//   });

//   bone.addEventListener('mouseleave', event => {
//     event.target.classList.remove('selected');

//     const boneNumber = Number(selectedBone.getAttribute('data-bone'));
//     for (let i = 0; i < boneNumber; i++) {
//       boneList[i].classList.remove('selected');
//     }
//   });
// }

// for (bone of boneList) {
//   bone.addEventListener('click', event => {
//     });
// }
