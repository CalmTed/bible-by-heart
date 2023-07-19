// import * as RNFS from "react-native-fs";

// export const readFile = () => {
//   RNFS.readDir(RNFS.DocumentDirectoryPath)
//     .then((result) => {
//       console.log("GOT RESULT", result);
//       return Promise.all([RNFS.stat(result[0].path), result[0].path]);
//     })
//     .then((statResult) => {
//       if (statResult[0].isFile()) {
//         return RNFS.readFile(statResult[1], "utf8");
//       }
//       return "no file";
//     })
//     .then((contents) => {
//       console.log(contents);
//     })
//     .catch((err) => {
//       console.log(err.message, err.code);
//     });
// };
