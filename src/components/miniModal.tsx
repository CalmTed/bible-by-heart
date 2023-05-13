import React, {FC} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import { COLOR } from '../constants';

interface MiniModalModel {
  shown: boolean
  handleClose: () => void
  children?: React.ReactNode
}

export const MiniModal:FC<MiniModalModel> = ({shown, children, handleClose}) => {
  // const [modalVisible, setModalVisible] = useState(false);
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

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.bgBackdrop,
    backfaceVisibility: "hidden"
  },
  modalView: {
    margin: 20,
    backgroundColor: COLOR.bg,
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});