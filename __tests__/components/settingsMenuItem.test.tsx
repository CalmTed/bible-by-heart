import { renderWithContext } from "../../test-utils/renderWithContext";
import { ARCHIVED_NAME, LANGCODE } from "../../src/constants";
import { createT } from "../../src/l10n";
import { SettingsMenuItem } from "../../src/components/setttingsMenuItem";

describe("testing settings menu item", () => {
  const t = createT(LANGCODE.ua);
  const actionItem = (
    <SettingsMenuItem
      type="action"
      subtext={t("settsOneWayDoor")}
      header={t("settsClearPassages")}
      actionCallBack={() => {}}
    />
  );
  const checkboxItem = (
    <SettingsMenuItem
      header={t("settsDevMode")}
      subtext={t("settsEnabled")}
      type="checkbox"
      checkBoxState={true}
      onClick={(isChecked) => {}}
    />
  );
  const labelItem = (
    <SettingsMenuItem header={t("settsLabelAbout")} type="label" />
  );
  const allTags = ["tag1", "tag2"];
  const selectItem = (
    <SettingsMenuItem
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
      header={t("settsTrainModeNameInput")}
      type="textinput"
      value={"trainModeName"}
      onChange={() => {}}
      maxLength={20}
    />
  );
  const tagListItem = (
    <SettingsMenuItem
      header={t("settsTrainModeIncludeTagsHeader")}
      type="taglist"
      optionsList={allTags}
      valuesList={allTags}
      onListChange={(includeTags) => {}}
      disabled={false}
    />
  );
  it("renders action correctly", async () => {
    const tree = renderWithContext(actionItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders checkbox correctly", async () => {
    const tree = renderWithContext(checkboxItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders label correctly", async () => {
    const tree = renderWithContext(labelItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders select correctly", async () => {
    const tree = renderWithContext(selectItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders textInput correctly", async () => {
    const tree = renderWithContext(textInputItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
  it("renders tagList correctly", async () => {
    const tree = renderWithContext(tagListItem).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
