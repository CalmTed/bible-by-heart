import { render } from "@testing-library/react-native";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { ARCHIVED_NAME, LANGCODE, THEMETYPE } from "../../src/constants";
import { createT } from "../../src/l10n";
import { SettingsMenuItem } from "../../src/components/setttingsMenuItem";

describe("testing settings menu item", () => {
  const theme = getThemeFromScheme(THEMETYPE.dark);
  const t = createT(LANGCODE.ua);
  const actionItem = (
    <SettingsMenuItem
      theme={theme}
      type="action"
      subtext={t("settsOneWayDoor")}
      header={t("settsClearPassages")}
      actionCallBack={() => {}}
    />
  );
  const checkboxItem = (
    <SettingsMenuItem
      theme={theme}
      header={t("settsDevMode")}
      subtext={t("settsEnabled")}
      type="checkbox"
      checkBoxState={true}
      onClick={(isChecked) => {}}
    />
  );
  const labelItem = (
    <SettingsMenuItem
      theme={theme}
      header={t("settsLabelAbout")}
      type="label"
    />
  );
  const allTags = ["tag1", "tag2"];
  const selectItem = (
    <SettingsMenuItem
      theme={theme}
      header={t("settsLeftSwipeTag")}
      subtext={t(ARCHIVED_NAME)}
      type="select"
      options={["tag1", "tag2"].map((v) => {
        return {
          value: v,
          label: v === ARCHIVED_NAME ? t(v) : v
        };
      })}
      selectedIndex={allTags.indexOf(allTags[0])}
      onSelect={() => {}}
    />
  );
  const textInputItem = (
    <SettingsMenuItem
      theme={theme}
      header={t("settsTrainModeNameInput")}
      type="textinput"
      value={"trainModeName"}
      onChange={() => {}}
      maxLength={20}
    />
  );
  const tagListItem = (
    <SettingsMenuItem
      theme={theme}
      t={t}
      header={t("settsTrainModeIncludeTagsHeader")}
      type="taglist"
      optionsList={allTags}
      valuesList={allTags}
      onListChange={(includeTags) => {}}
      disabled={false}
    />
  );
  it("renders action correctly", async () => {
    const tree = render(actionItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders checkbox correctly", async () => {
    const tree = render(checkboxItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders label correctly", async () => {
    const tree = render(labelItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders select correctly", async () => {
    const tree = render(selectItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders textInput correctly", async () => {
    const tree = render(textInputItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders tagList correctly", async () => {
    const tree = render(tagListItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
