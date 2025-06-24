import { FC } from "react";
import {
  iconAdd,
  iconBack,
  iconBellGradient,
  iconBellOutline,
  iconClock,
  iconCloud,
  iconCloudAttention,
  iconCloudError,
  iconCloudLoading,
  iconCloudSuccess,
  iconCross,
  iconDone,
  iconFilter,
  iconForward,
  iconGreenCheck,
  iconRedCross,
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
  clock = "iconCLock",
  cloud = "iconCloud",
  cloudAttention = "iconCloudAttention",
  cloudLoading = "iconCloudLoading",
  cloudSuccess = "iconCloudSuccess",
  cloudError = "iconCloudError",
  redCross = "iconRedCross",
  greenCheck = "iconGreenCheck",
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
  [IconName.clock]: iconClock,
  [IconName.cloud]: iconCloud,
  [IconName.cloudAttention]: iconCloudAttention,
  [IconName.cloudLoading]: iconCloudLoading,
  [IconName.cloudSuccess]: iconCloudSuccess,
  [IconName.cloudError]: iconCloudError,
  [IconName.redCross]: iconRedCross,
  [IconName.greenCheck]: iconGreenCheck,



};

export const Icon: FC<{ iconName: IconName; color?: string; size?: number}> = ({
  iconName,
  color = "#ECECEC",
  size = 18
}) => {
  return (
    <SvgXml
      xml={IconData[iconName].replace(/#ECECEC/gi, color)}
      width={size}
      height={size}
    />
  );
};
