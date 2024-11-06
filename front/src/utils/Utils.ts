import { Msg } from "@/types/Msg";

export const dataURItoBlob = (msg: Msg): Blob => {
  const byteString: string = atob(msg.data!.split(',')[1]);

  const ab: ArrayBuffer = new ArrayBuffer(byteString.length);
  const ua: Uint8Array = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; ++i)
    ua[i] = byteString.charCodeAt(i);

  return new Blob([ab], { type: msg.type });
}

export const timeString = () => {
  let d = new Date();
  let M = twoDigitString(d.getMonth()+1);
  let day = twoDigitString(d.getDate());
  let h = twoDigitString(d.getHours());
  let m = twoDigitString(d.getMinutes());
  let s = twoDigitString(d.getSeconds());
  return d.getFullYear()+M+day+h+m+s;
}

export const twoDigitString = (n: number) => {
  let result = ''+n;
  if (n<10) result = '0'+result;
  return result;
}

export const appendBeforeExtension = (fileName: string, stringToAdd: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
      return fileName + stringToAdd;
  }

  const nameWithoutExtension = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex);

  return nameWithoutExtension + stringToAdd + extension;
}