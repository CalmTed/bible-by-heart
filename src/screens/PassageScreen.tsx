import React, { FC, useState } from "react";
import { View } from "react-native";
import { useAppContext } from "../context/AppContext";
import { PassageEditor } from "../components/PassageEditor";
import { createAddress, createPassage } from "../initials";
import { ActionName, PassageModel, ScreenPropsModel } from "../models";
import { reduce } from "../utils/reduce";
import { SCREEN } from "../constants";

// The passage editor used to be a <Modal> nested in listScreen, which lost its
// draft whenever the surrounding screen re-rendered. It is now a real stack
// screen: state lives in AppContext, and the editor keeps a local draft that is
// only committed on Save (with a discard-confirm on back). Route params carry
// only what identifies/seeds the passage — never app state; their shape is
// `PassageScreenParamsModel` in the root param list (models.ts, 8.1.14).
export const PassageScreen: FC<ScreenPropsModel<SCREEN.passage>> = ({
  route,
  navigation
}) => {
  const { state, setState, theme } = useAppContext();
  const params = route.params ?? {};

  // Freeze the source passage ONCE at mount. Rebuilding it per render would mint
  // a new random id every time (createPassage) and desync PassageEditor's draft.
  // PassageEditor clones this into its own editable draft.
  const [{ sourcePassage, isNew }] = useState<{
    sourcePassage: PassageModel;
    isNew: boolean;
  }>(() => {
    // Deep links deliver :passageId as a string ("bbh://passage/12"); in-app
    // navigation passes a real number. Normalise before matching by id, or the
    // strict `p.id === passageId` never hits and the editor opens "add new".
    const passageId =
      typeof params.passageId === "string"
        ? Number(params.passageId)
        : params.passageId;
    const existing =
      typeof passageId !== "undefined" && !Number.isNaN(passageId)
        ? state.passages.find((p) => p.id === passageId)
        : undefined;
    return {
      isNew: !existing,
      sourcePassage:
        existing ??
        createPassage(
          params.address ?? createAddress(),
          params.passageText ?? "",
          typeof params.translationId !== "undefined"
            ? params.translationId
            : state.settings.translations.find((tr) => tr.isDefault)?.id,
          state.userData.uuid !== null ? state.userData.uuid : undefined
        )
    };
  });

  const handleSave = (passage: PassageModel) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.setPassage,
        payload: passage
      });
      return newState ? newState : prv;
    });
    navigation.navigate(SCREEN.listPassage);
  };

  const handleRemove = (id: number) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.removePassage,
        payload: id
      });
      return newState ? newState : prv;
    });
    navigation.navigate(SCREEN.listPassage);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <PassageEditor
        state={state}
        passage={sourcePassage}
        isNew={isNew}
        onConfirm={handleSave}
        onRemove={handleRemove}
        onBack={handleBack}
      />
    </View>
  );
};
