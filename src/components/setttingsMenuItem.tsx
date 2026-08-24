import React, { FC, useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { OptionModel } from "../models";
import { SelectModal } from "./SelectModal";
import { useAppContext } from "../context/AppContext";
import { Input } from "./Input";
import { TagItem } from "./PassageEditor";
import { ARCHIVED_NAME } from "../constants";
import { Checkbox } from "./Checkbox";

type SettingsMenuItemModel =
  | {
      header: string;
      subtext: string;
      type: "action";
      actionCallBack: () => void; //aka open modal
      disabled?: boolean;
    }
  | {
      header: string;
      subtext: string;
      type: "checkbox";
      checkBoxState: boolean;
      onClick: (newState: boolean) => void;
      disabled?: boolean;
    }
  | {
      header: string;
      subtext: string;
      type: "select";
      selectedIndex: number;
      options: OptionModel[];
      onSelect: (selectedValue: string) => void;
      disabled?: boolean;
    }
  | {
      header: string;
      type: "textinput";
      value: string;
      onChange: (selectedValue: string) => void;
      onEndEditing?: (selectedValue: string) => void;
      maxLength?: number;
      disabled?: boolean;
      autoComplete?:
        | "birthdate-day"
        | "birthdate-full"
        | "birthdate-month"
        | "birthdate-year"
        | "cc-csc"
        | "cc-exp"
        | "cc-exp-day"
        | "cc-exp-month"
        | "cc-exp-year"
        | "cc-number"
        | "email"
        | "gender"
        | "name"
        | "name-family"
        | "name-given"
        | "name-middle"
        | "name-middle-initial"
        | "name-prefix"
        | "name-suffix"
        | "password"
        | "password-new"
        | "postal-address"
        | "postal-address-country"
        | "postal-address-extended"
        | "postal-address-extended-postal-code"
        | "postal-address-locality"
        | "postal-address-region"
        | "postal-code"
        | "street-address"
        | "sms-otp"
        | "tel"
        | "tel-country-code"
        | "tel-national"
        | "tel-device"
        | "username"
        | "username-new"
        | "off";
      autoCorrect?: boolean;
    }
  | {
      header: string;
      type: "taglist";
      optionsList: string[];
      valuesList: string[];
      onListChange: (newList: string[]) => void;
      maxLength?: number;
      maxNumber?: number;
      disabled?: boolean;
    }
  | {
      header: string;
      type: "label";
    };

export const SettingsMenuItem: FC<SettingsMenuItemModel> = (data) => {
  const { theme, t } = useAppContext();
  const [selectOpen, setSelectOpen] = useState(false);
  const [tagSelectOpen, setTagSelectOpen] = useState(false);

  const handleOpenSelectList = () => {
    setSelectOpen(true);
  };
  const handleOptionSelect = (value: string) => {
    setSelectOpen(false);
    if (data.type === "select") {
      data.onSelect(value);
    }
  };
  const settingsMenuItemStyles = StyleSheet.create({
    view: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15
    },
    labelView: {
      alignItems: "flex-end",
      paddingTop: 25,
      paddingBottom: 0
      // paddingVertical: 5,
    },
    header: {
      color: theme.colors.text,
      fontSize: 21,
      fontWeight: "600"
    },
    subtext: {
      color: theme.colors.textSecond,
      fontSize: 14
    },
    label: {
      color: theme.colors.textSecond,
      fontSize: 14,
      textTransform: "uppercase",
      fontWeight: "600"
    },
    checkBoxView: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%"
    },
    chrckBoxTextView: {
      maxWidth: "80%"
    },
    halfOpacity: {
      opacity: 0.5
    },
    tagListWrapper: {
      flexDirection: "row",
      flexWrap: "wrap"
    }
  });
  return (
    <View
      style={{
        ...settingsMenuItemStyles.view,
        ...(data.type === "label" ? settingsMenuItemStyles.labelView : {})
      }}
    >
      {data.type === "label" && (
        <Text style={settingsMenuItemStyles.label}>{data.header}</Text>
      )}
      {data.type === "action" && (
        <Pressable
          style={{
            ...{ width: "100%" },
            ...(data.disabled ? { opacity: 0.5 } : {})
          }}
          onPress={data.actionCallBack}
          disabled={data.disabled}
        >
          <Text style={settingsMenuItemStyles.header}>{data.header}</Text>
          <Text style={settingsMenuItemStyles.subtext}>{data.subtext}</Text>
        </Pressable>
      )}
      {data.type === "checkbox" && (
        <Pressable
          onPress={() => data.onClick(!data.checkBoxState)}
          style={{
            ...settingsMenuItemStyles.checkBoxView,
            ...(data.disabled ? { opacity: 0.5 } : {})
          }}
          disabled={data.disabled}
        >
          <View style={settingsMenuItemStyles.chrckBoxTextView}>
            <Text style={settingsMenuItemStyles.header}>{data.header}</Text>
            <Text style={settingsMenuItemStyles.subtext}>{data.subtext}</Text>
          </View>
          <View>
            <Checkbox isEnabled={data.checkBoxState}></Checkbox>
          </View>
        </Pressable>
      )}
      {data.type === "select" && (
        <View style={{ ...theme.theme.fullWidth }}>
          <Pressable
            onPress={handleOpenSelectList}
            style={{
              ...(data.disabled ? settingsMenuItemStyles.halfOpacity : {})
            }}
            disabled={data.disabled}
          >
            <Text style={settingsMenuItemStyles.header}>{data.header}</Text>
            <Text style={settingsMenuItemStyles.subtext}>{data.subtext}</Text>
          </Pressable>
          <SelectModal
            isShown={selectOpen}
            options={data.options}
            selectedIndex={data.selectedIndex}
            onSelect={handleOptionSelect}
            onCancel={() => setSelectOpen(false)}
          />
        </View>
      )}
      {data.type === "textinput" && (
        <View style={{ ...theme.theme.fullWidth }}>
          <Text style={settingsMenuItemStyles.subtext}>{data.header}:</Text>
          <Input
            value={data.value}
            onChange={data.onChange}
            onEndEditing={data.onEndEditing}
            placeholder={data.header}
            maxLength={data.maxLength}
            disabled={data.disabled}
            autoComplete={data.autoComplete}
            autoCorrect={data.autoCorrect}
          />
        </View>
      )}

      {data.type === "taglist" && (
        <View style={{ ...theme.theme.fullWidth }}>
          <Text style={settingsMenuItemStyles.subtext}>{data.header}:</Text>
          <View style={{ ...settingsMenuItemStyles.tagListWrapper }}>
            {[
              <TagItem
                key={"addNew"}
                title={"+"}
                onPress={() => setTagSelectOpen(true)}
                disabled={!data.optionsList.length}
              />,
              ...data.valuesList.map((p) => (
                <TagItem
                  key={p}
                  title={p === ARCHIVED_NAME ? t("Archived") : p.slice(0, 20)}
                  onRemove={() =>
                    data.onListChange(data.valuesList.filter((v) => v !== p))
                  }
                  disabled={data.disabled}
                />
              ))
            ]}
          </View>
          <SelectModal
            isShown={tagSelectOpen}
            options={data.optionsList.map((v) => ({
              value: v,
              label: v === ARCHIVED_NAME ? t("Archived") : v
            }))}
            selectedIndex={null}
            onSelect={(newVal) => {
              setTagSelectOpen(false);
              data.onListChange([...data.valuesList, newVal]);
            }}
            onCancel={() => setTagSelectOpen(false)}
          />
        </View>
      )}
    </View>
  );
};
