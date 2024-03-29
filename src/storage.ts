import Storage from "react-native-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const storage = new Storage({
  size: 100,
  storageBackend: AsyncStorage,
  defaultExpires: null
});

export default storage;
