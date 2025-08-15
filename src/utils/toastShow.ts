import { Platform, ToastAndroid } from "react-native";

const toastShow: (message: string, duration?: number) => void = (
  message,
  duration = 10000
) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, duration);
  }
};
export default toastShow;
