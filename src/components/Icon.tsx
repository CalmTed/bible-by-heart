import { FC } from "react";
import { iconAdd, iconBack, iconBellGradient, iconBellOutline, iconCross, iconDone, iconFilter, iconSearch, iconSelectArrow } from "./icondata";
import { SvgXml } from "react-native-svg";

export enum IconName {
  back = iconBack,
  add = iconAdd,
  done = iconDone,
  search = iconSearch,
  filter = iconFilter,
  selectArrow = iconSelectArrow,
  bellOutline = iconBellOutline,
  bellGradient = iconBellGradient,
  cross = iconCross
}

export const Icon: FC<{iconName: IconName, color?: string}> = ({iconName, color}) => {

  return <SvgXml xml={iconName} width="18" height="18" stroke={color}/>;
}