import React, { FC } from "react";
import { Text, View } from "react-native";
import { ThemeAndColorsModel } from "../utils/getThemeFromScheme";
import { MiniModal } from "./miniModal";
import { Button } from "./Button";

interface ConfirmModalModel {
  shown: boolean;
  theme: ThemeAndColorsModel;
  text: string;
  confirmTitle: string;
  cancelTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  // destructive actions default to red; pass "green" for neutral confirmations
  confirmColor?: "green" | "red" | "gray";
}

// Reusable confirmation dialog for destructive/irreversible actions.
// Built on MiniModal so it renders above whichever surface triggered it.
export const ConfirmModal: FC<ConfirmModalModel> = ({
  shown,
  theme,
  text,
  confirmTitle,
  cancelTitle,
  onConfirm,
  onCancel,
  confirmColor = "red"
}) => {
  return (
    <MiniModal theme={theme} shown={shown} handleClose={onCancel}>
      <Text style={{ ...theme.theme.text, fontSize: 18 }}>{text}</Text>
      <View
        style={{
          ...theme.theme.rowView,
          ...theme.theme.marginVertical,
          ...theme.theme.gap20
        }}
      >
        <Button
          theme={theme}
          onPress={onCancel}
          type="secondary"
          title={cancelTitle}
        />
        <Button
          theme={theme}
          onPress={onConfirm}
          type="main"
          color={confirmColor}
          title={confirmTitle}
        />
      </View>
    </MiniModal>
  );
};
