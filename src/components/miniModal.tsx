import React, { FC } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { ThemeAndColorsModel } from "src/tools/getTheme";

interface MiniModalModel {
  shown: boolean;
  handleClose: () => void;
  theme: ThemeAndColorsModel;
  children?: React.ReactNode;
  style?: StyleSheet.NamedStyles<{}>;
}

export const MiniModal: FC<MiniModalModel> = ({
  shown,
  children,
  handleClose,
  theme,
  style: customStyles
}) => {
  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.bgBackdrop,
      backfaceVisibility: "hidden"
    },
    modalView: {
      margin: 0,
      backgroundColor: theme.colors.bg,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      alignItems: "center",
      shadowColor: theme.colors.bgBackdrop,
      shadowOffset: {
        width: 0,
        height: 0
      },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
      gap: 10
    }
  });
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={shown}
      onRequestClose={handleClose}
    >
      <Pressable
        style={styles.centeredView}
        onPress={() => {
          /* haven't make closing handler b.c. any modal press triggers it */
        }}
      >
        <View style={{ ...styles.modalView, ...customStyles }}>{children}</View>
      </Pressable>
    </Modal>
  );
};
