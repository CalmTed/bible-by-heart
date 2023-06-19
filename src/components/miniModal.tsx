import React, {FC} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import { ThemeAndColorsModel } from 'src/tools/getTheme';

interface MiniModalModel {
  shown: boolean
  handleClose: () => void
  theme: ThemeAndColorsModel
  children?: React.ReactNode
}

export const MiniModal:FC<MiniModalModel> = ({shown, children, handleClose, theme}) => {
  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.bgBackdrop,
      backfaceVisibility: "hidden"
    },
    modalView: {
      margin: 0,
      backgroundColor: theme.colors.bg,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      alignItems: 'center',
      shadowColor: theme.colors.bgBackdrop,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
      gap: 10
    },
  });
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={shown}
      onRequestClose={handleClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

