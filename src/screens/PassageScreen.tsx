import React, { FC, useState } from "react";
import { View } from "react-native";
import { useAppContext } from "../context/AppContext";
import { PassageEditor } from "../components/PassageEditor";
import { ConfirmModal } from "../components/ConfirmModal";
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
  const { state, setState, t, theme } = useAppContext();
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

  // "Study this one" (8.2.1c). The offer is held as the id of the passage it
  // targets rather than a boolean, so the session is generated for the passage
  // that was actually just saved.
  const [studyOfferPassageId, setStudyOfferPassageId] = useState<number | null>(
    null
  );

  const handleSave = (passage: PassageModel) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.setPassage,
        payload: passage
      });
      return newState ? newState : prv;
    });
    // Offer the drill only where it means something: a passage the user has
    // just met for the first time, and one that has text to be tested on.
    // Editing an existing passage still leaves straight for the list.
    if (isNew && passage.verseText.trim().length) {
      setStudyOfferPassageId(passage.id);
      return;
    }
    navigation.navigate(SCREEN.listPassage);
  };

  const handleStudyOne = () => {
    const passageId = studyOfferPassageId;
    setStudyOfferPassageId(null);
    if (passageId === null) {
      return;
    }
    // The passage was committed by handleSave's setState above; this second
    // updater runs on that already-updated state, so the generator sees it.
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.generateStudyOneTests,
        payload: { passageId }
      });
      return newState ? newState : prv;
    });
    navigation.navigate(SCREEN.test);
  };

  const handleStudyLater = () => {
    setStudyOfferPassageId(null);
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
      <ConfirmModal
        shown={studyOfferPassageId !== null}
        text={t("StudyOneOfferText")}
        confirmTitle={t("StudyOneOfferConfirm")}
        cancelTitle={t("StudyOneOfferCancel")}
        confirmColor="green"
        onConfirm={handleStudyOne}
        onCancel={handleStudyLater}
      />
    </View>
  );
};
