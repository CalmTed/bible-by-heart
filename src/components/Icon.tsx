import { FC } from "react";
import {
  iconAdd,
  iconBack,
  iconBellGradient,
  iconBellOutline,
  iconClock,
  iconCross,
  iconDone,
  iconFilter,
  iconForward,
  iconSearch,
  iconSelectArrow,
  iconSort
} from "./icondata";
import React, { SvgXml } from "react-native-svg";

export enum IconName {
  back = "iconBack",
  add = "iconAdd",
  done = "iconDone",
  search = "iconSearch",
  filter = "iconFilter",
  selectArrow = "iconSelectArrow",
  bellOutline = "iconBellOutline",
  bellGradient = "iconBellGradient",
  cross = "iconCross",
  sort = "iconSort",
  forward = "iconForward",
  clock = "iconCLock"
}

const IconData = {
  [IconName.back]: iconBack,
  [IconName.add]: iconAdd,
  [IconName.done]: iconDone,
  [IconName.search]: iconSearch,
  [IconName.filter]: iconFilter,
  [IconName.selectArrow]: iconSelectArrow,
  [IconName.bellOutline]: iconBellOutline,
  [IconName.bellGradient]: iconBellGradient,
  [IconName.cross]: iconCross,
  [IconName.sort]: iconSort,
  [IconName.forward]: iconForward,
  [IconName.clock]: iconClock
};

export const Icon: FC<{ iconName: IconName; color?: string }> = ({
  iconName,
  color = "#ECECEC"
}) => {
  return (
    <SvgXml
      xml={IconData[iconName].replace(/#ECECEC/gi, color)}
      width="18"
      height="18"
    />
  );
};
