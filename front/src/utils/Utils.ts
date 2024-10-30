import { Msg } from "@/types/Msg";

export const dataURItoBlob = (msg: Msg): Blob => {
  const byteString: string = atob(msg.data!.split(',')[1]);

  const ab: ArrayBuffer = new ArrayBuffer(byteString.length);
  const ua: Uint8Array = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; ++i)
    ua[i] = byteString.charCodeAt(i);

  return new Blob([ab], { type: msg.type });
}