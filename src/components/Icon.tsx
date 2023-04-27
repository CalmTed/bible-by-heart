import { FC } from "react";
import { iconAdd, iconBack, iconBellGradient, iconBellOutline, iconDone, iconFilter, iconSearch, iconSelectArrow } from "./icondata";
import { SvgXml } from "react-native-svg";

export enum IconName {
  back = iconBack,
  add = iconAdd,
  done = iconDone,
  search = iconSearch,
  filter = iconFilter,
  selectArrow = iconSelectArrow,
  bellOutline = iconBellOutline,
  bellGradient = iconBellGradient
}

export const Icon: FC<{iconName: IconName}> = ({iconName}) => {

  return <SvgXml xml={iconName} width="18" height="18"/>;
}