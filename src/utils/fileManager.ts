import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";

import { StorageAccessFramework } from "expo-file-system/legacy";
import { logger } from "./logger";

export const writeFile: (
  name: string,
  content: string,
  fileMIME?: string
) => Promise<boolean> = async (fileName, content, fileMIME = "text/plain") => {
  try {
    const folder =
      await StorageAccessFramework.requestDirectoryPermissionsAsync(
        FileSystem.documentDirectory
      );

    if (!folder.granted) {
      return false;
    }
    const selectedURI = await StorageAccessFramework.createFileAsync(
      folder.directoryUri,
      fileName,
      fileMIME
    );
    if (!selectedURI) {
      return false;
    }

    await FileSystem.writeAsStringAsync(selectedURI, content, {
      encoding: FileSystem.EncodingType.UTF8
    });
    return true;
  } catch (error) {
    logger.error(`File manager writing error: ${error}`);
    return false;
  }
};

/**
 * Read a file the app was HANDED rather than one the user picked: an Android
 * VIEW intent arrives as a `content://` (or `file://`) URI that is already
 * readable, with no picker in between.
 *
 * @returns the text, or false when the URI is unreadable - which is the normal
 * outcome for every VIEW intent that is not a file at all.
 */
export const readFileAtUri: (uri: string) => Promise<string | false> = async (
  uri
) => {
  try {
    return await StorageAccessFramework.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (error) {
    logger.write(`Nothing readable at the opened URI: ${error}`);
    return false;
  }
};

export const readFile: (
  fileMIME?: string | string[]
) => Promise<{ content: string; mimeType: string } | false> = async (
  fileMIME = "text/plain"
) => {
  try {
    const file = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: fileMIME
    });
    if (file.canceled || !file.assets[0].uri) {
      return false;
    }
    const text = await StorageAccessFramework.readAsStringAsync(
      file.assets[0].uri
    );

    return {
      content: text,
      // A missing mimeType is no longer a refusal: a provider that does not
      // recognise the app's own .bbhbackup extension reports none, and the file
      // it just handed over is perfectly readable. What is IN it decides.
      mimeType: file.assets[0].mimeType ?? ""
    };
  } catch (error) {
    logger.error(`File manager reading error: ${error}`);
    return false;
  }
};
