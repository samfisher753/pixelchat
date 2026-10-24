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