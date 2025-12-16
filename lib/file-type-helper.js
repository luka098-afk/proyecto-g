import fileType from "file-type";

export async function fileTypeFromBuffer(buffer) {
  return await fileType.fromBuffer(buffer);
}
