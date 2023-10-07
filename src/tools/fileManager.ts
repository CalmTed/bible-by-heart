import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';


import { StorageAccessFramework } from 'expo-file-system';


export const writeFile: (name: string, content: string, fileMIME?: string) => Promise<boolean>  = async (fileName, content, fileMIME = 'text/plain') => {
  try{
    const folder = await StorageAccessFramework.requestDirectoryPermissionsAsync(FileSystem.documentDirectory);

    if(!folder.granted){
      return false;
    }
    console.log(fileMIME)
    const selectedURI = await StorageAccessFramework.createFileAsync(folder.directoryUri, fileName, fileMIME)
    if(!selectedURI){
      return false
    }
    
    console.log("saving to ", selectedURI)
    await FileSystem.writeAsStringAsync(selectedURI, content, { encoding: FileSystem.EncodingType.UTF8 });
    return true;

  } catch (error) {
    console.error(error)
    return false
  }
}

export const readFile: (fileMIME?: string | string[]) => Promise<{content: string, mimeType: string} | false>  = async (fileMIME = "text/plain") => {
  try{
    console.log(fileMIME)
    const file = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: fileMIME
    });
    if(file.canceled || !file.assets[0].uri || !file.assets[0].mimeType){
      return false;
    }
    const text = await StorageAccessFramework.readAsStringAsync(file.assets[0].uri);

    return {
      content: text,
      mimeType: file.assets[0].mimeType
    }
  } catch (error) {
    console.error(error)
    return false
  }
}