/* eslint-disable no-console */
import { default as axios } from 'axios';
import * as fs from 'node:fs';

// it seems that later they added some just plain images of parent breeds
// and there is a separate group of images for these now. This isn't how
// it is for the other parent breeds such as hounds. There isn't just a
// plain 'hound' group with images. Collie parent breed existed from the
// stanford dataset but they have their own images

// const missingParentbreeds = ['collie', 'corgi', 'greyhound', 'schnauzer'];

// pug includes puggle images, and pointer-german includes pointer-germanlonghair
// these are duplicates and need to be removed since they have they own breed
// Including missingParentbreeds in here too as they have duplicates needing removed
// !!!  not doing this anymore, just going to loop through everybreed to remove dups to future proof
//const breedsNeedingDupsRemoved = [...missingParentbreeds, 'pug', 'pointer-german']

const getBreeds = async (): Promise<
  { [key: string]: string[] } | undefined
> => {
  try {
    const response = await axios.get('https://dog.ceo/api/breeds/list/all');
    if (!response.data.message) {
      throw new Error('No breeds found');
    }
    return response.data.message;
  } catch (error) {
    console.error(error);
  }
};

const getFullBreedList = async () => {
  const breeds = await getBreeds();
  const breedList = [];
  for (const breed in breeds) {
    breedList.push(breed);
    breeds[breed].forEach((subBreed) => {
      breedList.push(`${breed}-${subBreed}`);
    });
  }

  return breedList;
};

const getAllImages = async () => {
  const breedList = await getFullBreedList();
  /**
   * @type {Object.<string, string[]>}
   */
  const breedImages: { [s: string]: string[] } = {};
  const imagePromises = [];

  for (const breed of breedList) {
    if (!breed.includes('-')) {
      try {
        imagePromises.push(
          axios.get(`https://dog.ceo/api/breed/${breed}/images`),
        );
      } catch (error) {
        console.error(error);
      }
    } else {
      const [master, sub] = breed.split('-');
      try {
        imagePromises.push(
          axios.get(`https://dog.ceo/api/breed/${master}/${sub}/images`),
        );
      } catch (error) {
        console.error(error);
      }
    }
  }
  const imagesResponses = await Promise.all(imagePromises);
  for (let i = 0; i < breedList.length; i++) {
    // add a check for if message is null, log error if not?
    breedImages[breedList[i]] = imagesResponses[i].data.message;
  }

  // Remove extra repeat images of subbreeds under parent breed
  // as well as the couple breeds incorrectly containing other breeds images
  // Now just looping thorough all the breeds to check duiplicates to help
  // with future proofing
  // before looped on manually created breedsNeedingDupsRemoved array
  for (const breed of Object.keys(breedImages)) {
    breedImages[breed] = breedImages[breed].filter((image) => {
      const imageUrl = new URL(image);
      // get the breed portion from the url. if for example corgi images
      // contain corgi-cardigan images since we already have them in their
      // own group then they need to be removed in the corgi group.
      // pug also needs puggle images removed, similar case for pointer-german.
      const breedPath = imageUrl.pathname.split('/')[2];
      return breedPath === breed;
    });
  }

  return breedImages;
};

const writeBreedImagesToFile = async () => {
  console.time('Time');
  const breedImages = await getAllImages();
  console.log('Images retrieved!');
  console.timeLog('Time');
  console.log('Writing file...');
  fs.writeFileSync('./breed-images.json', JSON.stringify(breedImages, null, 2));
  console.log('Done writing file!');
  console.timeEnd('Time');
  process.exit();
};

writeBreedImagesToFile();
