import React, { FC, useState } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { SelectModal } from "./SelectModal";
import { useAppContext } from "../context/AppContext";
import { OptionModel } from "../models";

interface SelectModel {
  options: OptionModel[];
  selectedIndex: number | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export const Select: FC<SelectModel> = ({
  options,
  selectedIndex,
  onSelect,
  disabled = false
}) => {
  const { theme } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const handleSelect = (value: string) => {
    setIsOpen(false);
    onSelect(value);
  };
  const selectStyle = StyleSheet.create({
    wrapper: {
      backgroundColor: theme.colors.bgSecond,
      borderRadius: 22,
      alignItems: "center",
      padding: 2
    },
    label: {
      color: theme.colors.text,
      fontSize: 18,
      paddingHorizontal: 20,
      paddingVertical: 10,
      fontWeight: "500"
    },
    labelDisabled: {
      color: theme.colors.textSecond
    }
  });
  return (
    <View style={selectStyle.wrapper}>
      <Pressable onPress={() => (!disabled ? setIsOpen(true) : null)}>
        <Text
          style={{
            ...selectStyle.label,
            ...(disabled ? selectStyle.labelDisabled : {})
          }}
        >
          {options[selectedIndex || 0]?.label || "---"}
        </Text>
      </Pressable>
      <SelectModal
        isShown={isOpen}
        options={options}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        onCancel={() => setIsOpen(false)}
      />
    </View>
  );
};
