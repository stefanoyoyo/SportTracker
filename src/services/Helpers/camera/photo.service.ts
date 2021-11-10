import { Injectable } from '@angular/core';
import { Camera, CameraPhoto, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { DbEntities } from 'src/services/Enums/DbEntitities';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = DbEntities[DbEntities.PHOTO_STORAGE];

  constructor() { }

  /**Method to open camera and shotting a picture */
  public async addNewToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    // Save the picture and add it to photo collection
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(Object.assign(savedImageFile));

    return capturedPhoto;
  }

  /**Method saving the shotted pictures to the ionic storage.
     Method to be called after addNewToGallery method. */
  public async savePhoto(savedImageFile: object, key: string) {
    
    const db =  (await Storage.get({key: key})).value; 
    const parsed = JSON.parse(db);
    parsed.push(savedImageFile);

    const obj = {
      key: key,
      value: JSON.stringify(parsed)
    }
    Storage.set(obj);

    return true;
  }

  //#region save picture on device

  /**Method to save the shotted picture in a local array of photoes */
  public async savePicture(cameraPhoto: CameraPhoto) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    /* RECUPERO L'IMMAGINE IN FORMATO FILE BLOB DAL SUO URL */
    let blob: Blob = await fetch(cameraPhoto.webPath).then(r => r.blob());
    
    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      blobBase64: base64Data,
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    };
  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  //#endregion

  //#region load photos from storage
  public async loadSaved(): Promise<Photo[]> {
    // Retrieve cached photo array data
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];
    this.readPhotos(this.photos);
    return this.photos;
  }

  /**Method to read the specified photoes. */
  public async readPhotos(photos: Photo[]) {
    // Display the photo by reading into base64 format
    for (let photo of photos) {
      // Read each saved photo's data from the Filesystem
      const asObj = Object.assign(photo);
      const readFile = await Filesystem.readFile({
        path: asObj.filepath,
        directory: Directory.Data
      });

      // Web platform only: Load the photo as base64 data
      asObj.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }
  //#endregion

  blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

}
